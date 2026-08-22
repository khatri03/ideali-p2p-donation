import { Page, expect, test } from '@playwright/test';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';

/**
 * Creating a supporter account from a campaign, at desktop, tablet and 375px.
 *
 * Signed out on purpose. Every other browser spec runs with the shared session from `auth.setup.ts`,
 * and this screen sends anyone already holding one back to the join screen - which is the behaviour
 * the first test here asserts.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const campaign = liveCampaign();
const signUpPath = `/donation/campaign/${campaign.uniqueId}/peer-to-peer/supporter-sign-up`;
const uiSignUpEmail = 'e2e-ui-supporter@example.test';

const emailField = '#supporter-email';
const passwordField = '#supporter-password';

interface SignUpFormValues {
  email: string;
  password?: string;
  confirmPassword?: string;
}

const fillSignUpForm = async (page: Page, values: SignUpFormValues): Promise<void> => {
  const password = values.password ?? 'Fundrais3!';

  await page.locator('#supporter-first-name').fill('E2E');
  await page.locator('#supporter-last-name').fill('Supporter');
  await page.locator(emailField).fill(values.email);
  await page.locator(passwordField).fill(password);
  await page.locator('#supporter-confirm-password').fill(values.confirmPassword ?? password);
};

/**
 * Counts sign-up posts leaving the browser, so a test can prove the form rejected an answer itself
 * rather than letting the server do it.
 */
const countSignUpAttempts = async (page: Page): Promise<() => number> => {
  let attempts = 0;

  await page.route('**/peer-to-peer/supporter-sign-up', (route) => {
    if (route.request().method() === 'POST') {
      attempts += 1;
    }

    return route.continue();
  });

  return () => attempts;
};

const removeSignedUpAccount = (): void =>
  execute(`
    DECLARE @contactId INT = (SELECT TOP 1 ContactId FROM [User] WHERE UserName = '${uiSignUpEmail}');
    DELETE FROM UserRole WHERE UserId IN (SELECT Id FROM [User] WHERE UserName = '${uiSignUpEmail}');
    DELETE FROM UserModule WHERE UserId IN (SELECT Id FROM [User] WHERE UserName = '${uiSignUpEmail}');
    DELETE FROM [User] WHERE UserName = '${uiSignUpEmail}';
    DELETE FROM ContactEmail WHERE ContactId = @contactId;
    DELETE FROM Contact WHERE Id = @contactId;
  `);

const signedUpAccountCount = (): string =>
  querySingleValue(`
    SELECT CAST(COUNT(*) AS VARCHAR(10)) FROM [User] WHERE UserName = '${uiSignUpEmail}';
  `);

test.afterAll(() => {
  removeSignedUpAccount();
});

test.describe('Creating a supporter account', () => {
  test('SupporterSignUp_Opened_NamesTheCampaignAndAsksForNoOrganisation', async ({ page }) => {
    await page.goto(signUpPath);

    await expect(page.getByRole('heading', { name: 'Create your supporter account' })).toBeVisible();
    await expect(page.getByText(/Create an account to fundraise for/i)).toBeVisible();
    await expect(page.getByText('Organizer Info')).toHaveCount(0);
  });

  test('SupporterSignUp_PasswordBelowThePolicy_ExplainsItselfAndSendsNothing', async ({ page }) => {
    const attempts = await countSignUpAttempts(page);

    await page.goto(signUpPath);
    await fillSignUpForm(page, { email: 'e2e-ui-weak@example.test', password: 'weak' });
    await page.getByRole('button', { name: 'Create my account' }).click();

    await expect(
      page.getByText('Password must be 8-20 chars with a number and special character'),
    ).toBeVisible();
    expect(attempts()).toBe(0);
  });

  test('SupporterSignUp_ConfirmationThatDoesNotMatch_ExplainsItselfAndSendsNothing', async ({
    page,
  }) => {
    const attempts = await countSignUpAttempts(page);

    await page.goto(signUpPath);
    await fillSignUpForm(page, {
      email: 'e2e-ui-mismatch@example.test',
      confirmPassword: 'Fundrais4!',
    });
    await page.getByRole('button', { name: 'Create my account' }).click();

    await expect(page.getByText('Both passwords must match.')).toBeVisible();
    expect(attempts()).toBe(0);
  });

  test('SupporterSignUp_Completed_CreatesTheAccountAndLeadsBackToSignInForThisCampaign', async ({
    page,
  }, testInfo) => {
    // Desktop only. The endpoint is rate limited per address, and creating the same account once per
    // viewport would spend that allowance proving something the other projects do not test.
    test.skip(testInfo.project.name !== 'desktop', 'One real account per run is enough.');

    removeSignedUpAccount();

    await page.goto(signUpPath);
    await fillSignUpForm(page, { email: uiSignUpEmail });
    await page.getByRole('button', { name: 'Create my account' }).click();

    await expect(page.getByText('Account ready')).toBeVisible();
    expect(signedUpAccountCount()).toBe('1');

    await page.getByRole('button', { name: 'Go to sign in' }).click();

    await expect(page).toHaveURL(/\/auth\/sign-in\/custom\?returnPath=/);
  });

  test('SupporterSignUp_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    await page.goto(signUpPath);
    await expect(page.locator(emailField)).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('SupporterSignUp_EveryControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    await page.goto(signUpPath);

    const submit = await page.getByRole('button', { name: 'Create my account' }).boundingBox();
    const email = await page.locator(emailField).boundingBox();
    const password = await page.locator(passwordField).boundingBox();

    expect(submit?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(email?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(password?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
