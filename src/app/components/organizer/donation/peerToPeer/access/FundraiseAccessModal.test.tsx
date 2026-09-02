import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.fn();
const completeLogin = vi.fn();
const completeTwoFactorLogin = vi.fn();
const signUpAsSupporter = vi.fn();
const resendConfirmationEmail = vi.fn();
const getCampaignDonateDetails = vi.fn();

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

const { default: FundraiseAccessModal } = await import('./FundraiseAccessModal');

const CAMPAIGN_ID = '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881';
const JOIN_PATH = `/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/join`;

const renderModal = () =>
  render(
    <ChakraProvider>
      <MemoryRouter>
        <FundraiseAccessModal campaignUniqueId={CAMPAIGN_ID} isOpen onClose={() => undefined} />
      </MemoryRouter>
    </ChakraProvider>,
  );

const signIn = async (emailAddress = 'sarah@example.com', password = 'Fundrais3!') => {
  await userEvent.type(screen.getByLabelText(/Email address/i), emailAddress);
  await userEvent.type(screen.getByLabelText(/^Password/i), password);
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
};

const openCreateAccount = async () => {
  await userEvent.click(screen.getByRole('tab', { name: 'Create account' }));
};

const fillSignUp = async () => {
  await userEvent.type(screen.getByLabelText(/First name/i), 'Sarah');
  await userEvent.type(screen.getByLabelText(/Last name/i), 'Khan');
  await userEvent.type(screen.getByLabelText(/Email address/i), 'sarah@example.com');
  await userEvent.type(screen.getByLabelText(/^Password/i), 'Fundrais3!');
  await userEvent.type(screen.getByLabelText(/Confirm password/i), 'Fundrais3!');
};

describe('FundraiseAccessModal', () => {
  beforeEach(() => {
    post.mockReset();
    completeLogin.mockReset();
    completeTwoFactorLogin.mockReset();
    signUpAsSupporter.mockReset();
    resendConfirmationEmail.mockReset();
    getCampaignDonateDetails.mockReset();
    getCampaignDonateDetails.mockResolvedValue({ name: 'Winter appeal' });
  });

  it('Access_Opened_OffersSigningInAndCreatingAnAccountSideBySide', async () => {
    renderModal();

    expect(await screen.findByRole('tab', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Create account' })).toBeInTheDocument();
  });

  it('Access_Opened_NamesTheCampaignBeingFundraisedFor', async () => {
    renderModal();

    expect(await screen.findByText(/Winter appeal/)).toBeInTheDocument();
  });

  it('SignIn_Accepted_EstablishesTheSessionAndReturnsToTheFundraisingPage', async () => {
    post.mockResolvedValue({ data: { success: true, data: { accessToken: 'token' } } });

    renderModal();
    await signIn();

    await waitFor(() => expect(completeLogin).toHaveBeenCalled());
    expect(completeLogin).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
      'ideali',
      JOIN_PATH,
    );
  });

  /**
   * Two-factor verification belongs to the shared login code. A second sign-in surface that skipped
   * it would be a way around a check the account owner asked for.
   */
  it('SignIn_AccountWithTwoFactor_AsksForTheCodeInsteadOfSigningStraightIn', async () => {
    post.mockResolvedValue({
      data: { success: true, data: { requiresTwoFactor: true, twoFaToken: 'two-factor-token' } },
    });

    renderModal();
    await signIn();

    expect(await screen.findByText('Two-Factor Authentication')).toBeInTheDocument();
    expect(completeLogin).not.toHaveBeenCalled();
  });

  /**
   * One sentence for a wrong password and for an address nobody holds. Saying which would turn this
   * form into a way to discover who has an account.
   */
  it('SignIn_Refused_SaysNothingAboutWhichHalfWasWrong', async () => {
    post.mockRejectedValue(new Error('401'));

    renderModal();
    await signIn();

    expect(
      await screen.findByText('That email address and password do not match an account.'),
    ).toBeInTheDocument();
    expect(completeLogin).not.toHaveBeenCalled();
  });

  it('SignIn_BlankPassword_ExplainsItselfAndSendsNothing', async () => {
    renderModal();

    await userEvent.type(screen.getByLabelText(/Email address/i), 'sarah@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter your password.')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('SignIn_MalformedEmail_ExplainsItselfAndSendsNothing', async () => {
    renderModal();

    await signIn('not-an-address');

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  /**
   * A created account is not a signed-in one. Its address is unproven until the emailed link is
   * followed, which is the whole point of sending it.
   */
  it('SignUp_Completed_AsksThemToConfirmTheirAddressAndSignsNobodyIn', async () => {
    signUpAsSupporter.mockResolvedValue('Check your inbox and confirm your email address.');

    renderModal();
    await openCreateAccount();
    await fillSignUp();
    await userEvent.click(screen.getByRole('button', { name: 'Create my account' }));

    expect(await screen.findByText('Check your inbox')).toBeInTheDocument();
    expect(completeLogin).not.toHaveBeenCalled();
  });

  it('SignUp_LinkNeverArrived_SendsAnotherToTheAddressThatSignedUp', async () => {
    signUpAsSupporter.mockResolvedValue('Check your inbox and confirm your email address.');
    resendConfirmationEmail.mockResolvedValue('If that address needs confirming, we have sent a new link to it.');

    renderModal();
    await openCreateAccount();
    await fillSignUp();
    await userEvent.click(screen.getByRole('button', { name: 'Create my account' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Send it again' }));

    await waitFor(() =>
      expect(resendConfirmationEmail).toHaveBeenCalledWith(
        CAMPAIGN_ID,
        'sarah@example.com',
        undefined,
      ),
    );
    expect(
      await screen.findByText('If that address needs confirming, we have sent a new link to it.'),
    ).toBeInTheDocument();
  });

  /**
   * A visitor who guessed the wrong tab can correct it from the form they are looking at. Switching
   * moves the open tab rather than navigating, so the campaign they came for is not lost.
   */
  it('SignIn_VisitorWithNoAccount_IsOfferedTheSignUpFormWithoutLeavingTheModal', async () => {
    renderModal();

    await userEvent.click(await screen.findByRole('button', { name: 'Sign up here' }));

    expect(await screen.findByRole('button', { name: 'Create my account' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('SignUp_VisitorWhoAlreadyHasAnAccount_IsOfferedTheSignInFormWithoutLeavingTheModal', async () => {
    renderModal();
    await openCreateAccount();

    await userEvent.click(await screen.findByRole('button', { name: 'Sign in here' }));

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create my account' })).not.toBeInTheDocument();
  });

  /** The banner sits above both forms, so it has to describe whichever one is open. */
  it('Access_CreateAccountTabOpened_DescribesCreatingAnAccountRatherThanSigningIn', async () => {
    renderModal();
    await openCreateAccount();

    expect(
      await screen.findByText(/Create an account to fundraise for/),
    ).toBeInTheDocument();
  });

  /**
   * The link is offered again once the account exists, because confirming the address is what the
   * person does next and signing in is what they do after that.
   */
  it('SignUp_Completed_StillOffersTheWayBackToSigningIn', async () => {
    signUpAsSupporter.mockResolvedValue('Check your inbox and confirm your email address.');

    renderModal();
    await openCreateAccount();
    await fillSignUp();
    await userEvent.click(screen.getByRole('button', { name: 'Create my account' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Sign in here' }));

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('SignUp_ServerRefusesTheRequest_ReportsItAndKeepsTheFormOnScreen', async () => {
    signUpAsSupporter.mockRejectedValue(new Error('Campaign not found.'));

    renderModal();
    await openCreateAccount();
    await fillSignUp();
    await userEvent.click(screen.getByRole('button', { name: 'Create my account' }));

    expect(await screen.findByText('Campaign not found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create my account' })).toBeInTheDocument();
  });
});
