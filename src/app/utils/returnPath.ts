/**
 * Where a supporter may be sent back to after signing in or signing up.
 *
 * A return path arrives in the address bar, so it is attacker-controlled text. Anything that is not
 * on this list is discarded rather than sanitised: an allow-list cannot be talked around the way a
 * block-list can, and an open redirect out of a sign-in screen is a credential-phishing vector, not
 * a cosmetic bug.
 */
const ALLOWED_RETURN_PATHS: RegExp[] = [
  // The join screen, optionally carrying the team the supporter came from. The slug character set is
  // pinned so the query cannot be used to smuggle a second parameter past the allow-list.
  /^\/donation\/campaign\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/peer-to-peer\/join(\?team=[a-z0-9-]{1,120})?$/i,
  // The invitation link is the one return path that carries a query string, because the token is
  // what identifies the invitation. The token character set is pinned so the query cannot be used to
  // smuggle a second parameter past the allow-list.
  /^\/donation\/campaign\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/peer-to-peer\/invitation\?token=[A-Za-z0-9_%-]{1,256}$/i,
];

/**
 * Returns the path only when it is one this application is willing to navigate to, and null
 * otherwise. Protocol-relative (`//evil.test`) and backslash forms are rejected before the
 * allow-list is consulted, because a browser resolves both to another origin.
 */
export function sanitiseReturnPath(candidate: string | null | undefined): string | null {
  if (!candidate) {
    return null;
  }

  const trimmed = candidate.trim();

  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return null;
  }

  return ALLOWED_RETURN_PATHS.some((allowed) => allowed.test(trimmed)) ? trimmed : null;
}

/**
 * The team address a join link may carry, or null when it carries none. Anything outside the character
 * set a slug is allocated from is discarded rather than trimmed, because this value reaches the screen
 * from the address bar and is sent on to the server as the team to join.
 */
const TEAM_SLUG_PATTERN = /^[a-z0-9-]{1,120}$/i;

export const sanitiseTeamSlug = (candidate: string | null | undefined): string | null =>
  candidate && TEAM_SLUG_PATTERN.test(candidate) ? candidate : null;

/**
 * The join screen for one campaign, optionally carrying the team the supporter was looking at when
 * they decided to fundraise. Carrying it is what stops a shared team link ending in a console screen
 * with the team forgotten.
 */
export const fundraiserJoinPath = (campaignUniqueId: string, teamSlug?: string | null): string => {
  const base = `/donation/campaign/${campaignUniqueId}/peer-to-peer/join`;
  const team = sanitiseTeamSlug(teamSlug);

  return team ? `${base}?team=${team}` : base;
};

/** Where an invitation link lands, with the code that identifies it. */
export const fundraiserInvitationPath = (campaignUniqueId: string, token: string): string =>
  `/donation/campaign/${campaignUniqueId}/peer-to-peer/invitation?token=${encodeURIComponent(token)}`;

/**
 * Adds a return path to an internal destination. The path is encoded, and an unacceptable one is
 * dropped rather than carried, so a rejected value never reaches the sign-in screen at all.
 */
export function withReturnPath(destination: string, returnPath: string): string {
  const allowed = sanitiseReturnPath(returnPath);

  if (!allowed) {
    return destination;
  }

  const separator = destination.includes('?') ? '&' : '?';

  return `${destination}${separator}returnPath=${encodeURIComponent(allowed)}`;
}

/**
 * The campaign a return path refers to, or null when it refers to none. Lets a sign-in screen name
 * the campaign by fetching it, rather than trusting a display name passed through the address bar.
 */
export function campaignFromReturnPath(returnPath: string | null): string | null {
  const allowed = sanitiseReturnPath(returnPath);

  if (!allowed) {
    return null;
  }

  return allowed.split('/')[3] ?? null;
}
