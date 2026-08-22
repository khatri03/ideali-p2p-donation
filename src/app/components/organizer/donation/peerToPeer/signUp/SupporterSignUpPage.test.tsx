import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const signUpAsSupporter = vi.fn();
const ensureAuthenticated = vi.fn();

vi.mock('app/service/organizer/donation/supporterSignUpService', () => ({
  signUpAsSupporter: (...args: unknown[]) => signUpAsSupporter(...args),
}));

vi.mock('utils/auth', () => ({
  ensureAuthenticated: () => ensureAuthenticated(),
}));

vi.mock('app/service/organizer/donation/donationService', () => ({
  default: { getCampaignDonateDetails: () => Promise.resolve(null) },
}));

const { default: SupporterSignUpPage } = await import('./SupporterSignUpPage');

const CAMPAIGN_ID = '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881';
const SIGN_UP_PATH = `/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/supporter-sign-up`;
const JOIN_PATH = `/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/join`;

const renderPage = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[SIGN_UP_PATH]}>
        <Routes>
          <Route
            path="/donation/campaign/:campaignUniqueId/peer-to-peer/supporter-sign-up"
            element={<SupporterSignUpPage />}
          />
          <Route path="/donation/campaign/:campaignUniqueId/peer-to-peer/join" element={<p>Join screen</p>} />
          <Route path="/auth/sign-in/custom" element={<p>Sign in screen</p>} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

const fillForm = async (overrides: Partial<Record<string, string>> = {}) => {
  const values = {
    firstName: 'Sarah',
    lastName: 'Khan',
    emailAddress: 'sarah.khan@example.com',
    password: 'Fundrais3!',
    confirmPassword: 'Fundrais3!',
    ...overrides,
  };

  await userEvent.type(screen.getByLabelText(/First name/i), values.firstName);
  await userEvent.type(screen.getByLabelText(/Last name/i), values.lastName);
  await userEvent.type(screen.getByLabelText(/Email address/i), values.emailAddress);
  await userEvent.type(screen.getByLabelText(/^Password/i), values.password);
  await userEvent.type(screen.getByLabelText(/Confirm password/i), values.confirmPassword);
};

const submit = () => userEvent.click(screen.getByRole('button', { name: /Create my account/i }));

beforeEach(() => {
  signUpAsSupporter.mockReset();
  ensureAuthenticated.mockReset();
  ensureAuthenticated.mockReturnValue(false);
});

describe('SupporterSignUpPage', () => {
  it('SignUp_AlreadySignedIn_GoesStraightToTheJoinScreenWithoutOfferingAForm', async () => {
    ensureAuthenticated.mockReturnValue(true);

    renderPage();

    expect(await screen.findByText('Join screen')).toBeInTheDocument();
    expect(signUpAsSupporter).not.toHaveBeenCalled();
  });

  it('SignUp_Completed_SendsTheAnswersAndOffersTheWayOnToSignIn', async () => {
    signUpAsSupporter.mockResolvedValue('Sign in with this email address and password to continue.');

    renderPage();
    await fillForm();
    await submit();

    await waitFor(() =>
      expect(signUpAsSupporter).toHaveBeenCalledWith(CAMPAIGN_ID, {
        firstName: 'Sarah',
        lastName: 'Khan',
        emailAddress: 'sarah.khan@example.com',
        password: 'Fundrais3!',
      }),
    );

    expect(
      await screen.findByText('Sign in with this email address and password to continue.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to sign in/i })).toBeInTheDocument();
  });

  it('SignUp_Completed_CarriesTheCampaignThroughToSignInSoTheSupporterComesBack', async () => {
    signUpAsSupporter.mockResolvedValue('Account ready.');

    renderPage();
    await fillForm();
    await submit();

    await userEvent.click(await screen.findByRole('button', { name: /Go to sign in/i }));

    expect(await screen.findByText('Sign in screen')).toBeInTheDocument();
  });

  it('SignUp_OfferedToSomeoneWhoAlreadyHasAnAccount_LinksToSignInForThisCampaign', () => {
    renderPage();

    expect(screen.getByRole('link', { name: /Sign in instead/i })).toHaveAttribute(
      'href',
      `/auth/sign-in/custom?returnPath=${encodeURIComponent(JOIN_PATH)}`,
    );
  });

  it('SignUp_PasswordBelowThePolicy_ExplainsItselfAndSendsNothing', async () => {
    renderPage();
    await fillForm({ password: 'weak', confirmPassword: 'weak' });
    await submit();

    expect(
      await screen.findByText('Password must be 8-20 chars with a number and special character'),
    ).toBeInTheDocument();
    expect(signUpAsSupporter).not.toHaveBeenCalled();
  });

  it('SignUp_ConfirmationThatDoesNotMatch_ExplainsItselfAndSendsNothing', async () => {
    renderPage();
    await fillForm({ confirmPassword: 'Different1!' });
    await submit();

    expect(await screen.findByText('Both passwords must match.')).toBeInTheDocument();
    expect(signUpAsSupporter).not.toHaveBeenCalled();
  });

  it('SignUp_MalformedEmail_ExplainsItselfAndSendsNothing', async () => {
    renderPage();
    await fillForm({ emailAddress: 'not-an-address' });
    await submit();

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(signUpAsSupporter).not.toHaveBeenCalled();
  });

  it('SignUp_BlankNames_ExplainThemselvesAndSendNothing', async () => {
    renderPage();
    await fillForm({ firstName: ' ', lastName: ' ' });
    await submit();

    expect(await screen.findByText('Enter your first name.')).toBeInTheDocument();
    expect(screen.getByText('Enter your last name.')).toBeInTheDocument();
    expect(signUpAsSupporter).not.toHaveBeenCalled();
  });

  it('SignUp_ServerRefusesTheRequest_ReportsItAndKeepsTheFormOnScreen', async () => {
    signUpAsSupporter.mockRejectedValue(new Error('This campaign is not accepting supporter pages.'));

    renderPage();
    await fillForm();
    await submit();

    expect(
      await screen.findByText('This campaign is not accepting supporter pages.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
  });
});
