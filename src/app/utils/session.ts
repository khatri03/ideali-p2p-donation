import { clearUserSession } from 'utils/roleRedirect';
import { withReturnPath } from './returnPath';

const SIGN_IN_ROUTE = '/auth/sign-in/custom';

/**
 * Ends the session and sends the person to sign in again, coming back to where they were.
 *
 * `clearUserSession` predates the refresh token and the stored user object, so both are removed here
 * as well: leaving a refresh token behind would let the previous session be resumed after what the
 * person was told was a sign-out.
 */
export function signOutAndReturnTo(returnPath: string): void {
  clearUserSession();
  localStorage.removeItem('RefreshToken');
  localStorage.removeItem('user');

  window.location.href = withReturnPath(SIGN_IN_ROUTE, returnPath);
}

export const signInRouteFor = (returnPath: string): string =>
  withReturnPath(SIGN_IN_ROUTE, returnPath);

/**
 * The stored display name, or an empty string when there isn't a usable one.
 *
 * `localStorage.setItem` stringifies whatever it is given, so an account that signed in without a
 * name leaves the literal text "undefined" behind rather than an absent key. Reading it back raw
 * puts that word in front of the person as if it were their name.
 */
export function storedDisplayName(): string {
  const stored = localStorage.getItem('userName')?.trim() ?? '';

  return stored === 'undefined' || stored === 'null' ? '' : stored;
}
