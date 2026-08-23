import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMyFundraisingPage } from '../peerToPeerTestFactory';

const getMyFundraisingPages = vi.fn();

vi.mock('app/service/organizer/donation/fundraiserConsoleService', () => ({
  getMyFundraisingPages: (...args: unknown[]) => getMyFundraisingPages(...args),
  fundraiserPhotoUrl: (id: string) => `/api/images/${id}.png`,
}));

const { default: MyFundraisingScreen } = await import('./MyFundraisingPage');

const renderConsole = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={['/member/my-fundraising']}>
        <Routes>
          <Route path="/member/my-fundraising" element={<MyFundraisingScreen />} />
          <Route path="/member/my-fundraising/:id" element={<p>Edit screen</p>} />
          <Route path="/member/discover" element={<p>Discover screen</p>} />
          <Route path="/campaigns/:campaignSlug/:fundraiserSlug" element={<p>Public page</p>} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  getMyFundraisingPages.mockReset();
});

describe('MyFundraisingPage', () => {
  it('Console_OnePage_ShowsItsCampaignTotalAndGoal', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage()]);

    renderConsole();

    expect(await screen.findByText('Winter Appeal')).toBeInTheDocument();
    expect(screen.getByText('$310 of $500')).toBeInTheDocument();
    expect(screen.getByText('22 donors')).toBeInTheDocument();
  });

  it('Console_TwoCampaigns_AreListedSeparatelyWithTheirOwnTotals', async () => {
    getMyFundraisingPages.mockResolvedValue([
      buildMyFundraisingPage(),
      buildMyFundraisingPage({
        uniqueId: 'second-page-id',
        campaignName: 'Summer Appeal',
        campaignSlug: 'summer-appeal',
        slug: 'sarah-summer',
        raisedAmount: 90,
        goal: 200,
      }),
    ]);

    renderConsole();

    expect(await screen.findByText('Winter Appeal')).toBeInTheDocument();
    expect(screen.getByText('Summer Appeal')).toBeInTheDocument();
    expect(screen.getByText('$90 of $200')).toBeInTheDocument();
  });

  it('Console_PageWaitingForApproval_SaysSoAndExplainsTheWait', async () => {
    getMyFundraisingPages.mockResolvedValue([
      buildMyFundraisingPage({ currentStatus: 'PendingApproval' }),
    ]);

    renderConsole();

    expect(await screen.findByText('Waiting for approval')).toBeInTheDocument();
    expect(screen.getByText(/reviews new pages before they go live/i)).toBeInTheDocument();
  });

  it('Console_CampaignThatHasFinished_ExplainsThePageNoLongerTakesDonations', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage({ isCampaignOpen: false })]);

    renderConsole();

    expect(await screen.findByText(/no longer taking donations/i)).toBeInTheDocument();
  });

  it('Console_NoPagesAtAll_ShowsTheDesignedEmptyStateRatherThanABlankArea', async () => {
    getMyFundraisingPages.mockResolvedValue([]);

    renderConsole();

    expect(await screen.findByText('You are not fundraising yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find a campaign' })).toBeInTheDocument();
  });

  it('Console_ReadFails_ExplainsItAndOffersARetryRatherThanShowingNothing', async () => {
    getMyFundraisingPages.mockRejectedValue(new Error('Network down'));

    renderConsole();

    expect(await screen.findByText('Could not load your fundraising pages.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('Console_RetryPressed_AsksTheApiAgain', async () => {
    getMyFundraisingPages.mockRejectedValueOnce(new Error('Network down'));
    getMyFundraisingPages.mockResolvedValueOnce([buildMyFundraisingPage()]);

    renderConsole();

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Winter Appeal')).toBeInTheDocument();
  });

  it('Console_EditPressed_OpensThatPagesEditor', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage()]);

    renderConsole();

    await userEvent.click(await screen.findByRole('button', { name: 'Edit my page' }));

    expect(await screen.findByText('Edit screen')).toBeInTheDocument();
  });

  it('Console_ViewPressed_OpensThePublicPageAtTheSharedAddress', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage()]);

    renderConsole();

    await userEvent.click(await screen.findByRole('button', { name: 'View my page' }));

    expect(await screen.findByText('Public page')).toBeInTheDocument();
  });

  it('Console_ShareLink_IsShownInFullSoItCanBeCopiedByHand', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage()]);

    renderConsole();

    expect(
      await screen.findByText(`${window.location.origin}/campaigns/winter-appeal/sarah-khan`),
    ).toBeInTheDocument();
  });
});
