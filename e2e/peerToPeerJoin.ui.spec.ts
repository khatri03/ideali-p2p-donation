import { APIRequestContext, expect, test } from '@playwright/test';
import { authenticatedApi, settingsUrl, signIn } from './support/apiSession';
import { liveCampaign } from './support/campaignFixtures';
import { clearFundraiserPages } from './support/fundraiserPages';

/**
 * The whole journey a supporter walks: the campaign page grows a button, the button leads to the join
 * screen, and the join screen produces a real page with a real address. Runs at desktop, tablet and
 * 375px, so a responsive regression fails here rather than waiting for someone to resize a browser.
 */

const campaign = liveCampaign();
const joinPath = `/donation/campaign/${campaign.uniqueId}/peer-to-peer/join`;
const campaignPath = `/donate/${campaign.uniqueId}`;

const displayNameField = '#fundraiser-display-name';
const goalField = '#fundraiser-personal-goal';
const storyField = '#fundraiser-story';

/**
 * One signed-in context for the whole file. The sign-in endpoint is rate limited per address, and
 * authenticating once per test would exhaust that allowance rather than test anything.
 */
let api: APIRequestContext;
let originalSettings: Record<string, unknown>;

const removeJoinedPages = (): void => clearFundraiserPages(campaign.uniqueId);

const applySettings = async (overrides: Record<string, unknown> = {}) => {
  const response = await api.post(settingsUrl(campaign.uniqueId), {
    data: {
      isPeerToPeerEnabled: true,
      defaultPersonalGoal: 250,
      allowTeams: false,
      requiresApproval: false,
      leaderboardVisibility: 'Public',
      ...overrides,
    },
  });

  expect(response.status()).toBe(200);
};

test.beforeAll(async () => {
  api = await authenticatedApi(await signIn());
  originalSettings = (await (await api.get(settingsUrl(campaign.uniqueId))).json()).data;
});

test.beforeEach(async () => {
  removeJoinedPages();
  await applySettings();
});

test.afterAll(async () => {
  removeJoinedPages();

  if (originalSettings) {
    await api.post(settingsUrl(campaign.uniqueId), {
      data: {
        isPeerToPeerEnabled: originalSettings.isPeerToPeerEnabled,
        defaultPersonalGoal: originalSettings.defaultPersonalGoal,
        allowTeams: originalSettings.allowTeams,
        requiresApproval: originalSettings.requiresApproval,
        leaderboardVisibility: originalSettings.leaderboardVisibility,
      },
    });
  }

  await api.dispose();
});

test.describe('Becoming a fundraiser', () => {
  test('CampaignPage_FundraisingOn_OffersTheEntryPointThatLeadsToTheJoinScreen', async ({ page }) => {
    await page.goto(campaignPath);

    const entryPoint = page.getByRole('button', { name: 'Fundraise for this' });
    await expect(entryPoint).toBeVisible();

    await entryPoint.click();
    await expect(page).toHaveURL(new RegExp(`${campaign.uniqueId}/peer-to-peer/join$`));
  });

  test('CampaignPage_FundraisingOff_HidesTheEntryPointAndLeavesTheLayoutIntact', async ({ page }) => {
    await applySettings({ isPeerToPeerEnabled: false });

    await page.goto(campaignPath);
    await expect(page.getByRole('button', { name: 'Fundraise for this' })).toHaveCount(0);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('JoinScreen_Opened_NamesTheCampaignAndPrefillsTheCampaignGoal', async ({ page }) => {
    await page.goto(joinPath);

    await expect(page.getByRole('heading', { name: 'Fundraise for this campaign' })).toBeVisible();
    await expect(page.getByText(`Campaign: ${campaign.name}`)).toBeVisible();
    await expect(page.locator(goalField)).toHaveValue('250');
  });

  test('JoinScreen_Submitted_CreatesAPageAndShowsItsAddress', async ({ page }) => {
    await page.goto(joinPath);

    await page.locator(displayNameField).fill('E2E Fundraiser');
    await page.locator(goalField).fill('320');
    await page.locator(storyField).fill('Created by the e2e suite.');
    await page.getByRole('button', { name: 'Create my page' }).click();

    await expect(page.getByText('Your fundraising page is live')).toBeVisible();
    await expect(page.getByText(/^\/campaigns\/[a-z0-9-]+\/e2e-fundraiser$/)).toBeVisible();
    await expect(page.getByText(/appears the next time you sign in/i)).toBeVisible();
  });

  test('JoinScreen_SecondVisitAfterJoining_ShowsTheExistingPageInsteadOfASecondForm', async ({
    page,
  }) => {
    await page.goto(joinPath);
    await page.locator(displayNameField).fill('E2E Fundraiser');
    await page.getByRole('button', { name: 'Create my page' }).click();
    await expect(page.getByText('Your fundraising page is live')).toBeVisible();

    await page.goto(joinPath);

    await expect(page.getByText('You already have a page for this campaign')).toBeVisible();
    await expect(page.locator(displayNameField)).toHaveCount(0);
  });

  test('JoinScreen_CampaignRequiringApproval_SaysThePageIsNotPublicYet', async ({ page }) => {
    await applySettings({ requiresApproval: true });

    await page.goto(joinPath);
    await expect(page.getByText(/reviews supporter pages before they go live/i)).toBeVisible();

    await page.locator(displayNameField).fill('E2E Fundraiser');
    await page.getByRole('button', { name: 'Create my page' }).click();

    await expect(page.getByText('Your page has been sent for review')).toBeVisible();
    await expect(page.getByText(/not public yet/i)).toBeVisible();
  });

  test('JoinScreen_CampaignWithFundraisingOff_ExplainsItselfAndOffersNoForm', async ({ page }) => {
    await applySettings({ isPeerToPeerEnabled: false });

    await page.goto(joinPath);

    await expect(
      page.getByText('This campaign is not accepting supporter fundraising pages.'),
    ).toBeVisible();
    await expect(page.locator(displayNameField)).toHaveCount(0);
  });

  test('JoinScreen_BlankDisplayName_ExplainsItselfAndSendsNothing', async ({ page }) => {
    let attempts = 0;
    await page.route('**/peer-to-peer/join', (route) => {
      if (route.request().method() === 'POST') {
        attempts += 1;
      }
      return route.continue();
    });

    await page.goto(joinPath);
    await page.locator(displayNameField).fill('   ');
    await page.getByRole('button', { name: 'Create my page' }).click();

    await expect(page.getByText('Enter the name to show on your fundraising page.')).toBeVisible();
    expect(attempts).toBe(0);
  });

  test('JoinScreen_GoalBelowOne_ExplainsItselfAndSendsNothing', async ({ page }) => {
    let attempts = 0;
    await page.route('**/peer-to-peer/join', (route) => {
      if (route.request().method() === 'POST') {
        attempts += 1;
      }
      return route.continue();
    });

    await page.goto(joinPath);
    await page.locator(displayNameField).fill('E2E Fundraiser');
    await page.locator(goalField).fill('0');
    await page.getByRole('button', { name: 'Create my page' }).click();

    await expect(page.getByText('Enter an amount greater than zero, or leave this blank.')).toBeVisible();
    expect(attempts).toBe(0);
  });

  test('JoinScreen_UnknownCampaign_ShowsARetryableBannerAndNoInternalDetail', async ({ page }) => {
    await page.goto('/donation/campaign/00000000-0000-0000-0000-0000000000ff/peer-to-peer/join');

    const banner = page.getByRole('alert');
    await expect(banner.first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();

    const message = (await banner.first().innerText()).toLowerCase();
    expect(message).not.toContain('exception');
    expect(message).not.toContain('stack');
    expect(message).not.toContain('sql');
  });

  test('JoinScreen_TamperedReturnPathPointingOffSite_IsNotFollowedAfterSignIn', async ({ page }) => {
    await page.goto('/auth/sign-in/custom?returnPath=https://evil.test/steal');

    await expect(page).toHaveURL(/\/auth\/sign-in\/custom/);
    await expect(page.getByText(/Sign in to fundraise for/i)).toHaveCount(0);
  });

  test('SignIn_ReachedToFundraise_OffersTheSupporterFormAndNotTheOrganiserOne', async ({ page }) => {
    await page.goto(`/auth/sign-in/custom?returnPath=${encodeURIComponent(joinPath)}`);

    await expect(page.getByText(/Sign in to fundraise for/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create new account' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Create a supporter account' })).toHaveAttribute(
      'href',
      joinPath,
    );
  });

  test('SignIn_ReachedDirectly_StillOffersTheOrganiserSignUpForm', async ({ page }) => {
    await page.goto('/auth/sign-in/custom');

    await expect(page.getByRole('link', { name: 'Create new account' })).toHaveAttribute(
      'href',
      '/auth/sign-up/default',
    );
  });

  test('JoinScreen_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    await page.goto(joinPath);
    await expect(page.locator(displayNameField)).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('JoinScreen_EveryControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    await page.goto(joinPath);

    const submit = await page.getByRole('button', { name: 'Create my page' }).boundingBox();
    const back = await page.getByRole('button', { name: 'Back' }).boundingBox();
    const name = await page.locator(displayNameField).boundingBox();

    expect(submit?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(back?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(name?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
