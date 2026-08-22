import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const confirmEmailAddress = vi.fn();

vi.mock('app/service/organizer/donation/emailVerificationService', () => ({
  confirmEmailAddress: (...args: unknown[]) => confirmEmailAddress(...args),
}));

const { default: VerifyEmailPage } = await import('./VerifyEmailPage');

const CAMPAIGN_ID = '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881';
const VERIFY_PATH = `/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/verify-email`;
const JOIN_PATH = `/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/join`;

const WhereAmI = () => <p>{useLocation().pathname}</p>;

const renderPage = (search = '?token=kA7-token_value') =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[`${VERIFY_PATH}${search}`]}>
        <Routes>
          <Route
            path="/donation/campaign/:campaignUniqueId/peer-to-peer/verify-email"
            element={<VerifyEmailPage />}
          />
          <Route path="*" element={<WhereAmI />} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    confirmEmailAddress.mockReset();
  });

  it('Verify_LinkOpened_SpendsTheTokenAgainstTheCampaignInTheAddress', async () => {
    confirmEmailAddress.mockResolvedValue({ campaignUniqueId: CAMPAIGN_ID, campaignName: 'Winter appeal' });

    renderPage();

    expect(await screen.findByText('Email confirmed')).toBeInTheDocument();
    expect(confirmEmailAddress).toHaveBeenCalledWith(CAMPAIGN_ID, 'kA7-token_value');
  });

  it('Verify_Confirmed_NamesTheCampaignAndLeadsOnToTheFundraisingPage', async () => {
    confirmEmailAddress.mockResolvedValue({ campaignUniqueId: CAMPAIGN_ID, campaignName: 'Winter appeal' });

    renderPage();

    expect(await screen.findByText(/Winter appeal/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sign in and set up my page' }));

    expect(await screen.findByText(JOIN_PATH)).toBeInTheDocument();
  });

  /**
   * A link arrives by email and email is forwardable. Confirming an address is not evidence of who
   * is at the keyboard, so nothing here establishes a session.
   */
  it('Verify_Confirmed_DoesNotSignAnybodyIn', async () => {
    confirmEmailAddress.mockResolvedValue({ campaignUniqueId: CAMPAIGN_ID, campaignName: 'Winter appeal' });

    renderPage();
    await screen.findByText('Email confirmed');

    expect(localStorage.getItem('AuthToken')).toBeNull();
  });

  it('Verify_TokenRefused_SaysSoWithoutOfferingTheNextStep', async () => {
    confirmEmailAddress.mockRejectedValue(new Error('This confirmation link is no longer valid.'));

    renderPage();

    expect(await screen.findByText('This link did not work')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Sign in and set up my page' }),
    ).not.toBeInTheDocument();
  });

  it('Verify_LinkWithoutAToken_ExplainsItselfAndAsksForNothing', async () => {
    renderPage('');

    expect(await screen.findByText('This link did not work')).toBeInTheDocument();
    expect(confirmEmailAddress).not.toHaveBeenCalled();
  });

  it('Verify_WhileTheTokenIsChecked_ShowsProgressRatherThanAnEmptyPage', () => {
    confirmEmailAddress.mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(screen.getByText('One moment while we confirm this link.')).toBeInTheDocument();
    expect(screen.queryByText('Email confirmed')).not.toBeInTheDocument();
  });
});
