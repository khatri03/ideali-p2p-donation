import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CAMPAIGN_UNIQUE_ID, buildList, buildTeam } from './moderationTestFactory';

const getModeratedTeams = vi.fn();

vi.mock('app/service/organizer/donation/peerToPeerModerationService', () => ({
  getModeratedTeams: (...args: unknown[]) => getModeratedTeams(...args),
}));

const { default: ModeratedTeamsScreen } = await import('./ModeratedTeamsPage');

const renderList = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[`/organizer/donation/campaign/${CAMPAIGN_UNIQUE_ID}/peer-to-peer/teams`]}>
        <Routes>
          <Route
            path="/organizer/donation/campaign/:campaignUniqueId/peer-to-peer/teams"
            element={<ModeratedTeamsScreen />}
          />
          <Route
            path="/organizer/donation/campaign/:campaignUniqueId/peer-to-peer/teams/:teamUniqueId"
            element={<p>Team review screen</p>}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

const lastQuery = () => getModeratedTeams.mock.calls.at(-1)?.[1];

beforeEach(() => {
  getModeratedTeams.mockReset();
});

describe('ModeratedTeamsPage', () => {
  it('List_TeamsOnTheCampaign_ShowsEachWithItsCaptainSizeAndTotal', async () => {
    getModeratedTeams.mockResolvedValue(buildList([buildTeam()]));

    renderList();

    expect(await screen.findAllByText('Ward Runners')).not.toHaveLength(0);
    expect(screen.getAllByText('CA$125').length).toBeGreaterThan(0);
  });

  it('List_HiddenTeam_IsMarkedAsHiddenRatherThanLookingLive', async () => {
    getModeratedTeams.mockResolvedValue(buildList([buildTeam({ isHidden: true })]));

    renderList();

    expect((await screen.findAllByText('Hidden')).length).toBeGreaterThan(0);
  });

  it('List_NoTeamsYet_ShowsTheDesignedEmptyState', async () => {
    getModeratedTeams.mockResolvedValue(buildList([]));

    renderList();

    expect(await screen.findByText('No teams yet')).toBeInTheDocument();
  });

  it('List_LoadRefused_ShowsADesignedNoticeWithARetry', async () => {
    getModeratedTeams.mockRejectedValue(new Error('Campaign not found.'));

    renderList();

    expect(await screen.findByText('Campaign not found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('Visibility_HiddenOnlyChosen_AsksTheServerForOnlyTheHiddenTeams', async () => {
    getModeratedTeams.mockResolvedValue(buildList([buildTeam({ isHidden: true })]));

    renderList();

    await userEvent.selectOptions(await screen.findByLabelText('Visibility'), 'hidden');

    await waitFor(() => expect(lastQuery()).toMatchObject({ isHidden: true }));
  });

  it('Visibility_ShowingPubliclyChosen_AsksTheServerForOnlyTheVisibleTeams', async () => {
    getModeratedTeams.mockResolvedValue(buildList([buildTeam()]));

    renderList();

    await userEvent.selectOptions(await screen.findByLabelText('Visibility'), 'live');

    await waitFor(() => expect(lastQuery()).toMatchObject({ isHidden: false }));
  });

  it('Review_Pressed_OpensThatTeamsOwnReviewScreen', async () => {
    getModeratedTeams.mockResolvedValue(buildList([buildTeam()]));

    renderList();

    await userEvent.click((await screen.findAllByRole('link', { name: 'Review Ward Runners' }))[0]);

    expect(await screen.findByText('Team review screen')).toBeInTheDocument();
  });
});
