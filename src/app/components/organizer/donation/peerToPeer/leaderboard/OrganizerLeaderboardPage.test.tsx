import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildLeaderboard, buildSettings } from '../peerToPeerTestFactory';

const getPeerToPeerSettings = vi.fn();
const getLeaderboard = vi.fn();

vi.mock('app/service/organizer/donation/peerToPeerService', () => ({
  getPeerToPeerSettings: (...args: unknown[]) => getPeerToPeerSettings(...args),
  updatePeerToPeerSettings: vi.fn(),
}));

vi.mock('app/service/organizer/donation/peerToPeerLeaderboardService', () => ({
  getLeaderboard: (...args: unknown[]) => getLeaderboard(...args),
}));

const { default: OrganizerLeaderboardScreen } = await import('./OrganizerLeaderboardPage');

const CAMPAIGN_UNIQUE_ID = 'campaign-1';
const BOARD_PATH = `/organizer/donation/campaign/${CAMPAIGN_UNIQUE_ID}/peer-to-peer/leaderboard`;

const renderBoard = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[BOARD_PATH]}>
        <Routes>
          <Route
            path="/organizer/donation/campaign/:campaignUniqueId/peer-to-peer/leaderboard"
            element={<OrganizerLeaderboardScreen />}
          />
          <Route
            path="/organizer/donation/campaign/:campaignUniqueId/peer-to-peer"
            element={<p>Fundraising settings screen</p>}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

/** Both the table and the card list are in the DOM at every width, so a name matches twice. */
const firstText = (text: string) => screen.getAllByText(text)[0];

beforeEach(() => {
  getPeerToPeerSettings.mockReset();
  getLeaderboard.mockReset();
});

describe('OrganizerLeaderboardPage', () => {
  /**
   * The whole reason this screen exists: the charity reads its standings without being dropped onto
   * the public page, so the oversight navigation it arrived through is still there afterwards.
   */
  it('Board_OpenedByTheCharity_KeepsTheOversightNavigationAroundIt', async () => {
    getPeerToPeerSettings.mockResolvedValue(buildSettings({ leaderboardVisibility: 'Public' }));
    getLeaderboard.mockResolvedValue(buildLeaderboard());

    renderBoard();

    expect(
      await screen.findByRole('navigation', { name: 'Supporter fundraising sections' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Fundraising pages' })).toBeInTheDocument();
  });

  /**
   * The standings are read by slug while every oversight screen is addressed by unique id. The screen
   * has to resolve one from the other, or a campaign with a board shows none.
   */
  it('Board_AddressedByCampaignUniqueId_ReadsTheStandingsForThatCampaignSlug', async () => {
    getPeerToPeerSettings.mockResolvedValue(
      buildSettings({ leaderboardVisibility: 'Public', peerToPeerSlug: 'winter-appeal' }),
    );
    getLeaderboard.mockResolvedValue(buildLeaderboard());

    renderBoard();

    expect(await screen.findAllByText('Sarah Khan')).not.toHaveLength(0);
    expect(getLeaderboard).toHaveBeenCalledWith('winter-appeal');
  });

  /** Same standings as the public page, so the charity is never shown a different ranking. */
  it('Board_Published_ShowsEveryFundraiserWithTheirPlaceAndAmount', async () => {
    getPeerToPeerSettings.mockResolvedValue(buildSettings({ leaderboardVisibility: 'Public' }));
    getLeaderboard.mockResolvedValue(buildLeaderboard());

    renderBoard();

    expect(await screen.findAllByText('Sarah Khan')).not.toHaveLength(0);
    expect(firstText('Omar Riaz')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Place 1').length).toBeGreaterThan(0);
  });

  /**
   * The oversight frame already announces the screen. A second first-level heading would leave a
   * screen reader unable to tell which one owns the page.
   */
  it('Board_InsideTheOversightFrame_AnnouncesOnlyOneFirstLevelHeading', async () => {
    getPeerToPeerSettings.mockResolvedValue(buildSettings({ leaderboardVisibility: 'Public' }));
    getLeaderboard.mockResolvedValue(buildLeaderboard());

    renderBoard();

    await screen.findAllByText('Sarah Khan');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  /**
   * A hidden board refuses everyone, the charity included. Saying so and offering the switch is the
   * difference between a designed surface and a not-found that reads like a broken link.
   */
  it('Board_SwitchedOff_SaysSoAndOffersTheSettingsThatTurnItOn', async () => {
    getPeerToPeerSettings.mockResolvedValue(buildSettings({ leaderboardVisibility: 'Hidden' }));

    renderBoard();

    expect(await screen.findByText('The leaderboard is switched off')).toBeInTheDocument();
    expect(getLeaderboard).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('link', { name: 'Go to settings' }));

    expect(await screen.findByText('Fundraising settings screen')).toBeInTheDocument();
  });

  /** A board only the charity can see must not offer a public link that would refuse every visitor. */
  it('Board_OrganizerOnly_DoesNotOfferThePublicAddress', async () => {
    getPeerToPeerSettings.mockResolvedValue(
      buildSettings({ leaderboardVisibility: 'OrganizerOnly' }),
    );
    getLeaderboard.mockResolvedValue(buildLeaderboard({ isOrganizerOnly: true }));

    renderBoard();

    await screen.findAllByText('Sarah Khan');
    expect(screen.queryByRole('link', { name: 'Open the public board' })).not.toBeInTheDocument();
  });

  /** A published board is shareable, so the charity gets the address supporters actually open. */
  it('Board_Published_OffersThePublicAddressTheSupportersSee', async () => {
    getPeerToPeerSettings.mockResolvedValue(
      buildSettings({ leaderboardVisibility: 'Public', peerToPeerSlug: 'winter-appeal' }),
    );
    getLeaderboard.mockResolvedValue(buildLeaderboard());

    renderBoard();

    const publicLink = await screen.findByRole('link', { name: 'Open the public board' });
    expect(publicLink).toHaveAttribute('href', '/campaigns/winter-appeal/leaderboard');
  });

  /** A failed settings read has to be recoverable in place rather than leaving a dead screen. */
  it('Board_SettingsCannotBeRead_ShowsARecoverableNoticeAndRetriesOnRequest', async () => {
    getPeerToPeerSettings.mockRejectedValueOnce(new Error('network down'));
    getPeerToPeerSettings.mockResolvedValueOnce(buildSettings({ leaderboardVisibility: 'Public' }));
    getLeaderboard.mockResolvedValue(buildLeaderboard());

    renderBoard();

    expect(await screen.findByText('This leaderboard is not here')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findAllByText('Sarah Khan')).not.toHaveLength(0);
  });

  /** A campaign that never switched supporter fundraising on has no slug and so no board to read. */
  it('Board_CampaignWithoutASupporterFundraisingSlug_DoesNotAskForStandings', async () => {
    getPeerToPeerSettings.mockResolvedValue(
      buildSettings({ leaderboardVisibility: 'Public', peerToPeerSlug: null }),
    );

    renderBoard();

    expect(await screen.findByText('This leaderboard is not here')).toBeInTheDocument();
    expect(getLeaderboard).not.toHaveBeenCalled();
  });
});
