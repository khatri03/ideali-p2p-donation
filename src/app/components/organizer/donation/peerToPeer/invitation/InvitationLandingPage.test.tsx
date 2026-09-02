import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InvitationLanding } from 'app/interface/donationInter/fundraiserInvitationDto';

const openInvitation = vi.fn();
const acceptInvitation = vi.fn();
const signUpAsSupporter = vi.fn();
const resendConfirmationEmail = vi.fn();
const getCampaignDonateDetails = vi.fn();
const post = vi.fn();
const completeLogin = vi.fn();
const completeTwoFactorLogin = vi.fn();

vi.mock('app/service/organizer/donation/fundraiserInvitationService', () => ({
  openInvitation: (...args: unknown[]) => openInvitation(...args),
  acceptInvitation: (...args: unknown[]) => acceptInvitation(...args),
}));

vi.mock('app/service/httpClient/HttpClient', () => ({
  default: { post: (...args: unknown[]) => post(...args) },
}));

vi.mock('app/components/auth/completeLogin', () => ({
  completeLogin: (...args: unknown[]) => completeLogin(...args),
  completeTwoFactorLogin: (...args: unknown[]) => completeTwoFactorLogin(...args),
}));

vi.mock('app/service/organizer/donation/supporterSignUpService', () => ({
  signUpAsSupporter: (...args: unknown[]) => signUpAsSupporter(...args),
}));

vi.mock('app/service/organizer/donation/emailVerificationService', () => ({
  resendConfirmationEmail: (...args: unknown[]) => resendConfirmationEmail(...args),
}));

vi.mock('app/service/organizer/donation/donationService', () => ({
  default: { getCampaignDonateDetails: (...args: unknown[]) => getCampaignDonateDetails(...args) },
}));

const { default: InvitationLandingScreen } = await import('./InvitationLandingPage');

const CAMPAIGN_UNIQUE_ID = '11111111-2222-3333-4444-555555555555';
const TOKEN = 'live-token';

const landing: InvitationLanding = {
  campaignUniqueId: CAMPAIGN_UNIQUE_ID,
  campaignName: 'Winter appeal',
  organizerName: 'Hope Foundation',
  invitedByName: 'Hope Foundation',
  personalMessage: null,
  emailAddress: 'sara@example.test',
};

const renderPage = (token: string | null = TOKEN) =>
  render(
    <ChakraProvider>
      <MemoryRouter
        initialEntries={[
          `/donation/campaign/${CAMPAIGN_UNIQUE_ID}/peer-to-peer/invitation${
            token === null ? '' : `?token=${token}`
          }`,
        ]}
      >
        <Routes>
          <Route
            path="/donation/campaign/:campaignUniqueId/peer-to-peer/invitation"
            element={<InvitationLandingScreen />}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  openInvitation.mockReset();
  acceptInvitation.mockReset();
  signUpAsSupporter.mockReset();
  resendConfirmationEmail.mockReset();
  getCampaignDonateDetails.mockReset();
  getCampaignDonateDetails.mockResolvedValue({ name: 'Winter appeal' });
  post.mockReset();
  completeLogin.mockReset();
  completeTwoFactorLogin.mockReset();
  localStorage.clear();
});

afterEach(() => localStorage.clear());

describe('InvitationLandingPage', () => {
  it('Landing_ValidLink_NamesTheCharityAndTheCampaign', async () => {
    openInvitation.mockResolvedValue(landing);

    renderPage();

    expect(await screen.findByText('Hope Foundation')).toBeInTheDocument();
    expect(screen.getByText('Winter appeal')).toBeInTheDocument();
  });

  it('Landing_PersonalMessage_IsShownAsTheWordsThatWereTypedAndNotAsMarkup', async () => {
    openInvitation.mockResolvedValue({
      ...landing,
      personalMessage: '<script>alert(1)</script>',
    });

    renderPage();

    expect(await screen.findByText('<script>alert(1)</script>')).toBeInTheDocument();
  });

  it('Landing_LinkWithNoToken_SaysSoRatherThanCallingTheServer', async () => {
    renderPage(null);

    expect(
      await screen.findByText(
        'This link is incomplete. Open the invitation from the email you were sent.',
      ),
    ).toBeInTheDocument();
    expect(openInvitation).not.toHaveBeenCalled();
  });

  it('Landing_RefusedLink_ShowsTheServersSentenceAndOffersNoForm', async () => {
    openInvitation.mockImplementation(() =>
      Promise.reject(new Error('This invitation is no longer valid.')),
    );

    renderPage();

    expect(await screen.findByText('This invitation is no longer valid.')).toBeInTheDocument();
    expect(screen.queryByLabelText('The name on your page')).not.toBeInTheDocument();
  });

  /**
   * Somebody the charity invited by email has no account here by definition. Offering only sign-in
   * leaves them to work out for themselves that they must create one first, on a different screen.
   */
  it('Landing_NotSignedIn_OffersCreatingAnAccountAsWellAsSigningIn', async () => {
    openInvitation.mockResolvedValue(landing);

    renderPage();

    expect(await screen.findByRole('tab', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Set up my page' })).not.toBeInTheDocument();
  });

  /**
   * The account has to be created under the invited address: accepting afterwards matches the
   * signed-in address against the invited one, so any other address builds an account that can never
   * accept this invitation.
   */
  it('Landing_CreatingAnAccount_FixesTheAddressToTheInvitedOne', async () => {
    openInvitation.mockResolvedValue(landing);

    renderPage();

    await userEvent.click(await screen.findByRole('tab', { name: 'Create account' }));

    const emailField = await screen.findByLabelText(/Email address/i);

    expect(emailField).toHaveValue(landing.emailAddress);
    expect(emailField).toHaveAttribute('readonly');
  });

  /**
   * The invitation travels with the sign-up so the confirmation email leads back here. Without it the
   * person lands on the open join screen, builds a page there, and the invitation stays recorded as
   * opened and never accepted.
   */
  it('Landing_AccountCreated_SendsTheInvitationCodeWithIt', async () => {
    openInvitation.mockResolvedValue(landing);
    signUpAsSupporter.mockResolvedValue('Check your inbox.');

    renderPage();

    await userEvent.click(await screen.findByRole('tab', { name: 'Create account' }));
    await userEvent.type(await screen.findByLabelText(/First name/i), 'Sara');
    await userEvent.type(screen.getByLabelText(/Last name/i), 'Ahmed');
    await userEvent.type(screen.getByLabelText(/^Password/i), 'Fundrais3!');
    await userEvent.type(screen.getByLabelText(/Confirm password/i), 'Fundrais3!');
    await userEvent.click(screen.getByRole('button', { name: 'Create my account' }));

    await waitFor(() =>
      expect(signUpAsSupporter).toHaveBeenCalledWith(
        CAMPAIGN_UNIQUE_ID,
        expect.objectContaining({
          emailAddress: landing.emailAddress,
          invitationToken: TOKEN,
        }),
      ),
    );
  });

  /**
   * Someone signed in under another address cannot accept, and the server will refuse them. Saying so
   * before they fill the form in is the difference between a correction and a wasted attempt.
   */
  it('Landing_SignedInAsSomebodyElse_SaysSoInsteadOfShowingTheForm', async () => {
    localStorage.setItem('AuthToken', 'signed-in');
    localStorage.setItem('userEmail', 'someone.else@example.test');
    openInvitation.mockResolvedValue(landing);

    renderPage();

    expect(await screen.findByText(/Signed in as somebody else/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Set up my page' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sign in with that address' }),
    ).toBeInTheDocument();
  });

  /**
   * A session whose address the browser never stored is not evidence of a mismatch. The server still
   * refuses a wrong account; guessing here would block the right person from their own invitation.
   */
  it('Landing_SignedInWithNoStoredAddress_StillShowsTheForm', async () => {
    localStorage.setItem('AuthToken', 'signed-in');
    openInvitation.mockResolvedValue(landing);

    renderPage();

    expect(await screen.findByRole('button', { name: 'Set up my page' })).toBeInTheDocument();
  });

  it('Accept_NoDisplayName_IsRefusedBeforeARequestIsSpent', async () => {
    localStorage.setItem('AuthToken', 'signed-in');
    openInvitation.mockResolvedValue(landing);

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Set up my page' }));

    expect(
      await screen.findByText('Enter the name that should appear on your page.'),
    ).toBeInTheDocument();
    expect(acceptInvitation).not.toHaveBeenCalled();
  });

  it('Accept_FilledIn_SendsTheTokenWithTheChosenDetails', async () => {
    localStorage.setItem('AuthToken', 'signed-in');
    openInvitation.mockResolvedValue(landing);
    acceptInvitation.mockResolvedValue({
      fundraiserUniqueId: 'f1',
      slug: 'sara-malik',
      campaignSlug: 'winter-appeal',
      isAwaitingApproval: false,
    });

    renderPage();

    await userEvent.type(await screen.findByLabelText(/The name on your page/), 'Sara Malik');
    await userEvent.click(screen.getByRole('button', { name: 'Set up my page' }));

    await waitFor(() =>
      expect(acceptInvitation).toHaveBeenCalledWith(CAMPAIGN_UNIQUE_ID, {
        token: TOKEN,
        displayName: 'Sara Malik',
        story: undefined,
        personalGoal: undefined,
      }),
    );
  });

  it('Accept_Succeeded_OffersTheNewPageRatherThanLeavingThePersonOnTheForm', async () => {
    localStorage.setItem('AuthToken', 'signed-in');
    openInvitation.mockResolvedValue(landing);
    acceptInvitation.mockResolvedValue({
      fundraiserUniqueId: 'f1',
      slug: 'sara-malik',
      campaignSlug: 'winter-appeal',
      isAwaitingApproval: false,
    });

    renderPage();

    await userEvent.type(await screen.findByLabelText(/The name on your page/), 'Sara Malik');
    await userEvent.click(screen.getByRole('button', { name: 'Set up my page' }));

    const link = await screen.findByRole('link', { name: 'Open my page' });

    expect(link).toHaveAttribute('href', '/campaigns/winter-appeal/sara-malik');
  });

  it('Accept_CampaignReviewsPagesFirst_SaysSoRatherThanClaimingItIsLive', async () => {
    localStorage.setItem('AuthToken', 'signed-in');
    openInvitation.mockResolvedValue(landing);
    acceptInvitation.mockResolvedValue({
      fundraiserUniqueId: 'f1',
      slug: 'sara-malik',
      campaignSlug: 'winter-appeal',
      isAwaitingApproval: true,
    });

    renderPage();

    await userEvent.type(await screen.findByLabelText(/The name on your page/), 'Sara Malik');
    await userEvent.click(screen.getByRole('button', { name: 'Set up my page' }));

    expect(
      await screen.findByText('Your page has gone to the charity'),
    ).toBeInTheDocument();
  });

  it('Accept_RefusedBecauseTheAccountIsWrong_ShowsTheServersSentence', async () => {
    localStorage.setItem('AuthToken', 'signed-in');
    openInvitation.mockResolvedValue(landing);
    acceptInvitation.mockImplementation(() =>
      Promise.reject(new Error('This invitation was sent to a different email address.')),
    );

    renderPage();

    await userEvent.type(await screen.findByLabelText(/The name on your page/), 'Sara Malik');
    await userEvent.click(screen.getByRole('button', { name: 'Set up my page' }));

    expect(
      await screen.findByText('This invitation was sent to a different email address.'),
    ).toBeInTheDocument();
  });
});
