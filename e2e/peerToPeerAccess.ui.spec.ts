import { Page, expect, test } from '@playwright/test';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';

/**
 * The modal a visitor with no session meets when they ask to fundraise, at desktop, tablet and 375px.
 *
 * Signed out on purpose. Every other browser spec runs with the shared session from `auth.setup.ts`,
 * and this surface only exists for people who do not have one.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const campaign = liveCampaign();
const joinPath = `/donation/campaign/${campaign.uniqueId}/peer-to-peer/join`;
const uiSignUpEmail = 'e2e-ui-supporter@example.test';

const signInEmailField = '#supporter-sign-in-email';
const signInPasswordField = '#supporter-sign-in-password';

interface SignUpFormValues {
  email: string;
  password?: string;
  confirmPassword?: string;
}

const openCreateAccount = async (page: Page): Promise<void> => {
  await page.getByRole('tab', { name: 'Create account' }).click();
};

const fillSignUpForm = async (page: Page, values: SignUpFormValues): Promise<void> => {
  const password = values.password ?? 'Fundrais3!';

  await page.locator('#supporter-first-name').fill('E2E');
  await page.locator('#supporter-last-name').fill('Supporter');
  await page.locator('#supporter-email').fill(values.email);
  await page.locator('#supporter-password').fill(password);
  await page.locator('#supporter-confirm-password').fill(values.confirmPassword ?? password);
};

/**
 * Counts sign-up posts leaving the browser, so a test can prove the form rejected an answer itself
 * rather than letting the server do it.
 */
const countRequestsTo = async (page: Page, urlPattern: string): Promise<() => number> => {
  let attempts = 0;

  await page.route(urlPattern, (route) => {
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
    DELETE FROM EmailVerificationRequest WHERE UserId IN (SELECT Id FROM [User] WHERE UserName = '${uiSignUpEmail}');
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

const outstandingVerificationCount = (): string =>
  querySingleValue(`
    SELECT CAST(COUNT(*) AS VARCHAR(10))
    FROM EmailVerificationRequest request
    INNER JOIN [User] account ON account.Id = request.UserId
    WHERE account.UserName = '${uiSignUpEmail}' AND request.IsUsed = 0;
  `);

test.afterAll(() => {
  removeSignedUpAccount();
});

test.describe('Getting into fundraising without a session', () => {
  test('Access_ReachedWithoutASession_OffersBothWaysInWithoutLeavingTheCampaign', async ({ page }) => {
    await page.goto(joinPath);

    await expect(page.getByRole('tab', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Create account' })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${campaign.uniqueId}/peer-to-peer/join$`));
  });

  test('SignIn_WrongCredentials_SaysNothingAboutWhichHalfWasWrong', async ({ page }) => {
    await page.goto(joinPath);

    await page.locator(signInEmailField).fill('e2e-nobody@example.test');
    await page.locator(signInPasswordField).fill('Fundrais3!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(
      page.getByText('That email address and password do not match an account.'),
    ).toBeVisible();
  });

  test('SignUp_PasswordBelowThePolicy_ExplainsItselfAndSendsNothing', async ({ page }) => {
    const attempts = await countRequestsTo(page, '**/peer-to-peer/supporter-sign-up');

    await page.goto(joinPath);
    await openCreateAccount(page);
    await fillSignUpForm(page, { email: 'e2e-ui-weak@example.test', password: 'weak' });
    await page.getByRole('button', { name: 'Create my account' }).click();

    await expect(
      page.getByText('Password must be 8-20 chars with a number and special character'),
    ).toBeVisible();
    expect(attempts()).toBe(0);
  });

  test('SignUp_ConfirmationThatDoesNotMatch_ExplainsItselfAndSendsNothing', async ({ page }) => {
    const attempts = await countRequestsTo(page, '**/peer-to-peer/supporter-sign-up');

    await page.goto(joinPath);
    await openCreateAccount(page);
    await fillSignUpForm(page, {
      email: 'e2e-ui-mismatch@example.test',
      confirmPassword: 'Fundrais4!',
    });
    await page.getByRole('button', { name: 'Create my account' }).click();

    await expect(page.getByText('Both passwords must match.')).toBeVisible();
    expect(attempts()).toBe(0);
  });

  test('SignUp_Completed_CreatesTheAccountAndSendsAConfirmationLinkInsteadOfSigningIn', async ({
    page,
  }, testInfo) => {
    // Desktop only. The endpoint is rate limited per address, and creating the same account once per
    // viewport would spend that allowance proving something the other projects do not test.
    test.skip(testInfo.project.name !== 'desktop', 'One real account per run is enough.');

    removeSignedUpAccount();

    await page.goto(joinPath);
    await openCreateAccount(page);
    await fillSignUpForm(page, { email: uiSignUpEmail });
    await page.getByRole('button', { name: 'Create my account' }).click();

    await expect(page.getByText('Check your inbox', { exact: true })).toBeVisible();
    expect(signedUpAccountCount()).toBe('1');
    expect(outstandingVerificationCount()).toBe('1');

    // A created account is not a signed-in one until the emailed link has been followed.
    const storedToken = await page.evaluate(() => localStorage.getItem('AuthToken'));
    expect(storedToken).toBeNull();
  });

  test('Verify_LinkWithNoToken_ExplainsItselfWithoutAskingTheServerAnything', async ({ page }) => {
    const attempts = await countRequestsTo(page, '**/peer-to-peer/verify-email');

    await page.goto(`/donation/campaign/${campaign.uniqueId}/peer-to-peer/verify-email`);

    await expect(page.getByText('This link did not work')).toBeVisible();
    expect(attempts()).toBe(0);
  });

  test('Verify_TokenThatWasNeverIssued_IsRefusedWithoutSayingWhy', async ({ page }) => {
    await page.goto(
      `/donation/campaign/${campaign.uniqueId}/peer-to-peer/verify-email?token=not-a-real-token`,
    );

    await expect(page.getByText('This link did not work')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Sign in and set up my page' }),
    ).toHaveCount(0);
  });

  test('Access_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    await page.goto(joinPath);
    await expect(page.locator(signInEmailField)).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('Access_EveryControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    await page.goto(joinPath);

    const signInTab = await page.getByRole('tab', { name: 'Sign in' }).boundingBox();
    const email = await page.locator(signInEmailField).boundingBox();
    const password = await page.locator(signInPasswordField).boundingBox();
    const submit = await page.getByRole('button', { name: 'Sign in', exact: true }).boundingBox();

    expect(signInTab?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(email?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(password?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(submit?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
