import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTeamMember, buildTeamPage } from '../peerToPeerTestFactory';

const getCampaignTeamPage = vi.fn();
const updateCampaignTeam = vi.fn();
const removeCampaignTeamMember = vi.fn();
const handOverCampaignTeamCaptaincy = vi.fn();
const leaveCampaignTeam = vi.fn();

vi.mock('app/service/organizer/donation/campaignTeamService', () => ({
  getCampaignTeamPage: (...args: unknown[]) => getCampaignTeamPage(...args),
  updateCampaignTeam: (...args: unknown[]) => updateCampaignTeam(...args),
  removeCampaignTeamMember: (...args: unknown[]) => removeCampaignTeamMember(...args),
  handOverCampaignTeamCaptaincy: (...args: unknown[]) => handOverCampaignTeamCaptaincy(...args),
  leaveCampaignTeam: (...args: unknown[]) => leaveCampaignTeam(...args),
}));

vi.mock('app/service/organizer/donation/fundraiserConsoleService', () => ({
  fundraiserPhotoUrl: (id: string) => `/api/images/${id}.png`,
}));

const { default: TeamMembersScreen } = await import('./TeamMembersPage');

const captainView = (overrides = {}) => buildTeamPage({ viewerRole: 'Captain', ...overrides });

const renderManage = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={['/campaigns/winter-appeal/teams/the-early-risers/members']}>
        <Routes>
          <Route path="/campaigns/:campaignSlug/teams" element={<p>Browse teams</p>} />
          <Route path="/campaigns/:campaignSlug/teams/:teamSlug" element={<p>Team page</p>} />
          <Route
            path="/campaigns/:campaignSlug/teams/:teamSlug/members"
            element={<TeamMembersScreen />}
          />
          <Route path="/campaigns/:campaignSlug/:fundraiserSlug" element={<p>Member page</p>} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  getCampaignTeamPage.mockReset();
  updateCampaignTeam.mockReset();
  removeCampaignTeamMember.mockReset();
  handOverCampaignTeamCaptaincy.mockReset();
  leaveCampaignTeam.mockReset();
});

describe('TeamMembersPage', () => {
  it('Manage_OpenedByTheCaptain_ListsEveryMemberWithTheirOwnTotal', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());

    renderManage();

    expect(await screen.findByText('Sarah Khan')).toBeInTheDocument();
    expect(screen.getByText('Ahmed Khalid')).toBeInTheDocument();
    expect(screen.getByText('$160 raised')).toBeInTheDocument();
  });

  /** Hiding is presentation; the server refuses these again. Both, always. */
  it('Manage_OpenedByAPlainMember_ShowsADesignedRefusalRatherThanTheControls', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage({ viewerRole: 'Member' }));

    renderManage();

    expect(await screen.findByText('Only the team captain can open this')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove: Ahmed Khalid' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Make captain: Ahmed Khalid' }),
    ).not.toBeInTheDocument();
  });

  it('Manage_OpenedByAStranger_ShowsTheSameRefusalWithNoBackendDetail', async () => {
    getCampaignTeamPage.mockResolvedValue(buildTeamPage({ viewerRole: 'Visitor' }));

    renderManage();

    expect(await screen.findByText('Only the team captain can open this')).toBeInTheDocument();
    expect(screen.queryByText(/CaptainUserId/i)).not.toBeInTheDocument();
  });

  it('Manage_TeamThatIsNotThere_ShowsTheDesignedNotFoundSurface', async () => {
    getCampaignTeamPage.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Team not found.' } },
    });

    renderManage();

    expect(await screen.findByText('This team is not here')).toBeInTheDocument();
  });

  it('Captain_OffersNoActionsAgainstThemselves', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());

    renderManage();

    await screen.findByText('Sarah Khan');

    expect(screen.queryByRole('button', { name: 'Remove: Sarah Khan' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Make captain: Sarah Khan' }),
    ).not.toBeInTheDocument();
  });

  it('Remove_Pressed_NamesThePersonAndSaysTheirMoneyIsUnaffectedBeforeAnythingHappens', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());

    renderManage();

    await userEvent.click(await screen.findByRole('button', { name: 'Remove: Ahmed Khalid' }));

    expect(await screen.findByText('Remove Ahmed Khalid from the team?')).toBeInTheDocument();
    expect(screen.getByText(/keeps their fundraising page and every donation on it/i)).toBeInTheDocument();
    expect(removeCampaignTeamMember).not.toHaveBeenCalled();
  });

  it('Remove_Cancelled_SendsNothingToTheServer', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());

    renderManage();

    await userEvent.click(await screen.findByRole('button', { name: 'Remove: Ahmed Khalid' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(removeCampaignTeamMember).not.toHaveBeenCalled();
  });

  it('Remove_Confirmed_AddressesThatOneMembershipAndShowsTheTeamWithoutThem', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());
    removeCampaignTeamMember.mockResolvedValue(
      captainView({ members: [buildTeamMember()], raisedAmount: 240 }),
    );

    renderManage();

    await userEvent.click(await screen.findByRole('button', { name: 'Remove: Ahmed Khalid' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, remove' }));

    expect(removeCampaignTeamMember).toHaveBeenCalledWith(
      'winter-appeal',
      'the-early-risers',
      'd7e2b8c1-4a95-4c37-b0f6-2e91d4a7c605',
    );
    expect(await screen.findByText('1 fundraiser')).toBeInTheDocument();
  });

  it('Remove_StillInFlight_KeepsTheConfirmationUpWithBothButtonsUnavailable', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());

    let finishRemoval: (page: unknown) => void = () => undefined;
    removeCampaignTeamMember.mockReturnValue(
      new Promise((resolve) => {
        finishRemoval = resolve;
      }),
    );

    renderManage();

    await userEvent.click(await screen.findByRole('button', { name: 'Remove: Ahmed Khalid' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, remove' }));

    const dialog = await screen.findByRole('alertdialog');

    expect(within(dialog).getByText('Remove Ahmed Khalid from the team?')).toBeInTheDocument();
    within(dialog)
      .getAllByRole('button')
      .forEach((button) => expect(button).toBeDisabled());

    finishRemoval(captainView({ members: [buildTeamMember()] }));

    expect(await screen.findByText('1 fundraiser')).toBeInTheDocument();
  });

  it('Remove_RefusedByTheServer_ShowsThatSentenceAndLeavesTheTeamAsItWas', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());
    removeCampaignTeamMember.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Only the team captain can do that.' } },
    });

    renderManage();

    await userEvent.click(await screen.findByRole('button', { name: 'Remove: Ahmed Khalid' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, remove' }));

    expect(await screen.findByText('Only the team captain can do that.')).toBeInTheDocument();
    expect(screen.getByText('Ahmed Khalid')).toBeInTheDocument();
  });

  it('HandOver_Pressed_NamesThePersonTakingOverBeforeAnythingHappens', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());

    renderManage();

    await userEvent.click(await screen.findByRole('button', { name: 'Make captain: Ahmed Khalid' }));

    expect(await screen.findByText('Make Ahmed Khalid the captain?')).toBeInTheDocument();
    expect(handOverCampaignTeamCaptaincy).not.toHaveBeenCalled();
  });

  it('HandOver_Confirmed_EndsTheirCaptaincyAndTakesThemBackToTheTeamPage', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());
    handOverCampaignTeamCaptaincy.mockResolvedValue(buildTeamPage({ viewerRole: 'Member' }));

    renderManage();

    await userEvent.click(await screen.findByRole('button', { name: 'Make captain: Ahmed Khalid' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, hand over' }));

    expect(handOverCampaignTeamCaptaincy).toHaveBeenCalledWith(
      'winter-appeal',
      'the-early-risers',
      'd7e2b8c1-4a95-4c37-b0f6-2e91d4a7c605',
    );
    expect(await screen.findByText('Team page')).toBeInTheDocument();
  });

  it('Manage_OnlyMemberLeft_SaysWhyThereIsNobodyToHandOverTo', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView({ members: [buildTeamMember()] }));

    renderManage();

    expect(await screen.findByText(/Invite another fundraiser to join/i)).toBeInTheDocument();
  });

  it('Edit_NameCleared_IsRefusedOnTheScreenBeforeAnythingIsSent', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());

    renderManage();

    await userEvent.clear(await screen.findByLabelText(/Team name/));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Enter a name for your team.')).toBeInTheDocument();
    expect(updateCampaignTeam).not.toHaveBeenCalled();
  });

  it('Edit_NothingChanged_LeavesSavingUnavailableRatherThanSendingAnEmptyChange', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());

    renderManage();

    expect(await screen.findByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('Edit_Saved_SendsTheTrimmedValuesAndConfirmsOnScreen', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());
    updateCampaignTeam.mockResolvedValue(captainView({ name: 'The Risers' }));

    renderManage();

    const name = await screen.findByLabelText(/Team name/);
    await userEvent.clear(name);
    await userEvent.type(name, 'The Risers');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateCampaignTeam).toHaveBeenCalledWith('winter-appeal', 'the-early-risers', {
      name: 'The Risers',
      story: 'We run before work and raise as we go.',
      teamGoal: 1000,
    });
    expect(await screen.findByText('The team is updated.')).toBeInTheDocument();
  });

  it('Edit_RefusedByTheServer_ShowsThatSentenceRatherThanClaimingItSaved', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());
    updateCampaignTeam.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'This campaign is not using fundraising teams.' } },
    });

    renderManage();

    const name = await screen.findByLabelText(/Team name/);
    await userEvent.type(name, ' Reborn');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('This campaign is not using fundraising teams.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('The team is updated.')).not.toBeInTheDocument();
  });

  it('Leave_ConfirmedByTheCaptain_SendsThemBackToTheTeamsOnThatCampaign', async () => {
    getCampaignTeamPage.mockResolvedValue(captainView());
    leaveCampaignTeam.mockResolvedValue(undefined);

    renderManage();

    await userEvent.click(await screen.findByRole('button', { name: 'Leave this team' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, leave' }));

    expect(leaveCampaignTeam).toHaveBeenCalledWith('winter-appeal', 'the-early-risers');
    expect(await screen.findByText('Browse teams')).toBeInTheDocument();
  });
});
