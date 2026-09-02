import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildJoinContext } from '../peerToPeerTestFactory';

const getFundraiserJoinContext = vi.fn();
const joinCampaignAsFundraiser = vi.fn();
const ensureAuthenticated = vi.fn();

vi.mock('app/service/organizer/donation/fundraiserJoinService', () => ({
  getFundraiserJoinContext: (...args: unknown[]) => getFundraiserJoinContext(...args),
  joinCampaignAsFundraiser: (...args: unknown[]) => joinCampaignAsFundraiser(...args),
}));

vi.mock('utils/auth', () => ({
  ensureAuthenticated: () => ensureAuthenticated(),
}));

const { default: FundraiserJoinPage } = await import('./FundraiserJoinPage');

const CAMPAIGN_ID = '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881';
const JOIN_PATH = `/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/join`;

const renderPage = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[JOIN_PATH]}>
        <Routes>
          <Route
            path="/donation/campaign/:campaignUniqueId/peer-to-peer/join"
            element={<FundraiserJoinPage />}
          />
          <Route path="/auth/sign-in/custom" element={<p>Sign in screen</p>} />
          <Route path="/member/my-fundraising" element={<p>Fundraising console</p>} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

const waitForForm = () =>
  waitFor(() => expect(screen.getByLabelText(/Name on your page/i)).toBeInTheDocument());

beforeEach(() => {
  getFundraiserJoinContext.mockReset();
  joinCampaignAsFundraiser.mockReset();
  ensureAuthenticated.mockReset();
  ensureAuthenticated.mockReturnValue(true);
  localStorage.setItem('userName', 'Sarah Khan');
});

afterEach(() => {
  localStorage.clear();
});

describe('FundraiserJoinPage', () => {
  /**
   * Reached from a shared link or from a confirmation email, with no session. Both ways in are
   * offered here, and nothing about the campaign is requested until there is a session to request
   * it with.
   */
  it('Join_SignedOutVisitor_IsOfferedBothWaysInAndNothingIsFetched', async () => {
    ensureAuthenticated.mockReturnValue(false);

    renderPage();

    expect(await screen.findByRole('tab', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Create account' })).toBeInTheDocument();
    expect(getFundraiserJoinContext).not.toHaveBeenCalled();
  });

  it('Join_WhileTheCampaignLoads_ShowsSkeletonInsteadOfAnEmptyForm', () => {
    getFundraiserJoinContext.mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(screen.queryByLabelText(/Name on your page/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Create my page/i })).not.toBeInTheDocument();
  });

  it('Join_CampaignFailsToLoad_OffersRetryAndRecoversWhenItSucceeds', async () => {
    getFundraiserJoinContext.mockRejectedValueOnce(new Error('network down'));

    renderPage();

    const retry = await screen.findByRole('button', { name: 'Try again' });
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext());

    await userEvent.click(retry);

    await waitForForm();
  });

  it('Join_CampaignWithFundraisingOff_ExplainsItAndOffersNoForm', async () => {
    getFundraiserJoinContext.mockResolvedValue(
      buildJoinContext({
        canJoin: false,
        blockedReason: 'This campaign is not accepting supporter fundraising pages.',
      }),
    );

    renderPage();

    expect(
      await screen.findByText('This campaign is not accepting supporter fundraising pages.'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Name on your page/i)).not.toBeInTheDocument();
  });

  it('Join_SupporterWhoAlreadyJoined_ShowsTheirExistingPageRatherThanASecondForm', async () => {
    getFundraiserJoinContext.mockResolvedValue(
      buildJoinContext({ alreadyJoined: true, slug: 'sarah-khan', currentStatus: 'Active' }),
    );

    renderPage();

    expect(
      await screen.findByText('You already have a page for this campaign'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${window.location.origin}/campaigns/winter-appeal/sarah-khan`),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Name on your page/i)).not.toBeInTheDocument();
  });

  it('Join_FormPrefilled_UsesTheSignedInNameAndTheCampaignGoal', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext({ defaultPersonalGoal: 500 }));

    renderPage();
    await waitForForm();

    expect(screen.getByLabelText(/Name on your page/i)).toHaveValue('Sarah Khan');
    expect(screen.getByLabelText(/Your fundraising goal/i)).toHaveValue(500);
  });

  /**
   * Somebody deciding whether to start needs to know what they end up with. The heading names the
   * screen; it does not say a page with its own address is created and that donations through it are
   * counted.
   */
  it('Join_FormShown_SaysWhatTheSupporterEndsUpWithBeforeTheFields', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext());

    renderPage();
    await waitForForm();

    expect(screen.getByText(/own page with its own web address/i)).toBeInTheDocument();
  });

  /**
   * One field carries a required marker. Without the other two being marked optional, that marker
   * reads as decoration and a supporter fills in answers the charity never asked for.
   */
  it('Join_OptionalFields_AreMarkedSoTheRequiredMarkerMeansSomething', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext());

    renderPage();
    await waitForForm();

    expect(screen.getByLabelText(/Your fundraising goal \(Optional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Why you are fundraising \(Optional\)/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Name on your page \(Optional\)/i)).not.toBeInTheDocument();
  });

  /**
   * The goal is money, and a bare number box does not say in what. The amount also has to read the
   * same way as the goal the charity set on its own settings screen.
   */
  it('Join_GoalField_NamesTheCurrencyTheAmountIsReadIn', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext());

    renderPage();
    await waitForForm();

    expect(screen.getByText('$')).toBeInTheDocument();
  });

  /**
   * A capped field that has run out stops accepting keystrokes, which is indistinguishable from a
   * broken keyboard. The remaining room is stated before the cap is reached.
   */
  it('Join_NameApproachingItsLimit_SaysHowMuchRoomIsLeft', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext());

    renderPage();
    await waitForForm();

    const name = screen.getByLabelText(/Name on your page/i);
    await userEvent.clear(name);
    await userEvent.click(name);
    await userEvent.paste('x'.repeat(65));

    expect(await screen.findByText('15 characters left')).toBeInTheDocument();
  });

  it('Join_Submitted_SendsTheAnswersAndShowsTheNewPageAddress', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext());
    joinCampaignAsFundraiser.mockResolvedValue({
      slug: 'sarah-khan',
      campaignSlug: 'winter-appeal',
      currentStatus: 'Active',
      alreadyJoined: false,
    });

    renderPage();
    await waitForForm();

    await userEvent.type(screen.getByLabelText(/Your fundraising goal/i), '250');
    await userEvent.type(screen.getByLabelText(/Why you are fundraising/i), 'Running for a reason.');
    await userEvent.click(screen.getByRole('button', { name: /Create my page/i }));

    await waitFor(() =>
      expect(joinCampaignAsFundraiser).toHaveBeenCalledWith(CAMPAIGN_ID, {
        displayName: 'Sarah Khan',
        personalGoal: 250,
        story: 'Running for a reason.',
        team: { kind: 'None', teamSlug: null, newTeam: null },
      }),
    );

    expect(await screen.findByText('Your fundraising page is live')).toBeInTheDocument();
    expect(
      screen.getByText(`${window.location.origin}/campaigns/winter-appeal/sarah-khan`),
    ).toBeInTheDocument();
  });

  it('Join_CampaignRequiringApproval_SaysThePageIsNotPublicYet', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext({ requiresApproval: true }));
    joinCampaignAsFundraiser.mockResolvedValue({
      slug: 'sarah-khan',
      campaignSlug: 'winter-appeal',
      currentStatus: 'PendingApproval',
      alreadyJoined: false,
    });

    renderPage();
    await waitForForm();

    await userEvent.click(screen.getByRole('button', { name: /Create my page/i }));

    expect(await screen.findByText('Your page has been sent for review')).toBeInTheDocument();
    expect(screen.getByText(/not public yet/i)).toBeInTheDocument();
  });

  /**
   * Only the menu item waits for the next sign-in; the console itself is reachable straight away. A
   * screen that answers "your page exists" with "now log out" hands the product's own limitation to
   * the person who just finished the work.
   */
  it('Join_PageCreated_LeadsWithTheWayToItRatherThanWithSigningOut', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext());
    joinCampaignAsFundraiser.mockResolvedValue({
      slug: 'sarah-khan',
      campaignSlug: 'winter-appeal',
      currentStatus: 'PendingApproval',
      alreadyJoined: false,
    });

    renderPage();
    await waitForForm();
    await userEvent.click(screen.getByRole('button', { name: /Create my page/i }));

    await userEvent.click(await screen.findByRole('button', { name: 'Go to my fundraising' }));

    expect(await screen.findByText('Fundraising console')).toBeInTheDocument();
  });

  /**
   * An address that answers nothing until the charity acts is worth reading and not worth sending, so
   * it is shown without a control that invites a supporter to send their friends to a dead page.
   */
  it('Join_PageWaitingForApproval_ShowsItsAddressButOffersNoWayToSendIt', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext());
    joinCampaignAsFundraiser.mockResolvedValue({
      slug: 'sarah-khan',
      campaignSlug: 'winter-appeal',
      currentStatus: 'PendingApproval',
      alreadyJoined: false,
    });

    renderPage();
    await waitForForm();
    await userEvent.click(screen.getByRole('button', { name: /Create my page/i }));

    expect(
      await screen.findByText(`${window.location.origin}/campaigns/winter-appeal/sarah-khan`),
    ).toBeInTheDocument();
    expect(screen.getByText(/Wait until the charity approves it/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy link' })).not.toBeInTheDocument();
  });

  /** A live page shares the way every other live page in the product shares. */
  it('Join_PageLiveStraightAway_OffersTheSameSharePanelAsTheRestOfTheProduct', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext());
    joinCampaignAsFundraiser.mockResolvedValue({
      slug: 'sarah-khan',
      campaignSlug: 'winter-appeal',
      currentStatus: 'Active',
      alreadyJoined: false,
    });

    renderPage();
    await waitForForm();
    await userEvent.click(screen.getByRole('button', { name: /Create my page/i }));

    expect(await screen.findByRole('heading', { level: 3, name: 'Share this page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });

  it('Join_AccountStoredWithoutAName_LeavesTheNameFieldEmptyRatherThanShowingUndefined', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext());
    localStorage.setItem('userName', undefined as unknown as string);

    renderPage();
    await waitForForm();

    expect(screen.getByLabelText(/Name on your page/i)).toHaveValue('');
  });

  it('Join_BlankDisplayName_ExplainsItselfAndSendsNothing', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext());
    localStorage.setItem('userName', '');

    renderPage();
    await waitForForm();

    await userEvent.click(screen.getByRole('button', { name: /Create my page/i }));

    expect(
      await screen.findByText('Enter the name to show on your fundraising page.'),
    ).toBeInTheDocument();
    expect(joinCampaignAsFundraiser).not.toHaveBeenCalled();
  });

  it('Join_GoalBelowOne_ExplainsItselfAndSendsNothing', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext());

    renderPage();
    await waitForForm();

    await userEvent.type(screen.getByLabelText(/Your fundraising goal/i), '0');
    await userEvent.click(screen.getByRole('button', { name: /Create my page/i }));

    expect(
      await screen.findByText('Enter an amount greater than zero, or leave this blank.'),
    ).toBeInTheDocument();
    expect(joinCampaignAsFundraiser).not.toHaveBeenCalled();
  });

  it('Join_ServerRefusesTheRequest_ReportsItAndKeepsTheSupporterOnTheForm', async () => {
    getFundraiserJoinContext.mockResolvedValue(buildJoinContext());
    joinCampaignAsFundraiser.mockRejectedValue(new Error('refused'));

    renderPage();
    await waitForForm();

    await userEvent.click(screen.getByRole('button', { name: /Create my page/i }));

    expect(await screen.findByText('Not created')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name on your page/i)).toBeInTheDocument();
  });
});
