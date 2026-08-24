import { APIRequestContext, request } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { API_TOKEN_PATH, e2eEnv } from './e2eEnv';

/**
 * Talks to the API the way the browser does - multipart authenticate, bearer token afterwards - so a
 * change to the authentication contract fails here rather than being papered over by a hand-made token.
 */
export const signIn = async (
  userName: string = e2eEnv.organizerUsername,
  password: string = e2eEnv.organizerPassword,
): Promise<string> => {
  // The organiser signed in once in the setup project. Spending another of the five attempts a
  // minute the endpoint allows would make the suite fail on that limit rather than on the rule
  // each spec was written to prove.
  if (userName === e2eEnv.organizerUsername && existsSync(API_TOKEN_PATH)) {
    const cached = readFileSync(API_TOKEN_PATH, 'utf8').trim();

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
