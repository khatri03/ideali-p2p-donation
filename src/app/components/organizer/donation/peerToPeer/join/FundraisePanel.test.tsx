import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FundraiserJoinContext, FundraiserStatus } from 'app/interface/donationInter/fundraiserJoinDto';
import { buildJoinContext } from '../peerToPeerTestFactory';

const ensureAuthenticated = vi.fn();
const getFundraiserJoinContext = vi.fn();

vi.mock('utils/auth', () => ({
  ensureAuthenticated: () => ensureAuthenticated(),
}));

vi.mock('app/service/organizer/donation/fundraiserJoinService', () => ({
  getFundraiserJoinContext: (...args: unknown[]) => getFundraiserJoinContext(...args),
}));

const { default: FundraisePanel } = await import('./FundraisePanel');

const CAMPAIGN_ID = '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881';

const buildExistingPage = (currentStatus: FundraiserStatus): FundraiserJoinContext =>
  buildJoinContext({ alreadyJoined: true, slug: 'sarah-khan', currentStatus });

const WhereAmI = () => {
  const location = useLocation();

  return <p>{`${location.pathname}${location.search}`}</p>;
};

const CAMPAIGN_COLOUR = '#0f7b4a';

const renderPanel = (isPeerToPeerEnabled: boolean, campaignUniqueId = CAMPAIGN_ID) =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={['/donate/start']}>
        <Routes>
          <Route
            path="/donate/start"
            element={
              <FundraisePanel
                campaignUniqueId={campaignUniqueId}
                isPeerToPeerEnabled={isPeerToPeerEnabled}
                themeColor={CAMPAIGN_COLOUR}
                cardBg="white"
                cardBorder="gray.200"
                textColor="gray.800"
                subTextColor="gray.600"
              />
            }
          />
          <Route path="*" element={<WhereAmI />} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

const INVITATION = /Fundraise for this/i;

beforeEach(() => {
  ensureAuthenticated.mockReset();
  getFundraiserJoinContext.mockReset();
  getFundraiserJoinContext.mockResolvedValue(buildJoinContext());
});

describe('FundraisePanel', () => {
  it('EntryPoint_CampaignWithFundraisingOff_RendersNothing', () => {
    ensureAuthenticated.mockReturnValue(true);

    renderPanel(false);

    expect(screen.queryByRole('button', { name: INVITATION })).not.toBeInTheDocument();
    expect(getFundraiserJoinContext).not.toHaveBeenCalled();
  });

  it('EntryPoint_CampaignWithoutAnIdentifier_RendersNothing', () => {
    ensureAuthenticated.mockReturnValue(true);

    renderPanel(true, '');

    expect(screen.queryByRole('button', { name: INVITATION })).not.toBeInTheDocument();
    expect(getFundraiserJoinContext).not.toHaveBeenCalled();
  });

  it('EntryPoint_SupporterWithNoPage_GoesStraightToTheJoinScreen', async () => {
    ensureAuthenticated.mockReturnValue(true);

    renderPanel(true);
    await userEvent.click(await screen.findByRole('button', { name: INVITATION }));

    expect(
      screen.getByText(`/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/join`),
    ).toBeInTheDocument();
  });

  /**
   * A visitor with no session stays on the campaign. Sending them to another screen was how they
   * used to lose the thread of what they had come to do.
   */
  it('EntryPoint_SignedOutVisitor_OffersBothWaysInWithoutLeavingTheCampaign', async () => {
    ensureAuthenticated.mockReturnValue(false);

    renderPanel(true);
    await userEvent.click(await screen.findByRole('button', { name: INVITATION }));

    expect(await screen.findByRole('tab', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Create account' })).toBeInTheDocument();
    expect(
      screen.queryByText(`/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/join`),
    ).not.toBeInTheDocument();
  });

  /**
   * Nothing about the viewer is knowable without a session, so a signed-out visitor is never made to
   * wait on a request that could not answer for them.
   */
  it('EntryPoint_SignedOutVisitor_IsNotMadeToWaitOnAnAuthenticatedRequest', async () => {
    ensureAuthenticated.mockReturnValue(false);

    renderPanel(true);

    expect(await screen.findByRole('button', { name: INVITATION })).toBeInTheDocument();
    expect(getFundraiserJoinContext).not.toHaveBeenCalled();
  });

  /**
   * Inviting somebody to do a thing they have already done is a lie the next screen has to correct.
   * A supporter who is already fundraising is offered the way back to their own page instead.
   */
  it('EntryPoint_SupporterAlreadyFundraising_OffersTheirPageRatherThanTheInvitation', async () => {
    ensureAuthenticated.mockReturnValue(true);
    getFundraiserJoinContext.mockResolvedValue(buildExistingPage('Active'));

    renderPanel(true);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Go to your fundraising page' }),
    );

    expect(screen.getByText('/campaigns/winter-appeal/sarah-khan')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: INVITATION })).not.toBeInTheDocument();
  });

  /**
   * Waiting is the state people ask about most, so the campaign says it plainly and still hands over
   * a working control: the supporter can open their own page and see for themselves.
   */
  it('EntryPoint_SupporterWaitingOnTheCharity_SaysSoAndStillOpensTheirPage', async () => {
    ensureAuthenticated.mockReturnValue(true);
    getFundraiserJoinContext.mockResolvedValue(buildExistingPage('PendingApproval'));

    renderPanel(true);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Your page is waiting for approval' }),
    );

    expect(screen.getByText('/campaigns/winter-appeal/sarah-khan')).toBeInTheDocument();
  });

  /**
   * A refusal reaches the supporter by email and is written plainly on their own console. A campaign
   * page a friend may be reading over their shoulder never repeats it, and never invites a second
   * page the server would refuse anyway.
   */
  it('EntryPoint_PageTurnedDown_SaysNothingAboutItOnAPublicScreen', async () => {
    ensureAuthenticated.mockReturnValue(true);
    getFundraiserJoinContext.mockResolvedValue(buildExistingPage('Rejected'));

    renderPanel(true);

    await waitFor(() => expect(getFundraiserJoinContext).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText(/turned down/i)).not.toBeInTheDocument();
  });

  /** A paused page is the charity's business with that supporter, not a notice for the campaign. */
  it('EntryPoint_PagePaused_SaysNothingAboutItOnAPublicScreen', async () => {
    ensureAuthenticated.mockReturnValue(true);
    getFundraiserJoinContext.mockResolvedValue(buildExistingPage('Paused'));

    renderPanel(true);

    await waitFor(() => expect(getFundraiserJoinContext).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  /**
   * A failed lookup must not lock a supporter out of a campaign. The invitation stays, and the join
   * screen refuses a second page on its own.
   */
  it('EntryPoint_LookupFailed_KeepsTheInvitationRatherThanBlockingTheWayIn', async () => {
    ensureAuthenticated.mockReturnValue(true);
    getFundraiserJoinContext.mockRejectedValue(new Error('This campaign could not be read.'));

    renderPanel(true);

    expect(await screen.findByRole('button', { name: INVITATION })).toBeInTheDocument();
  });

  /**
   * Whoever runs the campaign also decides which pages on it go live, so the server refuses them a page
   * of their own. Offering the invitation here would walk them into a screen that says no, and a page
   * they approved themselves would put the charity on its own supporter leaderboard.
   */
  it('EntryPoint_ViewerWhoRunsTheCampaign_IsNotInvitedToFundraiseOnIt', async () => {
    ensureAuthenticated.mockReturnValue(true);
    getFundraiserJoinContext.mockResolvedValue(
      buildJoinContext({
        canJoin: false,
        blockedKind: 'RunsThisCampaign',
        blockedReason: 'Your organisation runs this campaign.',
      }),
    );

    renderPanel(true);

    await waitFor(() => expect(getFundraiserJoinContext).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText(/runs this campaign/i)).not.toBeInTheDocument();
  });

  /**
   * An unconfirmed address is a wait the supporter can end themselves, so the way in stays open and the
   * join screen is where they are told to confirm. Treating every refusal alike would strand them.
   */
  it('EntryPoint_ViewerWithAnUnconfirmedAddress_IsStillOfferedTheWayIn', async () => {
    ensureAuthenticated.mockReturnValue(true);
    getFundraiserJoinContext.mockResolvedValue(
      buildJoinContext({
        canJoin: false,
        blockedKind: 'EmailNotConfirmed',
        blockedReason: 'Confirm your email address.',
      }),
    );

    renderPanel(true);

    expect(await screen.findByRole('button', { name: INVITATION })).toBeInTheDocument();
  });

  /**
   * Every other surface on a campaign page is drawn in the colour the charity chose. A control in the
   * product's own brand colour reads as an advertisement dropped onto the page rather than a second
   * thing the campaign is offering.
   */
  it('Panel_Invitation_IsDrawnInTheCampaignsOwnColourNotTheProductBrand', async () => {
    ensureAuthenticated.mockReturnValue(true);

    renderPanel(true);

    const invitation = await screen.findByRole('button', { name: INVITATION });
    expect(invitation).toHaveStyle({ color: CAMPAIGN_COLOUR });
    expect(invitation).toHaveStyle({ borderColor: CAMPAIGN_COLOUR });
  });

  /**
   * Fundraising is a bigger commitment than giving, and a bare button never says what it commits the
   * reader to. The panel names the offer and what it involves before the control is reached.
   */
  it('Panel_Invitation_SaysWhatFundraisingInvolvesBeforeOfferingTheControl', async () => {
    ensureAuthenticated.mockReturnValue(true);

    renderPanel(true);

    expect(
      await screen.findByRole('heading', { name: 'Fundraise for this campaign' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Create your own page and ask friends and family to give through you.'),
    ).toBeInTheDocument();
  });

  /**
   * Somebody still waiting on the charity is told what the wait blocks, because the button alone says
   * only that a wait exists and leaves them wondering whether donations are already being taken.
   */
  it('Panel_SupporterWaitingOnTheCharity_SaysNoDonationsCanBeTakenYet', async () => {
    ensureAuthenticated.mockReturnValue(true);
    getFundraiserJoinContext.mockResolvedValue(buildExistingPage('PendingApproval'));

    renderPanel(true);

    expect(await screen.findByRole('heading', { name: 'Your page is with the charity' })).toBeInTheDocument();
    expect(screen.getByText(/Nobody can donate through it until it is approved/)).toBeInTheDocument();
  });

  /**
   * The wrong wording shown and then swapped is worse than a moment of nothing, so the control is
   * only drawn once the viewer's own standing is known.
   */
  it('EntryPoint_StandingNotKnownYet_ShowsNoWordingItMightHaveToTakeBack', () => {
    ensureAuthenticated.mockReturnValue(true);
    getFundraiserJoinContext.mockReturnValue(new Promise(() => {}));

    renderPanel(true);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText(INVITATION)).not.toBeInTheDocument();
  });
});
