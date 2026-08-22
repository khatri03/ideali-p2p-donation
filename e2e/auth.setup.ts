import { expect, test as setup } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { API_TOKEN_PATH, STORAGE_STATE_PATH, e2eEnv } from './support/e2eEnv';

/**
 * Signing in through the form rather than by seeding tokens keeps the suite honest: if the sign-in
 * screen breaks, every dependent project fails here instead of quietly running against a hand-built
 * session that the application itself could never have produced.
 */
setup('Organizer signs in and the session is persisted for the suite', async ({ page }) => {
  mkdirSync(dirname(STORAGE_STATE_PATH), { recursive: true });

  await page.goto('/auth/sign-in/custom');

  await page.getByPlaceholder('mail@example.com').fill(e2eEnv.organizerUsername);
  await page.getByPlaceholder('Min. 8 characters').fill(e2eEnv.organizerPassword);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();

  await expect(page).not.toHaveURL(/\/auth\//, { timeout: 30_000 });

  const accessToken = await page.evaluate(() => window.localStorage.getItem('AuthToken'));
  expect(accessToken, 'sign-in did not produce an access token').toBeTruthy();

  // Kept for the api specs so the run spends one sign-in attempt rather than one per spec file.
  writeFileSync(API_TOKEN_PATH, accessToken as string, { encoding: 'utf8' });

  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
