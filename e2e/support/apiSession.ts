import { APIRequestContext, request } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { API_TOKEN_PATH, SUPPORTER_API_TOKEN_PATH, e2eEnv } from './e2eEnv';

/** Where the setup project left each identity's token, so a spec spends no sign-in attempt of its own. */
const cachedTokenPath = (userName: string): string | null => {
  if (userName === e2eEnv.organizerUsername) return API_TOKEN_PATH;
  if (userName === e2eEnv.supporterUsername) return SUPPORTER_API_TOKEN_PATH;

  return null;
};

/**
 * Talks to the API the way the browser does - multipart authenticate, bearer token afterwards - so a
 * change to the authentication contract fails here rather than being papered over by a hand-made token.
 */
export const signIn = async (
  userName: string = e2eEnv.organizerUsername,
  password: string = e2eEnv.organizerPassword,
): Promise<string> => {
  // Both accounts signed in once in the setup project. Spending another of the five attempts a
  // minute the endpoint allows would make the suite fail on that limit rather than on the rule
  // each spec was written to prove.
  const tokenPath = cachedTokenPath(userName);

  if (tokenPath && existsSync(tokenPath)) {
    const cached = readFileSync(tokenPath, 'utf8').trim();

    if (cached !== '') {
      return cached;
    }
  }

  const anonymous = await request.newContext({
    baseURL: e2eEnv.apiBaseUrl,
    ignoreHTTPSErrors: true,
  });

  const response = await anonymous.post('/api/identity/account/authenticate', {
    multipart: { userName, password },
  });

  if (!response.ok()) {
    throw new Error(`Authenticate returned ${response.status()}.`);
  }

  const body = await response.json();
  const accessToken: string | undefined = body?.data?.accessToken;

  await anonymous.dispose();

  if (!accessToken) {
    throw new Error('Authenticate succeeded but returned no access token.');
  }

  return accessToken;
};

/**
 * The account that supports campaigns rather than running them. Every endpoint that writes a
 * fundraising page has to be called as this identity: the charity that owns a campaign is refused a
 * page on it, so proving the happy path with the organiser's token proves nothing at all.
 */
export const signInAsSupporter = (): Promise<string> =>
  signIn(e2eEnv.supporterUsername, e2eEnv.supporterPassword);

export const authenticatedApi = async (accessToken: string): Promise<APIRequestContext> =>
  request.newContext({
    baseURL: e2eEnv.apiBaseUrl,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` },
  });

export const anonymousApi = async (): Promise<APIRequestContext> =>
  request.newContext({
    baseURL: e2eEnv.apiBaseUrl,
    ignoreHTTPSErrors: true,
  });

export const settingsUrl = (campaignUniqueId: string): string =>
  `/api/donation/campaign/${campaignUniqueId}/peer-to-peer/settings`;

export const joinUrl = (campaignUniqueId: string): string =>
  `/api/donation/campaign/${campaignUniqueId}/peer-to-peer/join`;

export const supporterSignUpUrl = (campaignUniqueId: string): string =>
  `/api/donation/campaign/${campaignUniqueId}/peer-to-peer/supporter-sign-up`;

export const verifyEmailUrl = (campaignUniqueId: string): string =>
  `/api/donation/campaign/${campaignUniqueId}/peer-to-peer/verify-email`;

export const resendVerificationUrl = (campaignUniqueId: string): string =>
  `/api/donation/campaign/${campaignUniqueId}/peer-to-peer/resend-verification`;

export const fundraiserPageUrl = (campaignSlug: string, fundraiserSlug: string): string =>
  `/api/campaigns/${encodeURIComponent(campaignSlug)}/${encodeURIComponent(fundraiserSlug)}`;

export const leaderboardUrl = (campaignSlug: string): string =>
  `/api/campaigns/${encodeURIComponent(campaignSlug)}/leaderboard`;

export const teamsUrl = (campaignSlug: string): string =>
  `/api/campaigns/${encodeURIComponent(campaignSlug)}/teams`;

export const teamUrl = (campaignSlug: string, teamSlug: string): string =>
  `${teamsUrl(campaignSlug)}/${encodeURIComponent(teamSlug)}`;

export const teamMembersUrl = (campaignSlug: string, teamSlug: string): string =>
  `${teamUrl(campaignSlug, teamSlug)}/members`;

export const teamCaptainUrl = (
  campaignSlug: string,
  teamSlug: string,
  memberUniqueId: string,
): string => `${teamUrl(campaignSlug, teamSlug)}/captain/${encodeURIComponent(memberUniqueId)}`;

const moderationUrl = (campaignUniqueId: string): string =>
  `/api/donation/campaign/${campaignUniqueId}/peer-to-peer`;

export const moderatedFundraisersUrl = (campaignUniqueId: string): string =>
  `${moderationUrl(campaignUniqueId)}/fundraisers`;

export const moderatedFundraiserUrl = (
  campaignUniqueId: string,
  fundraiserUniqueId: string,
): string =>
  `${moderatedFundraisersUrl(campaignUniqueId)}/${encodeURIComponent(fundraiserUniqueId)}`;

export const moderateFundraiserUrl = (
  campaignUniqueId: string,
  fundraiserUniqueId: string,
): string => `${moderatedFundraiserUrl(campaignUniqueId, fundraiserUniqueId)}/moderate`;

export const moderatedTeamsUrl = (campaignUniqueId: string): string =>
  `${moderationUrl(campaignUniqueId)}/teams`;

export const moderatedTeamUrl = (campaignUniqueId: string, teamUniqueId: string): string =>
  `${moderatedTeamsUrl(campaignUniqueId)}/${encodeURIComponent(teamUniqueId)}`;

export const moderateTeamUrl = (campaignUniqueId: string, teamUniqueId: string): string =>
  `${moderatedTeamUrl(campaignUniqueId, teamUniqueId)}/moderate`;

export const invitationsUrl = (campaignUniqueId: string): string =>
  `${moderationUrl(campaignUniqueId)}/invitations`;

export const invitationSupportersUrl = (campaignUniqueId: string): string =>
  `${invitationsUrl(campaignUniqueId)}/supporters`;

export const invitationPreviewUrl = (campaignUniqueId: string): string =>
  `${invitationsUrl(campaignUniqueId)}/preview`;

export const invitationUrl = (campaignUniqueId: string): string =>
  `${moderationUrl(campaignUniqueId)}/invitation`;

export const invitationAcceptUrl = (campaignUniqueId: string): string =>
  `${invitationUrl(campaignUniqueId)}/accept`;

export const invitationUnsubscribeUrl = (campaignUniqueId: string): string =>
  `${invitationUrl(campaignUniqueId)}/unsubscribe`;

export const emailTemplatesUrl = (campaignUniqueId: string): string =>
  `${moderationUrl(campaignUniqueId)}/email-templates`;

export const emailTemplateTestUrl = (campaignUniqueId: string): string =>
  `${emailTemplatesUrl(campaignUniqueId)}/test`;
