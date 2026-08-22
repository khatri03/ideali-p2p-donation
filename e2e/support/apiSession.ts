import { APIRequestContext, request } from '@playwright/test';
import { e2eEnv } from './e2eEnv';

/**
 * Talks to the API the way the browser does - multipart authenticate, bearer token afterwards - so a
 * change to the authentication contract fails here rather than being papered over by a hand-made token.
 */
export const signIn = async (): Promise<string> => {
  const anonymous = await request.newContext({
    baseURL: e2eEnv.apiBaseUrl,
    ignoreHTTPSErrors: true,
  });

  const response = await anonymous.post('/api/identity/account/authenticate', {
    multipart: {
      userName: e2eEnv.organizerUsername,
      password: e2eEnv.organizerPassword,
    },
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
