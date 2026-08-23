import { jwtDecode } from 'jwt-decode';

/**
 * Whether the signed-in person is fundraising for anybody. Read from the same token the allowed-modules
 * reader beside this file decodes, because the claim is issued on every token path - sign-in, two
 * factor, external login and refresh - and storing a second copy of it would be a second thing to get
 * out of step.
 *
 * The claim is emitted only when true, so an absent claim means "not a fundraiser" rather than unknown.
 *
 * This hides or shows a menu item and nothing more. Every console endpoint decides ownership on the
 * server; a forged claim buys a screen that then refuses to load.
 */
export const isFundraiser = (): boolean => {
  try {
    const token = localStorage.getItem('AuthToken');

    if (!token) {
      return false;
    }

    const claims = jwtDecode(token) as Record<string, unknown>;

    return String(claims.isFundraiser ?? '').toLowerCase() === 'true';
  } catch {
    return false;
  }
};
