import { Page, expect, test as setup } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  API_TOKEN_PATH,
  STORAGE_STATE_PATH,
  SUPPORTER_API_TOKEN_PATH,
  SUPPORTER_STORAGE_STATE_PATH,
  e2eEnv,
} from './support/e2eEnv';

/**
 * Signs one account in through the real form and keeps both the browser session and the access token
 * for the rest of the run.
 *
 * @param page The setup project's browser page.
 * @param userName The address to sign in with.
 * @param password That account's password.
 * @param storageStatePath Where the browser session is written for the dependent projects.
 * @param tokenPath Where the access token is written for the api specs.
 */
const signInAndKeepTheSession = async (
  page: Page,
  userName: string,
  password: string,
  storageStatePath: string,
  tokenPath: string,
): Promise<void> => {
  mkdirSync(dirname(storageStatePath), { recursive: true });

  await page.goto('/auth/sign-in/custom');

  await page.getByPlaceholder('mail@example.com').fill(userName);
  await page.getByPlaceholder('Min. 8 characters').fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();

  await expect(page).not.toHaveURL(/\/auth\//, { timeout: 30_000 });

  const accessToken = await page.evaluate(() => window.localStorage.getItem('AuthToken'));
  expect(accessToken, 'sign-in did not produce an access token').toBeTruthy();

  // Kept for the api specs so the run spends one sign-in attempt rather than one per spec file.
  writeFileSync(tokenPath, accessToken as string, { encoding: 'utf8' });

  await page.context().storageState({ path: storageStatePath });
};

/**
 * Signing in through the form rather than by seeding tokens keeps the suite honest: if the sign-in
 * screen breaks, every dependent project fails here instead of quietly running against a hand-built
 * session that the application itself could never have produced.
 */
setup('Organizer signs in and the session is persisted for the suite', async ({ page }) => {
  await signInAndKeepTheSession(
    page,
    e2eEnv.organizerUsername,
    e2eEnv.organizerPassword,
    STORAGE_STATE_PATH,
    API_TOKEN_PATH,
  );
});

/**
 * The supporter's own session. Every screen and endpoint that creates a fundraising page is walked as
 * this account, because the charity running the campaign is refused one on its own campaign and would
 * prove the refusal rather than the journey.
 */
setup('Supporter signs in and the session is persisted for the suite', async ({ page }) => {
  await signInAndKeepTheSession(
    page,
    e2eEnv.supporterUsername,
    e2eEnv.supporterPassword,
    SUPPORTER_STORAGE_STATE_PATH,
    SUPPORTER_API_TOKEN_PATH,
  );
});
