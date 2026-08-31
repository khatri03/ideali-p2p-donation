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

const stubClipboard = (writeText: ReturnType<typeof vi.fn>) => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  });
};

const renderConsole = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={['/member/my-fundraising']}>
        <Routes>
          <Route path="/member/my-fundraising" element={<MyFundraisingScreen />} />
          <Route path="/member/my-fundraising/:id" element={<p>Edit screen</p>} />
          <Route path="/member/discover" element={<p>Discover screen</p>} />
          <Route path="/campaigns/:campaignSlug/teams" element={<p>Browse teams screen</p>} />
          <Route
            path="/campaigns/:campaignSlug/teams/:teamSlug"
            element={<p>Team page screen</p>}
          />
          <Route path="/campaigns/:campaignSlug/:fundraiserSlug" element={<p>Public page</p>} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  getMyFundraisingPages.mockReset();
});

describe('MyFundraisingPage', () => {
  it('Console_FindATeam_OpensTheTeamsScreenForThatCampaign', async () => {
    getMyFundraisingPages.mockResolvedValue([
      buildMyFundraisingPage({ areTeamsAllowed: true, myTeam: null }),
    ]);

    renderConsole();

    await userEvent.click(await screen.findByRole('button', { name: 'Find a team' }));

    expect(screen.getByText('Browse teams screen')).toBeInTheDocument();
  });

  it('Console_MyTeam_OpensThatTeamsPage', async () => {
    getMyFundraisingPages.mockResolvedValue([
      buildMyFundraisingPage({
        areTeamsAllowed: true,
        myTeam: { slug: 'night-runners', name: 'Night Runners' },
      }),
    ]);

    renderConsole();

    await userEvent.click(await screen.findByRole('button', { name: 'My team: Night Runners' }));

    expect(screen.getByText('Team page screen')).toBeInTheDocument();
  });

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

  it('Console_ViewMyPage_OpensThePublicAddressInANewTabWithoutHandingItThisOne', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage()]);

    renderConsole();

    const view = await screen.findByRole('link', { name: /View my page/ });

    expect(view).toHaveAttribute(
      'href',
      `${window.location.origin}/campaigns/winter-appeal/sarah-khan`,
    );
    expect(view).toHaveAttribute('target', '_blank');
    expect(view).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('Console_ViewMyPage_SaysItLeavesTheScreenForAnyoneNotLookingAtIt', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage()]);

    renderConsole();

    expect(await screen.findByRole('link', { name: /View my page \(opens in a new tab\)/ }))
      .toBeInTheDocument();
  });

  it('Console_PageWithNoCampaignAddress_OffersNoDeadLinkToOpen', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage({ campaignSlug: null })]);

    renderConsole();

    const view = await screen.findByText('View my page');

    expect(view.closest('a')).toHaveAttribute('aria-disabled', 'true');
    expect(view.closest('a')).not.toHaveAttribute('href');
  });

  /**
   * The address is what the copy control puts on the clipboard and what "View my page" opens, so
   * printing it as well costs a panel per page to tell the supporter something two controls beside it
   * already do.
   */
  it('Console_CopyLinkOffered_DoesNotAlsoPrintTheAddressBesideIt', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage()]);

    renderConsole();

    expect(await screen.findByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    expect(
      screen.queryByText(`${window.location.origin}/campaigns/winter-appeal/sarah-khan`),
    ).not.toBeInTheDocument();
  });

  /**
   * A browser that refuses the clipboard must not leave the supporter with no way to send their page.
   * Pointing them at the address bar would be wrong here - it holds the console, not the page.
   */
  it('Console_ClipboardRefused_RevealsTheAddressSoItCanStillBeSentByHand', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage()]);
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));

    renderConsole();

    await userEvent.click(await screen.findByRole('button', { name: 'Copy link' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Copy the address below by hand instead.',
    );
    expect(
      screen.getByText(`${window.location.origin}/campaigns/winter-appeal/sarah-khan`),
    ).toBeInTheDocument();
  });

  it('Console_EveryCampaignFinished_ShowsTheDesignedScreenForSomebodyWhoUsedToFundraise', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage({ isCampaignOpen: false })]);

    renderConsole();

    expect(await screen.findByText('Your campaigns have all finished')).toBeInTheDocument();
    expect(
      screen.getByText(/pick a campaign that is still taking supporter pages/),
    ).toBeInTheDocument();
  });

  it('Console_OneCampaignStillRunning_DoesNotSayEverythingHasFinished', async () => {
    getMyFundraisingPages.mockResolvedValue([
      buildMyFundraisingPage({ isCampaignOpen: false }),
      buildMyFundraisingPage({ uniqueId: 'second-page', isCampaignOpen: true }),
    ]);

    renderConsole();

    await screen.findAllByLabelText('Sarah Khan fundraising for Winter Appeal');
    expect(screen.queryByText('Your campaigns have all finished')).not.toBeInTheDocument();
  });

  /**
   * The sections are the campaigns, so a section is named after the campaign it groups and the
   * supporter's own page is named beneath it. A row named after anything else cannot be scanned.
   */
  it('Console_Section_IsNamedAfterItsCampaignAndThePageBeneathIt', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage()]);

    renderConsole();

    const section = await screen.findByRole('heading', { level: 2, name: /Winter Appeal/ });

    expect(section).toHaveTextContent('Winter Appeal');
    expect(section).toHaveTextContent('Your page: Sarah Khan');
  });

  /**
   * Collapsing has to hide the noise, not the point of the screen. A shut section still answers which
   * campaign it is, how much it has raised against its goal, and what state the charity has it in.
   */
  it('Console_SectionShut_StillStatesItsCampaignMoneyAndState', async () => {
    getMyFundraisingPages.mockResolvedValue([
      buildMyFundraisingPage(),
      buildMyFundraisingPage({ uniqueId: 'second-page', campaignName: 'Summer Appeal' }),
    ]);

    renderConsole();

    const section = await screen.findByRole('button', { name: /Winter Appeal/ });

    expect(section).toHaveAttribute('aria-expanded', 'false');
    expect(section).toHaveTextContent('$310 of $500');
    expect(section).toHaveTextContent('Live');
  });

  /**
   * An accordion of one is a click charged for nothing, so a supporter with a single campaign reads it
   * straight away and is offered no controls for opening and shutting a list of one.
   */
  it('Console_OnlyOneCampaign_OpensItAndOffersNoExpandControls', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage()]);

    renderConsole();

    expect(await screen.findByRole('button', { name: /Winter Appeal/ }))
      .toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('button', { name: 'Expand all' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Collapse all' })).not.toBeInTheDocument();
  });

  /** Reading several campaigns at once is the reason the sections shut in the first place. */
  it('Console_ExpandAll_OpensEverySectionAndCollapseAllShutsThemAgain', async () => {
    getMyFundraisingPages.mockResolvedValue([
      buildMyFundraisingPage(),
      buildMyFundraisingPage({ uniqueId: 'second-page', campaignName: 'Summer Appeal' }),
    ]);

    renderConsole();

    await userEvent.click(await screen.findByRole('button', { name: 'Expand all' }));

    expect(screen.getByRole('button', { name: /Winter Appeal/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Summer Appeal/ })).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Collapse all' }));

    expect(screen.getByRole('button', { name: /Winter Appeal/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /Summer Appeal/ })).toHaveAttribute('aria-expanded', 'false');
  });

  /** A control that would do nothing says so rather than pretending it is still worth pressing. */
  it('Console_EverySectionAlreadyShut_DisablesCollapseAll', async () => {
    getMyFundraisingPages.mockResolvedValue([
      buildMyFundraisingPage(),
      buildMyFundraisingPage({ uniqueId: 'second-page', campaignName: 'Summer Appeal' }),
    ]);

    renderConsole();

    expect(await screen.findByRole('button', { name: 'Collapse all' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Expand all' })).toBeEnabled();
  });

  /**
   * The console keeps its own heading when a load fails, so a failure announced as a second
   * first-level heading leaves a screen reader with two headings claiming to own the screen.
   */
  it('Console_LoadFails_AnnouncesTheFailureBeneathTheScreensOwnHeading', async () => {
    getMyFundraisingPages.mockRejectedValue(new Error('Your session has expired. Please sign in again.'));

    renderConsole();

    expect(await screen.findByRole('heading', { level: 1, name: 'My fundraising' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Could not load your fundraising pages.' }),
    ).toBeInTheDocument();
  });

  /**
   * The donations panel belongs to the card above it. Announcing both at the same level made a console
   * of several pages read as an unstructured run of identical sections.
   */
  it('Console_PanelsInsideACard_SitBelowItInTheHeadingOutline', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage()]);

    renderConsole();

    expect(await screen.findByRole('heading', { level: 2, name: /Winter Appeal/ })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Recent supporters' }),
    ).toBeInTheDocument();
  });

  /**
   * Editing, viewing and sending the page are the three things a supporter came here to do, so they
   * read as one row of equals rather than two buttons and a panel doing the third.
   */
  it('Console_Card_OffersEditViewAndCopyAsOneRowOfActions', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage()]);

    renderConsole();

    expect(await screen.findByRole('button', { name: 'Edit my page' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View my page/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });

  /** The first thing a supporter with several pages wants is the one number none of the cards state. */
  it('Console_SeveralPages_StatesWhatTheyHaveRaisedInTotal', async () => {
    getMyFundraisingPages.mockResolvedValue([
      buildMyFundraisingPage({ raisedAmount: 310, donorCount: 22 }),
      buildMyFundraisingPage({ uniqueId: 'second-page', raisedAmount: 90, donorCount: 3 }),
    ]);

    renderConsole();

    expect(await screen.findByText('Everything you have raised')).toBeInTheDocument();
    expect(screen.getByText('$400')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  /** One page needs no headline: the card beneath it already says the same figure. */
  it('Console_OnlyOnePage_ShowsNoTotalsPanelBecauseTheCardAlreadySaysIt', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage()]);

    renderConsole();

    await screen.findByRole('heading', { level: 2, name: /Winter Appeal/ });
    expect(screen.queryByText('Everything you have raised')).not.toBeInTheDocument();
  });

  /** Dollars and pounds do not add up, so no figure is invented to fill the space. */
  it('Console_PagesInDifferentCurrencies_SaysWhyThereIsNoSingleTotal', async () => {
    getMyFundraisingPages.mockResolvedValue([
      buildMyFundraisingPage({ currencySymbol: 'USD' }),
      buildMyFundraisingPage({ uniqueId: 'second-page', currencySymbol: 'CAD' }),
    ]);

    renderConsole();

    expect(await screen.findByText(/raise in different currencies/)).toBeInTheDocument();
    expect(screen.queryByText('Raised in total')).not.toBeInTheDocument();
  });

  /**
   * A reader is told why nothing here can be acted on before they scroll a list of pages looking for
   * something to act on.
   */
  it('Console_EveryCampaignFinished_SaysSoBeforeTheListRatherThanAfterIt', async () => {
    getMyFundraisingPages.mockResolvedValue([buildMyFundraisingPage({ isCampaignOpen: false })]);

    renderConsole();

    const notice = await screen.findByText('Your campaigns have all finished');
    const card = screen.getByLabelText('Sarah Khan fundraising for Winter Appeal');

    expect(notice.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
