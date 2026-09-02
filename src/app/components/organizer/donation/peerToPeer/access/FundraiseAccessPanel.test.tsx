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

const { default: FundraiseAccessPanel } = await import('./FundraiseAccessPanel');

const CAMPAIGN_ID = '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881';
const JOIN_PATH = `/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/join`;
const INVITATION_PATH = `/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/invitation?token=live-code`;
const INVITED_ADDRESS = 'sara@example.test';

const renderPanel = (props: Record<string, unknown> = {}) =>
  render(
    <ChakraProvider>
      <MemoryRouter>
        <FundraiseAccessPanel campaignUniqueId={CAMPAIGN_ID} {...props} />
      </MemoryRouter>
    </ChakraProvider>,
  );

const signIn = async () => {
  await userEvent.type(screen.getByLabelText(/Email address/i), INVITED_ADDRESS);
  await userEvent.type(screen.getByLabelText(/^Password/i), 'Fundrais3!');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
};

describe('FundraiseAccessPanel', () => {
  beforeEach(() => {
    post.mockReset();
    completeLogin.mockReset();
    completeTwoFactorLogin.mockReset();
    signUpAsSupporter.mockReset();
    resendConfirmationEmail.mockReset();
    getCampaignDonateDetails.mockReset();
    getCampaignDonateDetails.mockResolvedValue({ name: 'Winter appeal' });
  });

  /**
   * A screen that did not say where it wants people afterwards means the campaign's own fundraise
   * link, which is the only route this panel served before invitations existed.
   */
  it('SignIn_NoReturnPathGiven_LandsOnTheCampaignsJoinScreen', async () => {
    post.mockResolvedValue({ data: { success: true, data: {} } });

    renderPanel();
    await signIn();

    await waitFor(() =>
      expect(completeLogin).toHaveBeenCalledWith(expect.anything(), 'ideali', JOIN_PATH),
    );
  });

  /**
   * An invitation has to be returned to, not merely signed in from. Landing on the join screen builds
   * the page by another route and leaves the invitation recorded as never accepted.
   */
  it('SignIn_ReturnPathGiven_LandsBackOnThatPath', async () => {
    post.mockResolvedValue({ data: { success: true, data: {} } });

    renderPanel({ returnPath: INVITATION_PATH });
    await signIn();

    await waitFor(() =>
      expect(completeLogin).toHaveBeenCalledWith(expect.anything(), 'ideali', INVITATION_PATH),
    );
  });

  /**
   * The address is the one thing about an invited account that is not the person's to choose: any
   * other address produces an account that can never accept the invitation.
   */
  it('SignUp_InvitedAddressGiven_ShowsItAndDoesNotLetItBeTypedOver', async () => {
    renderPanel({ invitedEmailAddress: INVITED_ADDRESS });

    await userEvent.click(screen.getByRole('tab', { name: 'Create account' }));

    const emailField = await screen.findByLabelText(/Email address/i);

    expect(emailField).toHaveValue(INVITED_ADDRESS);
    expect(emailField).toHaveAttribute('readonly');
    expect(
      screen.getByText('Your invitation was sent to this address, so your account has to use it.'),
    ).toBeInTheDocument();
  });

  /**
   * Nobody invited the person who came from a campaign page, so the address field is theirs to fill
   * in and no invitation travels with the sign-up.
   */
  it('SignUp_NoInvitation_LeavesTheAddressToThePerson', async () => {
    renderPanel();

    await userEvent.click(screen.getByRole('tab', { name: 'Create account' }));

    const emailField = await screen.findByLabelText(/Email address/i);

    expect(emailField).toHaveValue('');
    expect(emailField).not.toHaveAttribute('readonly');
  });

  /**
   * A screen that has already named the campaign must not name it again above the tabs. Two copies of
   * the same sentence on one page reads as a mistake.
   */
  it('Panel_SurroundingScreenNamesTheCampaign_DoesNotNameItASecondTime', async () => {
    renderPanel({ hasCampaignBanner: false });

    await waitFor(() => expect(getCampaignDonateDetails).not.toHaveBeenCalled());
    expect(screen.queryByText(/Winter appeal/)).not.toBeInTheDocument();
  });
});
