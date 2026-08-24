import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTeamMember, buildTeamPage } from '../peerToPeerTestFactory';

const getCampaignTeamPage = vi.fn();
const leaveCampaignTeam = vi.fn();

vi.mock('app/service/organizer/donation/campaignTeamService', () => ({
  getCampaignTeamPage: (...args: unknown[]) => getCampaignTeamPage(...args),
  leaveCampaignTeam: (...args: unknown[]) => leaveCampaignTeam(...args),
}));

vi.mock('app/service/organizer/donation/fundraiserConsoleService', () => ({
  fundraiserPhotoUrl: (id: string) => `/api/images/${id}.png`,
}));

const { default: TeamPageScreen } = await import('./TeamPage');

const renderTeam = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={['/campaigns/winter-appeal/teams/the-early-risers']}>
        <Routes>
          <Route path="/campaigns/:campaignSlug/teams" element={<p>Browse teams</p>} />
          <Route path="/campaigns/:campaignSlug/teams/:teamSlug" element={<TeamPageScreen />} />
          <Route
            path="/campaigns/:campaignSlug/teams/:teamSlug/members"
            element={<p>Manage team</p>}
          />
          <Route path="/campaigns/:campaignSlug/:fundraiserSlug" element={<p>Member page</p>} />
          <Route
            path="/campaigns/:campaignSlug/:fundraiserSlug/donate"
            element={<p>Donate screen</p>}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  getCampaignTeamPage.mockReset();
  leaveCampaignTeam.mockReset();
});

describe('TeamPage', () => {
  it('Team_Opened_ShowsTheCombinedTotalAgainstTheTeamGoal', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage());

    renderTeam();

    expect(await screen.findByText('The Early Risers')).toBeInTheDocument();
    expect(screen.getByText('$400 of $1,000')).toBeInTheDocument();
    expect(screen.getByText('31 donors across the team · 2 fundraisers')).toBeInTheDocument();
  });

  it('Team_Opened_ListsEveryMemberWithTheirOwnTotalSoTheSumCanBeAccountedFor', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage());

    renderTeam();

    expect(await screen.findByText('Sarah Khan')).toBeInTheDocument();
    expect(screen.getByText('$240 raised')).toBeInTheDocument();
    expect(screen.getByText('Ahmed Khalid')).toBeInTheDocument();
    expect(screen.getByText('$160 raised')).toBeInTheDocument();
  });

  it('Team_NoGoalSet_ShowsWhatWasRaisedWithoutABrokenProgressBar', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage({ teamGoal: null }));

    renderTeam();

    expect(await screen.findByText('$400')).toBeInTheDocument();
    expect(screen.queryByLabelText(/of the team goal raised/i)).not.toBeInTheDocument();
  });

  it('Team_ThatIsNotThere_ShowsADesignedNoticeRatherThanAnError', async () => {
    getCampaignTeamPage.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Team not found.' } },
    });

    renderTeam();

    expect(await screen.findByText('This team is not here')).toBeInTheDocument();
    expect(screen.getByText(/every member may have left and closed the team/i)).toBeInTheDocument();
  });

  it('Team_CampaignHasFinished_SaysSoInsteadOfOfferingToDonate', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage({ isCampaignOpen: false }));

    renderTeam();

    expect(await screen.findByText(/campaign has finished/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Donate to this team' })).not.toBeInTheDocument();
  });

  /** A team is not a payee: every gift belongs to one fundraiser and is counted once. */
  it('Donate_Pressed_AsksWhoToSupportRatherThanInventingASecondMoneyPath', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage());

    renderTeam();

    await userEvent.click(await screen.findByRole('button', { name: 'Donate to this team' }));

    expect(await screen.findByText('Choose who to support')).toBeInTheDocument();
    expect(screen.getByText(/counts once towards the team/i)).toBeInTheDocument();
  });

  it('Donate_MemberChosen_SendsTheDonorDownTheExistingFundraiserDonateRoute', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage());

    renderTeam();

    await userEvent.click(await screen.findByRole('button', { name: 'Donate to this team' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Donate to Ahmed Khalid' }));

    expect(await screen.findByText('Donate screen')).toBeInTheDocument();
  });

  it('Member_ViewPagePressed_OpensThatFundraisersOwnPage', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage());

    renderTeam();

    await userEvent.click(
      await screen.findByRole('button', { name: 'View page for Ahmed Khalid' }),
    );

    expect(await screen.findByText('Member page')).toBeInTheDocument();
  });

  it('Team_ViewedByAStranger_OffersNeitherManagementNorLeaving', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage({ viewerRole: 'Visitor' }));

    renderTeam();

    await screen.findByText('The Early Risers');

    expect(screen.queryByRole('button', { name: 'Manage team' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Leave this team' })).not.toBeInTheDocument();
  });

  it('Team_ViewedByAPlainMember_OffersLeavingButNotManagement', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage({ viewerRole: 'Member' }));

    renderTeam();

    expect(await screen.findByRole('button', { name: 'Leave this team' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Manage team' })).not.toBeInTheDocument();
  });

  it('Team_ViewedByTheCaptain_OffersManagement', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage({ viewerRole: 'Captain' }));

    renderTeam();

    await userEvent.click(await screen.findByRole('button', { name: 'Manage team' }));

    expect(await screen.findByText('Manage team')).toBeInTheDocument();
  });

  it('Leave_Pressed_AsksFirstAndSaysTheirOwnDonationsAreUnaffected', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage({ viewerRole: 'Member' }));

    renderTeam();

    await userEvent.click(await screen.findByRole('button', { name: 'Leave this team' }));

    expect(await screen.findByText('Leave The Early Risers?')).toBeInTheDocument();
    expect(screen.getByText(/stay exactly as they are/i)).toBeInTheDocument();
  });

  it('Leave_CaptainWithOtherMembers_WarnsThatSomebodyElseTakesOver', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage({ viewerRole: 'Captain' }));

    renderTeam();

    await userEvent.click(await screen.findByRole('button', { name: 'Leave this team' }));

    expect(
      await screen.findByText(/longest-standing member takes over when you leave/i),
    ).toBeInTheDocument();
  });

  it('Leave_LastMember_WarnsThatLeavingClosesTheTeam', async () => {
    getCampaignTeamPage.mockResolvedValue(
      buildTeamPage({ viewerRole: 'Captain', members: [buildTeamMember()] }),
    );

    renderTeam();

    await userEvent.click(await screen.findByRole('button', { name: 'Leave this team' }));

    expect(await screen.findByText(/leaving closes this team/i)).toBeInTheDocument();
  });

  it('Leave_Confirmed_SendsThemBackToTheTeamsOnThatCampaign', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage({ viewerRole: 'Member' }));
    leaveCampaignTeam.mockResolvedValue(undefined);

    renderTeam();

    await userEvent.click(await screen.findByRole('button', { name: 'Leave this team' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, leave' }));

    expect(leaveCampaignTeam).toHaveBeenCalledWith('winter-appeal', 'the-early-risers');
    expect(await screen.findByText('Browse teams')).toBeInTheDocument();
  });

  it('Leave_RefusedByTheServer_ShowsThatSentenceAndKeepsThemOnTheTeam', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage({ viewerRole: 'Member' }));
    leaveCampaignTeam.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Team not found.' } },
    });

    renderTeam();

    await userEvent.click(await screen.findByRole('button', { name: 'Leave this team' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, leave' }));

    expect(await screen.findByText('Team not found.')).toBeInTheDocument();
    expect(screen.queryByText('Browse teams')).not.toBeInTheDocument();
  });
});
