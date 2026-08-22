import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const decode = vi.fn();
const getUserPermissions = vi.fn();
const storePermissions = vi.fn();
const redirectAfterLogin = vi.fn();

vi.mock('jwt-decode', () => ({ jwtDecode: (token: string) => decode(token) }));

vi.mock('utils/roleRedirect', () => ({
  redirectAfterLogin: (...args: unknown[]) => redirectAfterLogin(...args),
}));

vi.mock('app/service/organizer/rolesPermissions/permissionsService', () => ({
  default: { getUserPermissions: () => getUserPermissions() },
  storePermissions: (permissions: unknown) => storePermissions(permissions),
}));

import { LoginResponse, completeLogin, completeTwoFactorLogin } from './completeLogin';

/**
 * Which dashboard an account lands on, and what is kept about the session. Both used to live inside
 * the sign-in screen, where neither could be tested without rendering it.
 */
describe('completeLogin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    decode.mockReturnValue({});
    getUserPermissions.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const response = (data: Record<string, unknown>): LoginResponse =>
    ({ success: true, data: { accessToken: 'token', ...data } } as LoginResponse);

  const settle = async () => {
    await vi.waitFor(() => expect(storePermissions).toHaveBeenCalled());
    await vi.advanceTimersByTimeAsync(2000);
  };

  it('Login_AccountOwnerCarryingTheAdminRole_LandsOnTheAdminDashboard', async () => {
    decode.mockReturnValue({ userId: '7', organizerId: '7', role: 'Admin' });

    completeLogin(response({}));
    await settle();

    expect(localStorage.getItem('currentRole')).toBe('Admin');
  });

  /**
   * A sub-user can hold a custom role their organiser named "Admin". They are not the account owner,
   * so they belong on the organizer dashboard and not on the admin one.
   */
  it('Login_SubUserWhoseCustomRoleIsNamedAdmin_DoesNotLandOnTheAdminDashboard', async () => {
    decode.mockReturnValue({ userId: '9', organizerId: '7', role: 'Admin' });

    completeLogin(response({ isUserDefined: true }));
    await settle();

    expect(localStorage.getItem('currentRole')).toBe('Organizer');
  });

  it('Login_ParticipantHoldingTheDonationModule_LandsOnTheDonorDashboard', async () => {
    decode.mockReturnValue({ userId: '9', organizerId: '7', role: 'Participant', userAllowedModules: 'Donation' });

    completeLogin(response({}));
    await settle();

    expect(localStorage.getItem('currentRole')).toBe('Donor');
  });

  it('Login_AccountHoldingTheMembershipModule_LandsOnTheMemberDashboard', async () => {
    decode.mockReturnValue({ userId: '9', organizerId: '7', role: 'Participant', userAllowedModules: 'Membership' });

    completeLogin(response({}));
    await settle();

    expect(localStorage.getItem('currentRole')).toBe('Member');
  });

  it('Login_Completed_KeepsTheTokensAndTheAccountItSignedIn', async () => {
    decode.mockReturnValue({ userId: '9', organizerId: '7', role: 'Organizer' });

    completeLogin(response({ refreshToken: 'refresh', userEmail: 'sarah@example.com' }));
    await settle();

    expect(localStorage.getItem('AuthToken')).toBe('token');
    expect(localStorage.getItem('RefreshToken')).toBe('refresh');
    expect(localStorage.getItem('userEmail')).toBe('sarah@example.com');
    expect(localStorage.getItem('loginProvider')).toBe('ideali');
  });

  /**
   * A response with no token is a refusal, whatever else it carried. Storing anything from it would
   * leave a half-session behind that later screens read as signed in.
   */
  it('Login_ResponseWithoutAnAccessToken_StoresNothingAndSendsNobodyAnywhere', () => {
    completeLogin({ success: false, data: {} });

    expect(localStorage.getItem('AuthToken')).toBeNull();
    expect(redirectAfterLogin).not.toHaveBeenCalled();
  });

  it('Login_PermissionsCannotBeLoaded_StillSendsThePersonOnWithNone', async () => {
    decode.mockReturnValue({ userId: '9', organizerId: '7', role: 'Organizer' });
    getUserPermissions.mockRejectedValue(new Error('offline'));

    completeLogin(response({}));
    await settle();

    expect(storePermissions).toHaveBeenCalledWith([]);
    expect(redirectAfterLogin).toHaveBeenCalled();
  });

  it('Login_ReachedFromACampaign_CarriesTheReturnPathIntoTheRedirect', async () => {
    decode.mockReturnValue({ userId: '9', organizerId: '7', role: 'Participant' });

    completeLogin(response({ userId: '9', organizerId: '7' }), 'ideali', '/donation/campaign/x/peer-to-peer/join');
    await settle();

    expect(redirectAfterLogin).toHaveBeenCalledWith(
      'Donor',
      '9',
      '7',
      '/donation/campaign/x/peer-to-peer/join',
    );
  });

  /**
   * The two-factor endpoint nests the account details one level down. Reading the flat shape there
   * would store an empty session that looks signed in.
   */
  it('TwoFactorLogin_Verified_ReadsTheAccountFromTheNestedDetails', async () => {
    decode.mockReturnValue({ userId: '9', organizerId: '7', role: 'Organizer' });

    completeTwoFactorLogin({
      success: true,
      data: {
        accessToken: 'token',
        userDetail: { userId: '9', email: 'sarah@example.com', name: 'Sarah', roles: ['Organizer'] },
        organizerDetail: { organizerId: '7', name: 'Helping Hands' },
      },
    });
    await settle();

    expect(localStorage.getItem('userEmail')).toBe('sarah@example.com');
    expect(localStorage.getItem('userName')).toBe('Sarah');
    expect(localStorage.getItem('userOrg')).toBe('Helping Hands');
  });
});
