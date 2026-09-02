import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTeamBrowse, buildTeamSummary } from '../peerToPeerTestFactory';

const getCampaignTeams = vi.fn();
const joinCampaignTeam = vi.fn();

vi.mock('app/service/organizer/donation/campaignTeamService', () => ({
  getCampaignTeams: (...args: unknown[]) => getCampaignTeams(...args),
  joinCampaignTeam: (...args: unknown[]) => joinCampaignTeam(...args),
}));

const { default: BrowseTeamsScreen } = await import('./BrowseTeamsPage');

const renderBrowse = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={['/campaigns/winter-appeal/teams']}>
        <Routes>
          <Route path="/campaigns/:campaignSlug/teams" element={<BrowseTeamsScreen />} />
          <Route path="/member/my-fundraising" element={<p>Fundraising console</p>} />
          <Route path="/campaigns/:campaignSlug/teams/new" element={<p>Create team screen</p>} />
          <Route path="/campaigns/:campaignSlug/teams/:teamSlug" element={<p>Team page</p>} />
          <Route
            path="/donation/campaign/:campaignUniqueId/peer-to-peer/join"
            element={<p>Fundraiser join screen</p>}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  getCampaignTeams.mockReset();
  joinCampaignTeam.mockReset();
});

describe('BrowseTeamsPage', () => {
  it('Browse_TeamsOnTheCampaign_ShowsEachWithItsStandingAndSize', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse());

    renderBrowse();

    expect(await screen.findByText('The Early Risers')).toBeInTheDocument();
    expect(screen.getByText('$400 raised')).toBeInTheDocument();
    expect(screen.getByText('2 fundraisers')).toBeInTheDocument();
    expect(screen.getByText('Captain: Sarah Khan')).toBeInTheDocument();
  });

  /** "Join a team" in the console lands here, so the screen owns the way back rather than the browser. */
  it('Browse_ReaderIsFundraisingOnThisCampaign_OffersTheWayBackToTheirConsole', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse({ isFundraiser: true }));

    renderBrowse();

    await userEvent.click(await screen.findByRole('link', { name: 'Back to my fundraising' }));

    expect(await screen.findByText('Fundraising console')).toBeInTheDocument();
  });

  /** The list is a public address too, and a reader with no page of their own has no console. */
  it('Browse_ReaderIsNotFundraising_OffersNoRouteToAConsoleTheyDoNotHave', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse({ isFundraiser: false }));

    renderBrowse();

    expect(await screen.findByText('The Early Risers')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Back to my fundraising' })).not.toBeInTheDocument();
  });

  it('Browse_LoadRefused_ShowsADesignedNoticeWithARetryRatherThanABlankScreen', async () => {
    getCampaignTeams.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Campaign not found.' } },
    });

    renderBrowse();

    expect(await screen.findByText('Campaign not found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('Browse_NoTeamsYetAndCallerCanStartOne_ShowsTheDesignedEmptyStateWithTheActionOnIt', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse({ teams: [] }));

    renderBrowse();

    expect(await screen.findByText('No teams yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start the first team' })).toBeInTheDocument();
  });

  it('Browse_NoTeamsYetAndCallerIsNotFundraising_OffersNoStartActionAtAll', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse({ teams: [], isFundraiser: false }));

    renderBrowse();

    expect(await screen.findByText('No teams yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start the first team' })).not.toBeInTheDocument();
  });

  it('Browse_TeamsSwitchedOff_ExplainsWhyAndOffersNoJoin', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse({ areTeamsAllowed: false }));

    renderBrowse();

    expect(await screen.findByText(/is not using teams/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Join this team' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start a team' })).not.toBeInTheDocument();
  });

  /** Teams switched off must leave what already exists readable rather than making it vanish. */
  it('Browse_TeamsSwitchedOff_StillListsTheTeamsThatAlreadyExist', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse({ areTeamsAllowed: false }));

    renderBrowse();

    expect(await screen.findByText('The Early Risers')).toBeInTheDocument();
  });

  it('Browse_CallerIsNotFundraisingYet_PointsThemAtSettingUpTheirOwnPage', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse({ isFundraiser: false }));

    renderBrowse();

    const setUp = await screen.findByRole('button', { name: 'Set up my fundraising page' });
    await userEvent.click(setUp);

    expect(await screen.findByText('Fundraiser join screen')).toBeInTheDocument();
  });

  it('Browse_CallerAlreadyInATeam_OffersTheWayToItRatherThanASecondJoin', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse({ myTeamSlug: 'the-early-risers' }));

    renderBrowse();

    expect(await screen.findByRole('button', { name: 'Go to my team' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Join this team' })).not.toBeInTheDocument();
  });

  it('Join_Pressed_AsksFirstAndSaysWhatHappensToMoneyAlreadyRaised', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse());

    renderBrowse();

    await userEvent.click(await screen.findByRole('button', { name: 'Join this team' }));

    expect(await screen.findByText('Join The Early Risers?')).toBeInTheDocument();
    expect(
      screen.getByText(/keeps every donation it has already taken/i),
    ).toBeInTheDocument();
  });

  it('Join_Cancelled_SendsNothingToTheServer', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse());

    renderBrowse();

    await userEvent.click(await screen.findByRole('button', { name: 'Join this team' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(joinCampaignTeam).not.toHaveBeenCalled();
  });

  it('Join_Confirmed_TakesThemToTheTeamTheyJoined', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse());
    joinCampaignTeam.mockResolvedValue({
      campaignSlug: 'winter-appeal',
      slug: 'the-early-risers',
    });

    renderBrowse();

    await userEvent.click(await screen.findByRole('button', { name: 'Join this team' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, join' }));

    expect(joinCampaignTeam).toHaveBeenCalledWith('winter-appeal', 'the-early-risers');
    expect(await screen.findByText('Team page')).toBeInTheDocument();
  });

  it('Join_RefusedByTheServer_ShowsThatSentenceAndStaysOnTheList', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse());
    joinCampaignTeam.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'You are already in a team on this campaign.' } },
    });

    renderBrowse();

    await userEvent.click(await screen.findByRole('button', { name: 'Join this team' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, join' }));

    expect(
      await screen.findByText('You are already in a team on this campaign.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Team page')).not.toBeInTheDocument();
  });

  it('Search_Typed_IsAnsweredByTheServerRatherThanFilteredInTheBrowser', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse());

    renderBrowse();

    await screen.findByText('The Early Risers');
    await userEvent.type(screen.getByLabelText('Search teams'), 'risers');

    await waitFor(() =>
      expect(getCampaignTeams).toHaveBeenLastCalledWith('winter-appeal', 'risers'),
    );
  });

  it('Search_MatchesNothing_ShowsADesignedNoticeWithAWayToClearIt', async () => {
    getCampaignTeams.mockResolvedValueOnce(buildTeamBrowse());
    getCampaignTeams.mockResolvedValue(buildTeamBrowse({ teams: [] }));

    renderBrowse();

    await screen.findByText('The Early Risers');
    await userEvent.type(screen.getByLabelText('Search teams'), 'nothing');

    expect(await screen.findByText('No team matches that search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('Browse_SeveralTeams_ListsEveryOneOfThem', async () => {
    getCampaignTeams.mockResolvedValue(
      buildTeamBrowse({
        teams: [
          buildTeamSummary(),
          buildTeamSummary({
            uniqueId: 'second-team',
            slug: 'the-night-owls',
            name: 'The Night Owls',
            raisedAmount: 75,
            teamGoal: null,
          }),
        ],
      }),
    );

    renderBrowse();

    expect(await screen.findByText('The Early Risers')).toBeInTheDocument();
    expect(screen.getByText('The Night Owls')).toBeInTheDocument();
    expect(screen.getByText('$75 raised')).toBeInTheDocument();
  });
});
