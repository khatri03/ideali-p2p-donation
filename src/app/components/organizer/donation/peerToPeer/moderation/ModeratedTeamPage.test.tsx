import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CAMPAIGN_UNIQUE_ID, TEAM_UNIQUE_ID, buildTeamDetail } from './moderationTestFactory';

const getModeratedTeam = vi.fn();
const moderateTeam = vi.fn();

vi.mock('app/service/organizer/donation/peerToPeerModerationService', () => ({
  getModeratedTeam: (...args: unknown[]) => getModeratedTeam(...args),
  moderateTeam: (...args: unknown[]) => moderateTeam(...args),
}));

const { default: ModeratedTeamScreen } = await import('./ModeratedTeamPage');

const renderDetail = () =>
  render(
    <ChakraProvider>
      <MemoryRouter
        initialEntries={[
          `/organizer/donation/campaign/${CAMPAIGN_UNIQUE_ID}/peer-to-peer/teams/${TEAM_UNIQUE_ID}`,
        ]}
      >
        <Routes>
          <Route
            path="/organizer/donation/campaign/:campaignUniqueId/peer-to-peer/teams/:teamUniqueId"
            element={<ModeratedTeamScreen />}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  getModeratedTeam.mockReset();
  moderateTeam.mockReset();
});

describe('ModeratedTeamPage', () => {
  it('Detail_TeamWithMembers_NamesEachAndWhatTheyRaised', async () => {
    getModeratedTeam.mockResolvedValue(buildTeamDetail());

    renderDetail();

    expect(await screen.findByText('Omar Shah')).toBeInTheDocument();
    expect(screen.getByText('CA$25')).toBeInTheDocument();
    expect(screen.getAllByText('Captain').length).toBeGreaterThan(1);
  });

  it('Detail_TeamNobodyHasJoined_SaysSoRatherThanShowingAnEmptyList', async () => {
    getModeratedTeam.mockResolvedValue(buildTeamDetail({ members: [] }));

    renderDetail();

    expect(await screen.findByText('Nobody has joined this team yet.')).toBeInTheDocument();
  });

  it('Detail_LoadRefused_ShowsADesignedNoticeWithARetry', async () => {
    getModeratedTeam.mockRejectedValue(new Error('Team not found.'));

    renderDetail();

    expect(await screen.findByText('Team not found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('Actions_VisibleTeam_OffersHidingItAndNothingAboutApproval', async () => {
    getModeratedTeam.mockResolvedValue(buildTeamDetail());

    renderDetail();

    expect(await screen.findByRole('button', { name: 'Hide' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Turn down' })).not.toBeInTheDocument();
  });

  it('Actions_HiddenTeam_OffersBringingItBack', async () => {
    getModeratedTeam.mockResolvedValue(buildTeamDetail({ isHidden: true }));

    renderDetail();

    expect(await screen.findByRole('button', { name: 'Bring back' })).toBeInTheDocument();
  });

  it('Hide_Chosen_SaysThePagesInsideKeepFundraising', async () => {
    getModeratedTeam.mockResolvedValue(buildTeamDetail());

    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Hide' }));

    expect(await screen.findByText('Hide Ward Runners?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The team stops appearing when supporters browse, and its address stops working. The pages in it stay live and keep raising money on their own.',
      ),
    ).toBeInTheDocument();
  });

  it('Hide_Confirmed_SendsTheActionAndReadsTheTeamBack', async () => {
    getModeratedTeam.mockResolvedValue(buildTeamDetail());
    moderateTeam.mockResolvedValue(undefined);

    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Hide' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hide this team' }));

    await waitFor(() =>
      expect(moderateTeam).toHaveBeenCalledWith(CAMPAIGN_UNIQUE_ID, TEAM_UNIQUE_ID, {
        action: 'Hide',
        reason: undefined,
      }),
    );
    await waitFor(() => expect(getModeratedTeam).toHaveBeenCalledTimes(2));
  });

  it('Hide_ServerRefused_LeavesTheTeamAsItWasAndSaysWhy', async () => {
    getModeratedTeam.mockResolvedValue(buildTeamDetail());
    moderateTeam.mockRejectedValue(new Error('This team is already hidden.'));

    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Hide' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hide this team' }));

    expect(await screen.findByText('This team is already hidden.')).toBeInTheDocument();
    expect(getModeratedTeam).toHaveBeenCalledTimes(1);
  });

  it('PublicLink_HiddenTeam_IsNotOfferedBecauseTheAddressNoLongerWorks', async () => {
    getModeratedTeam.mockResolvedValue(buildTeamDetail({ isHidden: true }));

    renderDetail();

    await screen.findByRole('button', { name: 'Bring back' });

    expect(screen.queryByRole('link', { name: /Open the team page/ })).not.toBeInTheDocument();
  });

  it('PublicLink_VisibleTeam_PointsAtTheAddressSupportersShare', async () => {
    getModeratedTeam.mockResolvedValue(buildTeamDetail());

    renderDetail();

    expect(await screen.findByRole('link', { name: /Open the team page/ })).toHaveAttribute(
      'href',
      '/campaigns/winter-appeal/teams/ward-runners',
    );
  });
});
