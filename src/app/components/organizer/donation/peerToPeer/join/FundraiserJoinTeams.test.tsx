import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CampaignTeamBrowse,
  CampaignTeamSummary,
} from 'app/interface/donationInter/campaignTeamDto';
import { buildJoinContext, buildJoinResult } from '../peerToPeerTestFactory';

const getFundraiserJoinContext = vi.fn();
const joinCampaignAsFundraiser = vi.fn();
const getCampaignTeams = vi.fn();
const ensureAuthenticated = vi.fn();

vi.mock('app/service/organizer/donation/fundraiserJoinService', () => ({
  getFundraiserJoinContext: (...args: unknown[]) => getFundraiserJoinContext(...args),
  joinCampaignAsFundraiser: (...args: unknown[]) => joinCampaignAsFundraiser(...args),
}));

vi.mock('app/service/organizer/donation/campaignTeamService', () => ({
  getCampaignTeams: (...args: unknown[]) => getCampaignTeams(...args),
}));

vi.mock('utils/auth', () => ({
  ensureAuthenticated: () => ensureAuthenticated(),
}));

const { default: FundraiserJoinPage } = await import('./FundraiserJoinPage');

const CAMPAIGN_ID = '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881';
const JOIN_PATH = `/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/join`;

const teamsCampaign = () => buildJoinContext({ areTeamsAllowed: true, campaignSlug: 'winter-appeal' });

const summary = (slug: string, name: string): CampaignTeamSummary => ({
  uniqueId: `id-${slug}`,
  slug,
  name,
  story: null,
  teamGoal: null,
  raisedAmount: 0,
  memberCount: 1,
  captainDisplayName: 'Sara Malik',
});

const browseWith = (...teams: CampaignTeamSummary[]): CampaignTeamBrowse => ({
  campaignName: 'Winter Appeal',
  campaignSlug: 'winter-appeal',
  campaignUniqueId: CAMPAIGN_ID,
  organizerName: 'Helping Hands',
  currencySymbol: '$',
  areTeamsAllowed: true,
  isFundraiser: false,
  isLeaderboardPublished: false,
  myTeamSlug: null,
  teams,
});

const renderPage = (search = '') =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[`${JOIN_PATH}${search}`]}>
        <Routes>
          <Route
            path="/donation/campaign/:campaignUniqueId/peer-to-peer/join"
            element={<FundraiserJoinPage />}
          />
          <Route path="/campaigns/:campaignSlug/teams/:teamSlug" element={<p>Team page</p>} />
          <Route path="/member/my-fundraising" element={<p>Fundraising console</p>} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

const waitForForm = () =>
  waitFor(() => expect(screen.getByLabelText(/Name on your page/i)).toBeInTheDocument());

const submit = () => userEvent.click(screen.getByRole('button', { name: /Create my page/i }));

beforeEach(() => {
  getFundraiserJoinContext.mockReset();
  joinCampaignAsFundraiser.mockReset();
  getCampaignTeams.mockReset();
  ensureAuthenticated.mockReset();
  ensureAuthenticated.mockReturnValue(true);
  getCampaignTeams.mockResolvedValue(browseWith(summary('night-runners', 'Night Runners')));
  joinCampaignAsFundraiser.mockResolvedValue(buildJoinResult());
  localStorage.setItem('userName', 'Sarah Khan');
});

afterEach(() => {
  localStorage.clear();
});

describe('The team question on the join screen', () => {
  /**
   * The rule the whole change exists for: a supporter is asked about a team while they are setting
   * their page up. A supporter who is never asked never joins one, whatever else the product offers
   * afterwards.
   */
  it('TeamQuestion_CampaignUsesTeams_IsAskedWhileThePageIsBeingSetUp', async () => {
    getFundraiserJoinContext.mockResolvedValue(teamsCampaign());

    renderPage();
    await waitForForm();

    expect(screen.getByRole('radio', { name: /On my own/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Join a team/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Start a team/i })).toBeInTheDocument();
  });

  /** A campaign that does not use teams must not be asked a question it has no answer to. */
  it('TeamQuestion_CampaignDoesNotUseTeams_IsNotAskedAndNoTeamsAreRead', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext({ areTeamsAllowed: false }));

    renderPage();
    await waitForForm();

    expect(screen.queryByRole('radio', { name: /Join a team/i })).not.toBeInTheDocument();
    expect(getCampaignTeams).not.toHaveBeenCalled();
  });

  /**
   * Somebody who followed a captain's link has already chosen. Making them find the same team again
   * in a list is the dead end this carries away.
   */
  it('TeamQuestion_ArrivedFromATeamLink_PreSelectsThatTeamWithoutBeingAskedTwice', async () => {
    getFundraiserJoinContext.mockResolvedValue(teamsCampaign());

    renderPage('?team=night-runners');
    await waitForForm();

    expect(screen.getByRole('radio', { name: /Join a team/i })).toBeChecked();
    await waitFor(() =>
      expect(screen.getByLabelText(/Which team\?/i)).toHaveValue('night-runners'),
    );
  });

  /**
   * The team address arrives in the address bar, so it is caller input. Anything outside the set a
   * slug is allocated from is discarded rather than passed on to the server as a team to join.
   */
  it('TeamQuestion_TeamAddressInTheLinkIsTampered_IsDiscardedRatherThanCarried', async () => {
    getFundraiserJoinContext.mockResolvedValue(teamsCampaign());

    renderPage('?team=night runners%3Cscript%3E');
    await waitForForm();

    expect(screen.getByRole('radio', { name: /On my own/i })).toBeChecked();
  });

  it('TeamQuestion_JoinChosenWithoutPickingATeam_ExplainsItselfAndSendsNothing', async () => {
    getFundraiserJoinContext.mockResolvedValue(teamsCampaign());

    renderPage();
    await waitForForm();

    await userEvent.click(screen.getByRole('radio', { name: /Join a team/i }));
    await submit();

    expect(await screen.findByText('Choose a team to join.')).toBeInTheDocument();
    expect(joinCampaignAsFundraiser).not.toHaveBeenCalled();
  });

  it('TeamQuestion_NewTeamLeftUnnamed_ExplainsItselfAndSendsNothing', async () => {
    getFundraiserJoinContext.mockResolvedValue(teamsCampaign());

    renderPage();
    await waitForForm();

    await userEvent.click(screen.getByRole('radio', { name: /Start a team/i }));
    await submit();

    expect(await screen.findByText('Enter a name for your team.')).toBeInTheDocument();
    expect(joinCampaignAsFundraiser).not.toHaveBeenCalled();
  });

  /** One submit carries both halves, so the server can write the page and the team together. */
  it('TeamQuestion_TeamStarted_SendsTheTeamAlongsideThePageInOneRequest', async () => {
    getFundraiserJoinContext.mockResolvedValue(teamsCampaign());

    renderPage();
    await waitForForm();

    await userEvent.click(screen.getByRole('radio', { name: /Start a team/i }));
    await userEvent.type(screen.getByLabelText(/Team name/i), 'Night Runners');
    await userEvent.type(screen.getByLabelText(/Team goal/i), '2500');
    await submit();

    await waitFor(() => expect(joinCampaignAsFundraiser).toHaveBeenCalled());
    expect(joinCampaignAsFundraiser).toHaveBeenCalledWith(
      CAMPAIGN_ID,
      expect.objectContaining({
        team: {
          kind: 'CreateNew',
          teamSlug: null,
          newTeam: { name: 'Night Runners', story: null, teamGoal: 2500 },
        },
      }),
    );
  });

  it('TeamQuestion_ExistingTeamPicked_SendsThatTeamAddress', async () => {
    getFundraiserJoinContext.mockResolvedValue(teamsCampaign());

    renderPage('?team=night-runners');
    await waitForForm();
    await waitFor(() =>
      expect(screen.getByLabelText(/Which team\?/i)).toHaveValue('night-runners'),
    );

    await submit();

    await waitFor(() => expect(joinCampaignAsFundraiser).toHaveBeenCalled());
    expect(joinCampaignAsFundraiser).toHaveBeenCalledWith(
      CAMPAIGN_ID,
      expect.objectContaining({
        team: { kind: 'JoinExisting', teamSlug: 'night-runners', newTeam: null },
      }),
    );
  });

  /** Fundraising alone stays a first-class answer rather than the absence of one. */
  it('TeamQuestion_LeftOnMyOwn_SendsNoTeam', async () => {
    getFundraiserJoinContext.mockResolvedValue(teamsCampaign());

    renderPage();
    await waitForForm();
    await submit();

    await waitFor(() => expect(joinCampaignAsFundraiser).toHaveBeenCalled());
    expect(joinCampaignAsFundraiser).toHaveBeenCalledWith(
      CAMPAIGN_ID,
      expect.objectContaining({ team: { kind: 'None', teamSlug: null, newTeam: null } }),
    );
  });

  /**
   * Being told the page exists but not whether the team half happened is what sends a supporter
   * looking. The outcome names the team and offers the way to it.
   */
  it('TeamQuestion_PageCreatedInATeam_NamesTheTeamAndOffersTheWayToIt', async () => {
    getFundraiserJoinContext.mockResolvedValue(teamsCampaign());
    joinCampaignAsFundraiser.mockResolvedValue(
      buildJoinResult({ teamSlug: 'night-runners', teamName: 'Night Runners' }),
    );

    renderPage();
    await waitForForm();
    await submit();

    expect(await screen.findByText(/Your page is in Night Runners/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Go to my team' }));

    expect(await screen.findByText('Team page')).toBeInTheDocument();
  });

  /**
   * A follow-up belongs to the answer that asks for it. Rendered below the whole question instead, the
   * picker reads as a second question, and somebody who chose to start a team is left looking at a
   * team list that has nothing to do with their answer.
   */
  it('TeamQuestion_JoinChosen_PutsThePickerBetweenThatAnswerAndTheNextOne', async () => {
    getFundraiserJoinContext.mockResolvedValue(teamsCampaign());

    renderPage();
    await waitForForm();

    await userEvent.click(screen.getByRole('radio', { name: /Join a team/i }));

    const picker = await screen.findByLabelText(/Which team\?/i);
    const joinAnswer = screen.getByRole('radio', { name: /Join a team/i });
    const nextAnswer = screen.getByRole('radio', { name: /Start a team/i });

    expect(joinAnswer.compareDocumentPosition(picker)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(picker.compareDocumentPosition(nextAnswer)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  /** The same rule for the other answer: naming a new team sits under the answer that starts one. */
  it('TeamQuestion_StartChosen_PutsTheTeamNameUnderThatAnswer', async () => {
    getFundraiserJoinContext.mockResolvedValue(teamsCampaign());

    renderPage();
    await waitForForm();

    await userEvent.click(screen.getByRole('radio', { name: /Start a team/i }));

    const teamName = await screen.findByLabelText(/Team name/i);
    const startAnswer = screen.getByRole('radio', { name: /Start a team/i });

    expect(startAnswer.compareDocumentPosition(teamName)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.queryByLabelText(/Which team\?/i)).not.toBeInTheDocument();
  });

  /** A picker that cannot be filled has to be recoverable in place rather than left dead. */
  it('TeamQuestion_TeamsCannotBeRead_SaysSoAndRetriesOnRequest', async () => {
    getFundraiserJoinContext.mockResolvedValue(teamsCampaign());
    getCampaignTeams.mockRejectedValueOnce(new Error('network down'));
    getCampaignTeams.mockResolvedValueOnce(browseWith(summary('night-runners', 'Night Runners')));

    renderPage();
    await waitForForm();

    await userEvent.click(screen.getByRole('radio', { name: /Join a team/i }));

    expect(
      await screen.findByText('Could not load the teams on this campaign.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Night Runners' })).toBeInTheDocument(),
    );
  });

  /** A campaign with no teams yet must offer the way to open the first one, not an empty list. */
  it('TeamQuestion_NoTeamsStartedYet_SaysSoRatherThanOfferingAnEmptyList', async () => {
    getFundraiserJoinContext.mockResolvedValue(teamsCampaign());
    getCampaignTeams.mockResolvedValue(browseWith());

    renderPage();
    await waitForForm();

    await userEvent.click(screen.getByRole('radio', { name: /Join a team/i }));

    expect(await screen.findByText(/No teams have been started on this campaign yet/i)).toBeInTheDocument();
  });
});
