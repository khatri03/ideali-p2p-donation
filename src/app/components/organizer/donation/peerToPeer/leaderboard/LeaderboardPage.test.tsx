import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildLeaderboard, buildLeaderboardGift } from '../peerToPeerTestFactory';

const getLeaderboard = vi.fn();

vi.mock('app/service/organizer/donation/peerToPeerLeaderboardService', () => ({
  getLeaderboard: (...args: unknown[]) => getLeaderboard(...args),
}));

const { default: LeaderboardScreen } = await import('./LeaderboardPage');

const renderBoard = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={['/campaigns/winter-appeal/leaderboard']}>
        <Routes>
          <Route path="/campaigns/:campaignSlug/leaderboard" element={<LeaderboardScreen />} />
          <Route path="/campaigns/:campaignSlug/:fundraiserSlug" element={<p>Fundraiser page</p>} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

/** Both the table and the card list are in the DOM at every width, so a name appears twice. */
const firstText = (text: string) => screen.getAllByText(text)[0];

beforeEach(() => {
  getLeaderboard.mockReset();
});

describe('LeaderboardPage', () => {
  it('Board_Published_ShowsEveryFundraiserWithTheirPlaceAndAmount', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard());

    renderBoard();

    expect(await screen.findAllByText('Sarah Khan')).not.toHaveLength(0);
    expect(firstText('Omar Riaz')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Place 1').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Place 2').length).toBeGreaterThan(0);
  });

  it('Board_Published_NamesTheCampaignAndTheCharityItBelongsTo', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard());

    renderBoard();

    expect(await screen.findByText('Winter Appeal · Hope Foundation')).toBeInTheDocument();
  });

  it('Board_Published_SeparatesWhatSupportersRaisedFromTheCampaignTotal', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard());

    renderBoard();

    expect(await screen.findByText('Raised by supporters')).toBeInTheDocument();
    expect(screen.getByText('$1,300')).toBeInTheDocument();
    expect(screen.getByText('$1,500')).toBeInTheDocument();
  });

  it('Board_KeptToTheCharity_SaysSoRatherThanLookingPublic', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard({ isOrganizerOnly: true }));

    renderBoard();

    expect(
      await screen.findByText(
        'Only your charity can see this leaderboard. Supporters and donors are not shown it.',
      ),
    ).toBeInTheDocument();
  });

  it('Board_PublishedToEveryone_DoesNotClaimItIsPrivate', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard());

    renderBoard();

    await screen.findByText('Winter Appeal · Hope Foundation');
    expect(
      screen.queryByText(
        'Only your charity can see this leaderboard. Supporters and donors are not shown it.',
      ),
    ).not.toBeInTheDocument();
  });

  it('Board_CampaignFinished_SaysTheseAreTheFinalStandings', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard({ isCampaignClosed: true }));

    renderBoard();

    expect(
      await screen.findByText('This campaign has finished. These are the final standings.'),
    ).toBeInTheDocument();
  });

  it('Board_MorePagesThanItShows_SaysHowManyItIsShowing', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard({ fundraiserCount: 87 }));

    renderBoard();

    expect(await screen.findByText('Showing the top 2 of 87.')).toBeInTheDocument();
  });

  it('Board_ShowingEverybody_DoesNotClaimToBeCapped', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard({ fundraiserCount: 2 }));

    renderBoard();

    await screen.findAllByText('Sarah Khan');
    expect(screen.queryByText(/Showing the top/)).not.toBeInTheDocument();
  });

  it('Board_NobodyFundraisingYet_ShowsADesignedEmptyScreenRatherThanABlankArea', async () => {
    getLeaderboard.mockResolvedValue(
      buildLeaderboard({ fundraisers: [], fundraiserCount: 0 }),
    );

    renderBoard();

    expect(await screen.findByText('Nobody is fundraising yet')).toBeInTheDocument();
  });

  it('Teams_SwitchedOffAndNoneFormed_SaysTheCampaignIsNotUsingTeams', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard({ areTeamsAllowed: false, teams: [] }));

    renderBoard();

    await screen.findAllByText('Sarah Khan');
    await userEvent.click(screen.getByRole('tab', { name: 'Teams' }));

    expect(await screen.findByText('This campaign is not using teams')).toBeInTheDocument();
  });

  it('Teams_AllowedButNoneFormedYet_ShowsTheEmptyTeamScreen', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard({ teams: [], teamCount: 0 }));

    renderBoard();

    await screen.findAllByText('Sarah Khan');
    await userEvent.click(screen.getByRole('tab', { name: 'Teams' }));

    expect(await screen.findByText('No teams yet')).toBeInTheDocument();
  });

  /** Switching teams off stops new ones forming; the ones already there stay readable and ranked. */
  it('Teams_SwitchedOffAfterSomeWereFormed_StillRanksTheOnesThatExist', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard({ areTeamsAllowed: false }));

    renderBoard();

    await screen.findAllByText('Sarah Khan');
    await userEvent.click(screen.getByRole('tab', { name: 'Teams' }));

    expect(await screen.findAllByText('The Early Risers')).not.toHaveLength(0);
    expect(screen.queryByText('This campaign is not using teams')).not.toBeInTheDocument();
  });

  it('Teams_Formed_AreRankedWithTheirSize', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard());

    renderBoard();

    await screen.findAllByText('Sarah Khan');
    await userEvent.click(screen.getByRole('tab', { name: 'Teams' }));

    expect(await screen.findAllByText('The Early Risers')).not.toHaveLength(0);
  });

  it('Gifts_GivenStraightToTheCampaign_ReadAsTheCampaignRatherThanAsAGap', async () => {
    getLeaderboard.mockResolvedValue(
      buildLeaderboard({ topGifts: [buildLeaderboardGift({ fundraiserDisplayName: null })] }),
    );

    renderBoard();

    await screen.findAllByText('Sarah Khan');
    await userEvent.click(screen.getByRole('tab', { name: 'Biggest gifts' }));

    expect(await screen.findAllByText('Ahmed K.')).not.toHaveLength(0);
    expect(screen.getAllByText(/The campaign/)[0]).toBeInTheDocument();
  });

  it('Gifts_NoDonationsYet_ExplainsAnonymousDonorsAreNeverListed', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard({ topGifts: [] }));

    renderBoard();

    await screen.findAllByText('Sarah Khan');
    await userEvent.click(screen.getByRole('tab', { name: 'Biggest gifts' }));

    expect(await screen.findByText('No donations yet')).toBeInTheDocument();
    expect(
      screen.getByText(/Donors who choose to stay anonymous are never listed/),
    ).toBeInTheDocument();
  });

  it('Board_Refused_ShowsADesignedNoticeWithARetryRatherThanABlankScreen', async () => {
    getLeaderboard.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Leaderboard not found.' } },
    });

    renderBoard();

    expect(await screen.findByText('This leaderboard is not here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('Board_RetryPressedAfterARefusal_AsksTheApiAgain', async () => {
    getLeaderboard.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: 'Leaderboard not found.' } },
    });
    getLeaderboard.mockResolvedValueOnce(buildLeaderboard());

    renderBoard();

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findAllByText('Sarah Khan')).not.toHaveLength(0);
    expect(getLeaderboard).toHaveBeenCalledTimes(2);
  });

  it('Board_Opening_ShowsASkeletonRatherThanAnEmptyPage', () => {
    getLeaderboard.mockReturnValue(new Promise(() => {}));

    const { container } = renderBoard();

    expect(container.querySelectorAll('.chakra-skeleton').length).toBeGreaterThan(0);
  });

  it('Board_FundraiserChosen_OpensTheirPageAtItsUsualAddress', async () => {
    getLeaderboard.mockResolvedValue(buildLeaderboard());

    renderBoard();

    const links = await screen.findAllByRole('link', { name: 'View page: Sarah Khan' });
    await userEvent.click(links[0]);

    expect(await screen.findByText('Fundraiser page')).toBeInTheDocument();
  });
});
