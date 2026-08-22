import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildFundraiserPage } from '../peerToPeerTestFactory';

const getFundraiserPage = vi.fn();

vi.mock('app/service/organizer/donation/fundraiserPageService', () => ({
  getFundraiserPage: (...args: unknown[]) => getFundraiserPage(...args),
}));

const { default: FundraiserPageScreen } = await import('./FundraiserPage');

const PAGE_PATH = '/campaigns/winter-appeal/sarah-khan';

const renderPage = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[PAGE_PATH]}>
        <Routes>
          <Route path="/campaigns/:campaignSlug/:fundraiserSlug" element={<FundraiserPageScreen />} />
          <Route
            path="/campaigns/:campaignSlug/:fundraiserSlug/donate"
            element={<p>Donation screen</p>}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  getFundraiserPage.mockReset();
});

describe('FundraiserPage', () => {
  it('Page_LivePage_LeadsWithThePersonNotTheCharity', async () => {
    getFundraiserPage.mockResolvedValue(buildFundraiserPage());

    renderPage();

    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Sarah Khan');
    expect(screen.getByText(/Sarah Khan is fundraising for Hope Foundation/i)).toBeInTheDocument();
  });

  it('Page_LivePage_ShowsTheRaisedTotalAgainstTheGoal', async () => {
    getFundraiserPage.mockResolvedValue(buildFundraiserPage({ raisedAmount: 310, goal: 500 }));

    renderPage();

    expect(await screen.findByText('$310 of $500')).toBeInTheDocument();
    expect(screen.getByText('62% there')).toBeInTheDocument();
    expect(screen.getByText('22 donors')).toBeInTheDocument();
  });

  it('Page_FundraiserWithNoGoal_ShowsTheTotalWithoutAProgressBar', async () => {
    getFundraiserPage.mockResolvedValue(buildFundraiserPage({ goal: null, raisedAmount: 120 }));

    renderPage();

    expect(await screen.findByText('$120')).toBeInTheDocument();
    expect(screen.queryByText(/% there/)).not.toBeInTheDocument();
  });

  it('Page_StoryContainsMarkup_RendersItAsTextRatherThanHtml', async () => {
    getFundraiserPage.mockResolvedValue(
      buildFundraiserPage({ story: '<script>alert(1)</script> Please help.' }),
    );

    const { container } = renderPage();

    expect(
      await screen.findByText(/<script>alert\(1\)<\/script> Please help\./),
    ).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });

  it('Page_NoDonationsYet_ShowsADesignedEmptyStateRatherThanABlankPanel', async () => {
    getFundraiserPage.mockResolvedValue(buildFundraiserPage({ recentSupporters: [], donorCount: 0 }));

    renderPage();

    expect(await screen.findByText('No donations yet')).toBeInTheDocument();
    expect(screen.getByText(/Be the first to give/i)).toBeInTheDocument();
  });

  it('Page_AnonymousSupporter_IsNeverNamed', async () => {
    getFundraiserPage.mockResolvedValue(
      buildFundraiserPage({
        recentSupporters: [{ donorName: 'Anonymous', amount: 25, givenOnUtc: '2026-03-09T00:00:00Z' }],
      }),
    );

    renderPage();

    expect(await screen.findByText('Anonymous')).toBeInTheDocument();
  });

  it('Page_UnknownSlug_ShowsTheNotFoundScreenWithNoBackendDetail', async () => {
    getFundraiserPage.mockRejectedValue(new Error('Fundraising page not found.'));

    renderPage();

    expect(await screen.findByText('This fundraising page is not here')).toBeInTheDocument();
    expect(screen.queryByText(/api\//i)).not.toBeInTheDocument();
  });

  it('Page_LoadFailed_OffersARetryThatCallsTheServiceAgain', async () => {
    getFundraiserPage.mockRejectedValueOnce(new Error('Fundraising page not found.'));
    getFundraiserPage.mockResolvedValueOnce(buildFundraiserPage());

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    await waitFor(() => expect(getFundraiserPage).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('heading', { level: 1, name: 'Sarah Khan' })).toBeInTheDocument();
  });

  it('Page_AwaitingApproval_ExplainsTheWaitAndOffersNoDonateButton', async () => {
    getFundraiserPage.mockResolvedValue(
      buildFundraiserPage({ state: 'AwaitingApproval', story: null }),
    );

    renderPage();

    expect(await screen.findByText('This page is waiting to be approved')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Donate to/i })).not.toBeInTheDocument();
  });

  it('Page_Withdrawn_SaysSoAndTakesNoMoney', async () => {
    getFundraiserPage.mockResolvedValue(buildFundraiserPage({ state: 'Closed' }));

    renderPage();

    expect(await screen.findByText('This page is not taking donations')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Donate to/i })).not.toBeInTheDocument();
  });

  it('Page_CampaignFinished_SaysSoAndTakesNoMoney', async () => {
    getFundraiserPage.mockResolvedValue(buildFundraiserPage({ state: 'CampaignEnded' }));

    renderPage();

    expect(await screen.findByText('This campaign has finished')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Donate to/i })).not.toBeInTheDocument();
  });

  it('Donate_ButtonPressed_TakesTheDonorToTheDonationScreenForThisFundraiser', async () => {
    getFundraiserPage.mockResolvedValue(buildFundraiserPage());

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Donate to Sarah Khan' }));

    expect(await screen.findByText('Donation screen')).toBeInTheDocument();
  });

  it('Share_LinkPanel_ShowsThePublicAddressSoItCanBeCopiedByHand', async () => {
    getFundraiserPage.mockResolvedValue(buildFundraiserPage());

    renderPage();

    expect(
      await screen.findByText(`${window.location.origin}/campaigns/winter-appeal/sarah-khan`),
    ).toBeInTheDocument();
  });

  it('Preview_LivePage_NamesThePersonInTheDocumentTitleSoASharedLinkLooksLikeThem', async () => {
    getFundraiserPage.mockResolvedValue(buildFundraiserPage());

    renderPage();

    await screen.findByRole('heading', { level: 1, name: 'Sarah Khan' });
    await waitFor(() =>
      expect(document.title).toBe('Sarah Khan is fundraising for Hope Foundation'),
    );
  });
});
