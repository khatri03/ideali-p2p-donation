import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CAMPAIGN_UNIQUE_ID,
  buildFundraiser,
  buildList,
  buildTotals,
} from './moderationTestFactory';

const getModeratedFundraisers = vi.fn();

vi.mock('app/service/organizer/donation/peerToPeerModerationService', () => ({
  getModeratedFundraisers: (...args: unknown[]) => getModeratedFundraisers(...args),
}));

const { default: ModeratedFundraisersScreen } = await import('./ModeratedFundraisersPage');

const renderList = () =>
  render(
    <ChakraProvider>
      <MemoryRouter
        initialEntries={[`/organizer/donation/campaign/${CAMPAIGN_UNIQUE_ID}/peer-to-peer/fundraisers`]}
      >
        <Routes>
          <Route
            path="/organizer/donation/campaign/:campaignUniqueId/peer-to-peer/fundraisers"
            element={<ModeratedFundraisersScreen />}
          />
          <Route
            path="/organizer/donation/campaign/:campaignUniqueId/peer-to-peer/fundraisers/:fundraiserUniqueId"
            element={<p>Fundraiser review screen</p>}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

const lastQuery = () => getModeratedFundraisers.mock.calls.at(-1)?.[1];

beforeEach(() => {
  getModeratedFundraisers.mockReset();
});

describe('ModeratedFundraisersPage', () => {
  /**
   * The lifecycle emails are withheld until their sends are proven. A tab would let a charity switch a
   * template on and believe supporters are receiving it, which is exactly what the deferral prevents.
   */
  it('Tabs_LifecycleEmailsNotProvenYet_AreNotOfferedInTheOversightNavigation', async () => {
    getModeratedFundraisers.mockResolvedValue(buildList([buildFundraiser()]));

    renderList();

    expect(await screen.findByRole('link', { name: 'Invitations' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Emails' })).not.toBeInTheDocument();
  });

  it('List_PagesOnTheCampaign_ShowsEachWithWhatItRaised', async () => {
    getModeratedFundraisers.mockResolvedValue(buildList([buildFundraiser()]));

    renderList();

    expect(await screen.findAllByText('Sara Malik')).not.toHaveLength(0);
    expect(screen.getAllByText('CA$170').length).toBeGreaterThan(0);
  });

  it('List_Loaded_KeepsTheTwoTotalsApartAndLabelsEachWithItsDefinition', async () => {
    getModeratedFundraisers.mockResolvedValue(buildList([buildFundraiser()]));

    renderList();

    expect(await screen.findByText('Raised through fundraisers')).toBeInTheDocument();
    expect(screen.getByText('Raised in total')).toBeInTheDocument();
    expect(screen.getByText('CA$670')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Settled gifts that came in through a supporter's own page. Tips excluded, refunds deducted.",
      ),
    ).toBeInTheDocument();
  });

  it('List_LoadRefused_ShowsADesignedNoticeWithARetryRatherThanABlankScreen', async () => {
    getModeratedFundraisers.mockRejectedValue(new Error('Campaign not found.'));

    renderList();

    expect(await screen.findByText('Campaign not found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('List_RetryPressed_AsksTheServerAgain', async () => {
    getModeratedFundraisers.mockRejectedValueOnce(new Error('Campaign not found.'));
    getModeratedFundraisers.mockResolvedValue(buildList([buildFundraiser()]));

    renderList();

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findAllByText('Sara Malik')).not.toHaveLength(0);
  });

  it('List_NobodyFundraisingYet_ShowsTheDesignedEmptyStateRatherThanABareLine', async () => {
    getModeratedFundraisers.mockResolvedValue(buildList([]));

    renderList();

    expect(await screen.findByText('Nobody is fundraising yet')).toBeInTheDocument();
  });

  it('List_FilteredToNothing_SaysSoRatherThanClaimingNobodyIsFundraising', async () => {
    getModeratedFundraisers.mockResolvedValue(buildList([]));

    renderList();

    await userEvent.type(await screen.findByLabelText('Search fundraising pages'), 'zzz');

    expect(await screen.findByText('Nothing matches that')).toBeInTheDocument();
  });

  it('Search_Typed_AsksTheServerForThatNameFromTheFirstPage', async () => {
    getModeratedFundraisers.mockResolvedValue(buildList([buildFundraiser()]));

    renderList();

    await userEvent.type(await screen.findByLabelText('Search fundraising pages'), 'sara');

    await waitFor(() => expect(lastQuery()).toMatchObject({ search: 'sara', page: 1 }));
  });

  it('Status_Chosen_AsksTheServerForOnlyThosePages', async () => {
    getModeratedFundraisers.mockResolvedValue(buildList([buildFundraiser()]));

    renderList();

    await userEvent.selectOptions(await screen.findByLabelText('Status'), 'PendingApproval');

    await waitFor(() => expect(lastQuery()).toMatchObject({ status: 'PendingApproval' }));
  });

  it('Sort_Chosen_AsksTheServerToOrderItThatWay', async () => {
    getModeratedFundraisers.mockResolvedValue(buildList([buildFundraiser()]));

    renderList();

    await userEvent.selectOptions(await screen.findByLabelText('Sort by'), 'RaisedDescending');

    await waitFor(() => expect(lastQuery()).toMatchObject({ sortBy: 'RaisedDescending' }));
  });

  it('ClearFilters_NothingFilteredYet_IsUnavailableAndShowsNotAllowed', async () => {
    getModeratedFundraisers.mockResolvedValue(buildList([buildFundraiser()]));

    renderList();

    const clear = await screen.findByRole('button', { name: 'Clear filters' });

    expect(clear).toBeDisabled();
    expect(clear).toHaveStyle({ cursor: 'not-allowed' });
  });

  it('ClearFilters_AfterSearching_PutsTheListBackToEverything', async () => {
    getModeratedFundraisers.mockResolvedValue(buildList([buildFundraiser()]));

    renderList();

    await userEvent.type(await screen.findByLabelText('Search fundraising pages'), 'sara');
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => expect(lastQuery()).toMatchObject({ search: undefined }));
  });

  it('NextPage_LastPageShowing_IsUnavailable', async () => {
    getModeratedFundraisers.mockResolvedValue(buildList([buildFundraiser()]));

    renderList();

    expect(await screen.findByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('NextPage_MorePagesToCome_AsksTheServerForTheNextOne', async () => {
    getModeratedFundraisers.mockResolvedValue(
      buildList([buildFundraiser()], {
        totals: buildTotals(),
        page: {
          pageNo: 1,
          pageSize: 20,
          pageCount: 2,
          totalRecordsCount: 21,
          pageData: [buildFundraiser()],
        },
      }),
    );

    renderList();

    await userEvent.click(await screen.findByRole('button', { name: 'Next' }));

    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 2 }));
  });

  it('Export_NothingToExport_IsUnavailableAndShowsNotAllowed', async () => {
    getModeratedFundraisers.mockResolvedValue(buildList([]));

    renderList();

    const exportButton = await screen.findByRole('button', { name: 'Export as CSV' });

    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveStyle({ cursor: 'not-allowed' });
  });

  it('Review_Pressed_OpensThatPagesOwnReviewScreen', async () => {
    getModeratedFundraisers.mockResolvedValue(buildList([buildFundraiser()]));

    renderList();

    await userEvent.click((await screen.findAllByRole('link', { name: 'Review Sara Malik' }))[0]);

    expect(await screen.findByText('Fundraiser review screen')).toBeInTheDocument();
  });
});
