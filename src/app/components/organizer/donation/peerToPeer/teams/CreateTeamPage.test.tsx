import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTeamBrowse, buildTeamPage } from '../peerToPeerTestFactory';

const getCampaignTeams = vi.fn();
const createCampaignTeam = vi.fn();

vi.mock('app/service/organizer/donation/campaignTeamService', () => ({
  getCampaignTeams: (...args: unknown[]) => getCampaignTeams(...args),
  createCampaignTeam: (...args: unknown[]) => createCampaignTeam(...args),
}));

const { default: CreateTeamScreen } = await import('./CreateTeamPage');

const renderCreate = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={['/campaigns/winter-appeal/teams/new']}>
        <Routes>
          <Route path="/campaigns/:campaignSlug/teams" element={<p>Browse teams</p>} />
          <Route path="/campaigns/:campaignSlug/teams/new" element={<CreateTeamScreen />} />
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
  createCampaignTeam.mockReset();
});

describe('CreateTeamPage', () => {
  it('Create_Opened_NamesTheCampaignTheTeamWillFundraiseFor', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse());

    renderCreate();

    expect(await screen.findByText('Your team raises money together for Winter Appeal.')).toBeInTheDocument();
  });

  it('Create_EmptyName_IsRefusedOnTheScreenBeforeAnythingIsSent', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse());

    renderCreate();

    await userEvent.click(await screen.findByRole('button', { name: 'Start a team' }));

    expect(await screen.findByText('Enter a name for your team.')).toBeInTheDocument();
    expect(createCampaignTeam).not.toHaveBeenCalled();
  });

  it('Create_GoalOfZero_IsRefusedOnTheScreen', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse());

    renderCreate();

    await userEvent.type(await screen.findByLabelText(/Team name/), 'The Early Risers');
    await userEvent.type(screen.getByLabelText('Team goal'), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Start a team' }));

    expect(
      await screen.findByText('Enter a goal greater than zero, or leave it blank.'),
    ).toBeInTheDocument();
    expect(createCampaignTeam).not.toHaveBeenCalled();
  });

  it('Create_LettersTypedIntoTheGoal_NeverAppearInTheField', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse());

    renderCreate();

    const goal = await screen.findByLabelText('Team goal');
    await userEvent.type(goal, '1a0b0');

    expect(goal).toHaveValue('100');
  });

  it('Create_ValidTeam_SendsTrimmedValuesAndOpensTheNewTeam', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse());
    createCampaignTeam.mockResolvedValue(buildTeamPage());

    renderCreate();

    await userEvent.type(await screen.findByLabelText(/Team name/), '  The Early Risers  ');
    await userEvent.type(screen.getByLabelText('Team goal'), '1000');
    await userEvent.click(screen.getByRole('button', { name: 'Start a team' }));

    expect(createCampaignTeam).toHaveBeenCalledWith('winter-appeal', {
      name: 'The Early Risers',
      story: null,
      teamGoal: 1000,
    });
    expect(await screen.findByText('Team page')).toBeInTheDocument();
  });

  it('Create_RefusedByTheServer_ShowsThatSentenceAndKeepsWhatWasTyped', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse());
    createCampaignTeam.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'You are already in a team on this campaign.' } },
    });

    renderCreate();

    await userEvent.type(await screen.findByLabelText(/Team name/), 'The Early Risers');
    await userEvent.click(screen.getByRole('button', { name: 'Start a team' }));

    expect(
      await screen.findByText('You are already in a team on this campaign.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Team name/)).toHaveValue('The Early Risers');
  });

  it('Create_TeamsSwitchedOff_ShowsADesignedRefusalInsteadOfTheForm', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse({ areTeamsAllowed: false }));

    renderCreate();

    expect(await screen.findByText('This campaign is not using teams')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start a team' })).not.toBeInTheDocument();
  });

  it('Create_CallerIsNotFundraisingYet_PointsThemAtSettingUpTheirOwnPageFirst', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse({ isFundraiser: false }));

    renderCreate();

    expect(await screen.findByText('Set up your fundraising page first')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Set up my fundraising page' }));

    expect(await screen.findByText('Fundraiser join screen')).toBeInTheDocument();
  });

  it('Create_CallerAlreadyInATeam_OffersTheWayToItRatherThanTheForm', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse({ myTeamSlug: 'the-early-risers' }));

    renderCreate();

    await userEvent.click(await screen.findByRole('button', { name: 'Go to my team' }));

    expect(await screen.findByText('Team page')).toBeInTheDocument();
  });

  it('Create_Cancelled_GoesBackToTheTeamsOnThatCampaign', async () => {
    getCampaignTeams.mockResolvedValue(buildTeamBrowse());

    renderCreate();

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText('Browse teams')).toBeInTheDocument();
  });
});
