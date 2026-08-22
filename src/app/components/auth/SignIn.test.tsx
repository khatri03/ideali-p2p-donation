import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('app/service/organizer/donation/donationService', () => ({
  default: { getCampaignDonateDetails: () => Promise.resolve(null) },
}));

vi.mock('../../service/httpClient/HttpClient', () => ({ default: { post: vi.fn(), get: vi.fn() } }));

vi.mock('../../service/organizer/rolesPermissions/permissionsService', () => ({
  default: { getPermissions: vi.fn() },
  storePermissions: vi.fn(),
}));

vi.mock('../../service/auth/signUpService', () => ({
  default: { externalSignIn: vi.fn(), signUp: vi.fn() },
}));

vi.mock('../../../utils/roleRedirect', () => ({
  redirectAfterLogin: vi.fn(),
  clearUserSession: vi.fn(),
}));

const { default: SignIn } = await import('./SignIn');

const CAMPAIGN_ID = '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881';
const JOIN_PATH = `/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/join`;

const renderSignIn = (search = '') =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[`/auth/sign-in/custom${search}`]}>
        <Routes>
          <Route path="/auth/sign-in/custom" element={<SignIn />} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

describe('SignIn account creation prompt', () => {
  it('SignIn_ReachedToFundraise_OffersTheSupporterFormAndNotTheOrganiserOne', () => {
    renderSignIn(`?returnPath=${encodeURIComponent(JOIN_PATH)}`);

    expect(screen.queryByRole('link', { name: /Create new account/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create a supporter account/i })).toHaveAttribute(
      'href',
      `/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/supporter-sign-up`,
    );
  });

  it('SignIn_ReachedDirectly_StillOffersTheOrganiserSignUpForm', () => {
    renderSignIn();

    expect(screen.getByRole('link', { name: /Create new account/i })).toHaveAttribute(
      'href',
      '/auth/sign-up/default',
    );
  });

  it('SignIn_ReachedWithATamperedReturnPath_OffersTheOrganiserSignUpFormAsUsual', () => {
    renderSignIn('?returnPath=https%3A%2F%2Fevil.test%2Fsteal');

    expect(screen.getByRole('link', { name: /Create new account/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Create a supporter account/i }),
    ).not.toBeInTheDocument();
  });
});
