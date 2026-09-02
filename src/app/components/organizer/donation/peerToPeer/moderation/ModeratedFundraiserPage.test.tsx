import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CAMPAIGN_UNIQUE_ID,
  FUNDRAISER_UNIQUE_ID,
  buildFundraiserDetail,
} from './moderationTestFactory';

const getModeratedFundraiser = vi.fn();
const moderateFundraiser = vi.fn();

vi.mock('app/service/organizer/donation/peerToPeerModerationService', () => ({
  getModeratedFundraiser: (...args: unknown[]) => getModeratedFundraiser(...args),
  moderateFundraiser: (...args: unknown[]) => moderateFundraiser(...args),
}));

const { default: ModeratedFundraiserScreen } = await import('./ModeratedFundraiserPage');

const renderDetail = () =>
  render(
    <ChakraProvider>
      <MemoryRouter
        initialEntries={[
          `/organizer/donation/campaign/${CAMPAIGN_UNIQUE_ID}/peer-to-peer/fundraisers/${FUNDRAISER_UNIQUE_ID}`,
        ]}
      >
        <Routes>
          <Route
            path="/organizer/donation/campaign/:campaignUniqueId/peer-to-peer/fundraisers/:fundraiserUniqueId"
            element={<ModeratedFundraiserScreen />}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  getModeratedFundraiser.mockReset();
  moderateFundraiser.mockReset();
});

describe('ModeratedFundraiserPage', () => {
  it('Detail_LivePage_ShowsWhatTheSupporterWroteAndWhatItRaised', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail());

    renderDetail();

    expect(await screen.findByText('Running the half marathon for the ward.')).toBeInTheDocument();
    expect(screen.getByText('CA$170')).toBeInTheDocument();
    expect(screen.getByText('Ahmed K.')).toBeInTheDocument();
  });

  it('Detail_PageWithNoStory_SaysSoRatherThanShowingAnEmptyPanel', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail({ story: null }));

    renderDetail();

    expect(await screen.findByText('This page has no story on it.')).toBeInTheDocument();
  });

  it('Detail_NoDonationsYet_SaysSoRatherThanShowingAnEmptyList', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail({ recentSupporters: [] }));

    renderDetail();

    expect(await screen.findByText('No donations through this page yet.')).toBeInTheDocument();
  });

  it('Detail_LoadRefused_ShowsADesignedNoticeWithARetry', async () => {
    getModeratedFundraiser.mockRejectedValue(new Error('Fundraising page not found.'));

    renderDetail();

    expect(await screen.findByText('Fundraising page not found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('Actions_PageWaitingForApproval_OffersOnlyApproveAndTurnDown', async () => {
    getModeratedFundraiser.mockResolvedValue(
      buildFundraiserDetail({ currentStatus: 'PendingApproval' }),
    );

    renderDetail();

    expect(await screen.findByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Turn down' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hide' })).not.toBeInTheDocument();
  });

  it('Actions_LivePage_OffersHideRatherThanApprove', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail({ currentStatus: 'Active' }));

    renderDetail();

    expect(await screen.findByRole('button', { name: 'Hide' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });

  /**
   * Two red buttons that both take a page off the site, named for a decision that was made months ago,
   * left the charity pressing one to find out what it did. The live page is ended, not refused.
   */
  it('Actions_LivePage_NamesEndingItTakingItDownAndSaysTheSupporterIsTold', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail({ currentStatus: 'Active' }));

    renderDetail();

    expect(await screen.findByRole('button', { name: 'Take down' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Turn down' })).not.toBeInTheDocument();
    expect(screen.getByText(/Nobody is told/)).toBeInTheDocument();
    expect(screen.getByText(/Ends a page that is already live/)).toBeInTheDocument();
  });

  it('Actions_HiddenPage_OffersBringingItBack', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail({ currentStatus: 'Paused' }));

    renderDetail();

    expect(await screen.findByRole('button', { name: 'Bring back' })).toBeInTheDocument();
  });

  it('Hide_Chosen_SaysWhatHappensToTheMoneyBeforeItAsks', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail());

    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Hide' }));

    expect(await screen.findByText('Hide Sara Malik?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The page comes off the public site within one reload and stops taking donations. Nothing is deleted, the money it raised stays counted, and you can bring it back at any time.',
      ),
    ).toBeInTheDocument();
  });

  it('Hide_Cancelled_SendsNothing', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail());

    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Hide' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText('Hide Sara Malik?')).not.toBeInTheDocument());
    expect(moderateFundraiser).not.toHaveBeenCalled();
  });

  it('Hide_Confirmed_SendsTheActionWithTheReasonAndReadsThePageBack', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail());
    moderateFundraiser.mockResolvedValue(undefined);

    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Hide' }));
    await userEvent.type(screen.getByLabelText('Reason (optional)'), 'Wrong photo');
    await userEvent.click(screen.getByRole('button', { name: 'Hide this page' }));

    await waitFor(() =>
      expect(moderateFundraiser).toHaveBeenCalledWith(CAMPAIGN_UNIQUE_ID, FUNDRAISER_UNIQUE_ID, {
        action: 'Hide',
        reason: 'Wrong photo',
      }),
    );
    await waitFor(() => expect(getModeratedFundraiser).toHaveBeenCalledTimes(2));
  });

  it('Hide_ReasonLongerThanAllowed_IsRefusedOnScreenBeforeAnythingIsSent', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail());

    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Hide' }));

    fireEvent.change(await screen.findByLabelText('Reason (optional)'), {
      target: { value: 'x'.repeat(501) },
    });

    expect(
      await screen.findByText('Keep the reason to 500 characters or fewer.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide this page' })).toBeDisabled();
    expect(moderateFundraiser).not.toHaveBeenCalled();
  });

  it('Hide_ServerRefused_KeepsTheStatusAsItWasAndSaysWhy', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail());
    moderateFundraiser.mockRejectedValue(new Error('This page is already hidden.'));

    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Hide' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hide this page' }));

    expect(await screen.findByText('This page is already hidden.')).toBeInTheDocument();
    expect(getModeratedFundraiser).toHaveBeenCalledTimes(1);
  });

  it('Hide_StillInFlight_KeepsTheConfirmationUpWithBothButtonsUnavailable', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail());
    moderateFundraiser.mockReturnValue(new Promise(() => undefined));

    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Hide' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hide this page' }));

    expect(await screen.findByText('Hide Sara Malik?')).toBeInTheDocument();
    expect(await screen.findByText('Hiding...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByText('Hiding...').closest('button')).toBeDisabled();
  });

  it('History_DecisionsAlreadyTaken_SaysWhoDidWhatAndWhy', async () => {
    getModeratedFundraiser.mockResolvedValue(
      buildFundraiserDetail({
        history: [
          {
            uniqueId: 'entry-1',
            action: 'Hide',
            subject: 'Fundraiser',
            subjectName: 'Sara Malik',
            actedByName: 'Charity Desk',
            actedOnUtc: '2026-03-02T10:00:00Z',
            reason: 'Wrong photo',
          },
        ],
      }),
    );

    renderDetail();

    expect(await screen.findByText('Hidden Sara Malik — Charity Desk')).toBeInTheDocument();
    expect(screen.getByText('Wrong photo')).toBeInTheDocument();
  });

  it('History_NothingDoneYet_SaysSoRatherThanShowingAnEmptyPanel', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail());

    renderDetail();

    expect(await screen.findByText('Nothing has been changed on this yet.')).toBeInTheDocument();
  });

  it('PublicLink_CampaignWithNoAddressYet_SaysSoInsteadOfOfferingABrokenLink', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail({ campaignSlug: null }));

    renderDetail();

    expect(
      await screen.findByText('This campaign has no public address yet, so there is nothing to open.'),
    ).toBeInTheDocument();
  });

  it('PublicLink_CampaignWithAnAddress_PointsAtThePageDonorsSee', async () => {
    getModeratedFundraiser.mockResolvedValue(buildFundraiserDetail());

    renderDetail();

    expect(await screen.findByRole('link', { name: /Open the public page/ })).toHaveAttribute(
      'href',
      '/campaigns/winter-appeal/sara-malik',
    );
  });
});
