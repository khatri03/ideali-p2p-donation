import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildFundraiserPage } from '../peerToPeerTestFactory';

const getFundraiserPage = vi.fn();
const donateProps = vi.fn();

vi.mock('app/service/organizer/donation/fundraiserPageService', () => ({
  getFundraiserPage: (...args: unknown[]) => getFundraiserPage(...args),
}));

// The donation screen itself is the shipped payment flow and is not re-tested here. What matters is
// which campaign it is handed, and which supporter page the gift will be credited to.
vi.mock('../../donateToCampaign', () => ({
  default: (props: unknown) => {
    donateProps(props);
    return <p>Donation screen</p>;
  },
}));

const { default: FundraiserDonatePage } = await import('./FundraiserDonatePage');

const DONATE_PATH = '/campaigns/winter-appeal/sarah-khan/donate';

const renderPage = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[DONATE_PATH]}>
        <Routes>
          <Route
            path="/campaigns/:campaignSlug/:fundraiserSlug/donate"
            element={<FundraiserDonatePage />}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  getFundraiserPage.mockReset();
  donateProps.mockReset();
});

describe('FundraiserDonatePage', () => {
  it('Donate_LivePage_HandsTheDonationScreenTheCampaignResolvedFromTheServer', async () => {
    getFundraiserPage.mockResolvedValue(buildFundraiserPage());

    renderPage();

    expect(await screen.findByText('Donation screen')).toBeInTheDocument();
    expect(donateProps).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignUniqueId: '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881',
      }),
    );
  });

  it('Donate_LivePage_CarriesTheSupporterPageSoTheGiftIsCreditedToThem', async () => {
    getFundraiserPage.mockResolvedValue(buildFundraiserPage());

    renderPage();

    await screen.findByText('Donation screen');
    expect(donateProps).toHaveBeenCalledWith(
      expect.objectContaining({
        fundraiser: expect.objectContaining({
          slug: 'sarah-khan',
          displayName: 'Sarah Khan',
          organizerName: 'Hope Foundation',
          pagePath: '/campaigns/winter-appeal/sarah-khan',
        }),
      }),
    );
  });

  it('Donate_PageAwaitingApproval_IsRefusedBeforeAnyPaymentSurfaceIsShown', async () => {
    getFundraiserPage.mockResolvedValue(buildFundraiserPage({ state: 'AwaitingApproval' }));

    renderPage();

    expect(await screen.findByText('This page is waiting to be approved')).toBeInTheDocument();
    expect(screen.queryByText('Donation screen')).not.toBeInTheDocument();
  });

  it('Donate_CampaignFinished_IsRefusedBeforeAnyPaymentSurfaceIsShown', async () => {
    getFundraiserPage.mockResolvedValue(buildFundraiserPage({ state: 'CampaignEnded' }));

    renderPage();

    expect(await screen.findByText('This campaign has finished')).toBeInTheDocument();
    expect(screen.queryByText('Donation screen')).not.toBeInTheDocument();
  });

  it('Donate_UnknownPage_ShowsTheNotFoundScreenRatherThanTheDonationForm', async () => {
    getFundraiserPage.mockRejectedValue(new Error('Fundraising page not found.'));

    renderPage();

    expect(await screen.findByText('This fundraising page is not here')).toBeInTheDocument();
    expect(screen.queryByText('Donation screen')).not.toBeInTheDocument();
  });
});
