import { APIRequestContext, expect, test } from '@playwright/test';
import { authenticatedApi, settingsUrl, signIn } from './support/apiSession';
import { liveCampaign } from './support/campaignFixtures';
import { SUPPORTER_STORAGE_STATE_PATH } from './support/e2eEnv';
import { clearFundraiserPages, restoreFundraiserPages } from './support/fundraiserPages';

/**
 * The whole journey a supporter walks: the campaign page grows a button, the button leads to the join
 * screen, and the join screen produces a real page with a real address. Runs at desktop, tablet and
 * 375px, so a responsive regression fails here rather than waiting for someone to resize a browser.
 *
 * Walked as a supporter rather than as the charity: whoever runs a campaign is refused a fundraising
 * page on it, so the organiser's session would prove the refusal and never reach the journey. The
 * campaign settings each test needs are still applied with the organiser's token.
 */

test.use({ storageState: SUPPORTER_STORAGE_STATE_PATH });

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
  restoreFundraiserPages();

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

  /**
   * A campaign story has no length limit. An invitation placed after it is only ever seen by a reader
   * who got to the end, while the campaign's own donate card is in view from the first moment — so the
   * one action that needs more commitment would be the one nobody is shown.
   */
  test('CampaignPage_LongStory_ShowsTheFundraiseOfferAboveTheStoryRatherThanBelowIt', async ({
    page,
  }) => {
    await page.goto(campaignPath);

    const offer = page.getByRole('heading', { name: 'Fundraise for this campaign' });
    const story = page.getByText('About this campaign');

    await expect(offer).toBeVisible();

    const offerBox = await offer.boundingBox();
    const storyBox = await story.boundingBox();

    expect(offerBox).not.toBeNull();
    expect(storyBox).not.toBeNull();
    expect(offerBox!.y).toBeLessThan(storyBox!.y);
  });

  /**
   * Every other surface on a campaign page is drawn in the colour the charity chose, so an invitation
   * in the product's own brand colour reads as an advertisement dropped onto the page.
   */
  test('CampaignPage_EntryPoint_IsDrawnInTheCampaignsOwnColour', async ({ page }) => {
    await page.goto(campaignPath);

    const entryPoint = page.getByRole('button', { name: 'Fundraise for this' });
    await expect(entryPoint).toBeVisible();

    const [colour, borderColour, headingColour] = await Promise.all([
      entryPoint.evaluate((node) => getComputedStyle(node).color),
      entryPoint.evaluate((node) => getComputedStyle(node).borderTopColor),
      page
        .getByRole('heading', { name: 'Fundraise for this campaign' })
        .evaluate((node) => getComputedStyle(node).color),
    ]);

    expect(colour).toBe(borderColour);
    expect(colour).not.toBe(headingColour);
  });

  /**
   * The control fills the panel it sits in. A button that stops short of the card's own edge reads as
   * an unfinished surface, and at desktop width the gap beside it is wider than the button itself.
   */
  test('CampaignPage_EntryPoint_FillsTheWidthOfThePanelItSitsIn', async ({ page }) => {
    await page.goto(campaignPath);

    const entryPoint = page.getByRole('button', { name: 'Fundraise for this' });
    await expect(entryPoint).toBeVisible();

    const heading = page.getByRole('heading', { name: 'Fundraise for this campaign' });
    const [button, headline] = await Promise.all([entryPoint.boundingBox(), heading.boundingBox()]);

    expect(button).not.toBeNull();
    expect(headline).not.toBeNull();
    expect(Math.abs(button!.width - headline!.width)).toBeLessThanOrEqual(2);
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

  /**
   * The form is a white card, and it only reads as a card when the page behind it is not also white.
   * Every other public peer-to-peer screen sits on the shared shell; one that does not looks
   * unfinished next to them.
   */
  test('JoinScreen_Opened_SitsOnThePublicShellSoTheFormReadsAsACard', async ({ page }) => {
    await page.goto(joinPath);

    const form = page.locator('form');
    await expect(form).toBeVisible();

    const [cardBackground, pageBackground] = await Promise.all([
      form.evaluate((node) => getComputedStyle(node).backgroundColor),
      page.evaluate(() => {
        const shell = document.querySelector('main')?.parentElement;
        return shell ? getComputedStyle(shell).backgroundColor : '';
      }),
    ]);

    expect(cardBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(pageBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(cardBackground).not.toBe(pageBackground);
  });

  /**
   * The goal a supporter sets is money. A number box with no currency beside it leaves them guessing,
   * and the charity's own settings screen already states it the same way.
   */
  test('JoinScreen_GoalField_NamesTheCurrencyBesideTheAmount', async ({ page }) => {
    await page.goto(joinPath);

    await expect(page.getByText('$', { exact: true })).toBeVisible();
  });

  test('JoinScreen_Submitted_CreatesAPageAndShowsItsAddress', async ({ page }) => {
    await page.goto(joinPath);

    await page.locator(displayNameField).fill('E2E Fundraiser');
    await page.locator(goalField).fill('320');
    await page.locator(storyField).fill('Created by the e2e suite.');
    await page.getByRole('button', { name: 'Create my page' }).click();

    await expect(page.getByText('Your fundraising page is live')).toBeVisible();

    // The whole address rather than the path: what is shown is what a supporter pastes to somebody else.
    const address = page.getByText(/\/campaigns\/[a-z0-9-]+\/e2e-fundraiser$/);
    await expect(address).toBeVisible();
    expect(await address.innerText()).toContain(`${new URL(page.url()).origin}/campaigns/`);

    await expect(page.getByText(/appears after your next sign-in/i)).toBeVisible();
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

  /**
   * The invitation must never ask somebody to do a thing they have already done. Once a supporter has
   * a live page, the campaign offers the way back to it instead, and opening it lands on their page.
   */
  test('CampaignPage_SupporterAlreadyFundraising_OffersTheirPageInsteadOfTheInvitation', async ({
    page,
  }) => {
    await page.goto(joinPath);
    await page.locator(displayNameField).fill('E2E Fundraiser');
    await page.getByRole('button', { name: 'Create my page' }).click();
    await expect(page.getByText('Your fundraising page is live')).toBeVisible();

    await page.goto(campaignPath);

    const wayBack = page.getByRole('button', { name: 'Go to your fundraising page' });
    await expect(wayBack).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fundraise for this' })).toHaveCount(0);

    await wayBack.click();
    await expect(page).toHaveURL(/\/campaigns\/[a-z0-9-]+\/e2e-fundraiser$/);
  });

  /**
   * Waiting on the charity is the state supporters ask about most, so the campaign says it where they
   * are already looking rather than making them find their console to learn it.
   */
  test('CampaignPage_SupporterWaitingOnTheCharity_SaysSoOnTheCampaignItself', async ({ page }) => {
    await applySettings({ requiresApproval: true });

    await page.goto(joinPath);
    await page.locator(displayNameField).fill('E2E Fundraiser');
    await page.getByRole('button', { name: 'Create my page' }).click();
    await expect(page.getByText('Your page has been sent for review')).toBeVisible();

    await page.goto(campaignPath);

    await expect(
      page.getByRole('button', { name: 'Your page is waiting for approval' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fundraise for this' })).toHaveCount(0);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
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

  /**
   * Only the menu item waits for the next sign-in, so the screen that confirms a page exists leads
   * with the way to it. Sending an unapproved address takes people to a page that is not ready, so no
   * control is offered to send it yet.
   */
  test('JoinScreen_PageSentForReview_LeadsToTheConsoleAndOffersNoWayToSendTheAddressYet', async ({
    page,
  }) => {
    await applySettings({ requiresApproval: true });

    await page.goto(joinPath);
    await page.locator(displayNameField).fill('E2E Fundraiser');
    await page.getByRole('button', { name: 'Create my page' }).click();

    await expect(page.getByText('Your page has been sent for review')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy link' })).toHaveCount(0);
    await expect(page.getByText(/Wait until the charity approves it/i)).toBeVisible();

    await page.getByRole('button', { name: 'Go to my fundraising' }).click();

    await expect(page).toHaveURL(/\/member\/my-fundraising$/);
    await expect(page.getByRole('heading', { level: 1, name: 'My fundraising' })).toBeVisible();
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
