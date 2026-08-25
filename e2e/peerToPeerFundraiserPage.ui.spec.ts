import { expect, test } from '@playwright/test';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';
import { PROBE_LIFECYCLE_TRAIL_SQL } from './support/fundraiserPages';

/**
 * The page a donor opens after somebody shares a link, at desktop, tablet and 375px.
 *
 * Signed out on purpose: a donor never holds an account, so the whole surface has to work without one.
 * The page under test is inserted directly and removed afterwards, because the rule being proven is
 * what a stranger sees rather than how the page was created.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const campaign = liveCampaign();
const FUNDRAISER_SLUG = 'e2e-public-page';
const DISPLAY_NAME = 'E2E Public Page';
const STORY = 'I am walking a hundred miles. <script>alert(1)</script>';

let campaignSlug: string;

const removeProbePage = (): void =>
  execute(`
    ${PROBE_LIFECYCLE_TRAIL_SQL}

    DELETE fundraiser
    FROM CampaignFundraiser fundraiser
    INNER JOIN DonationCampaign campaign ON campaign.Id = fundraiser.DonationCampaignId
    WHERE campaign.UniqueId = '${campaign.uniqueId}' AND fundraiser.CreatedBy = 'e2e-page';
  `);

const insertProbePage = (status: string): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);
    DECLARE @userId INT = (SELECT TOP 1 Id FROM [User] ORDER BY Id);

    INSERT INTO CampaignFundraiser
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, UserId, Slug, DisplayName, Story,
       PersonalGoal, CurrentStatus, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId, @userId, '${FUNDRAISER_SLUG}', '${DISPLAY_NAME}',
       '${STORY.replace(/'/g, "''")}', 500, '${status}', 0, 'e2e-page', SYSUTCDATETIME());
  `);

const enablePeerToPeer = (): void => {
  execute(`
    UPDATE DonationCampaign
    SET IsPeerToPeerEnabled = 1,
        PeerToPeerSlug = ISNULL(PeerToPeerSlug, 'e2e-campaign-' + CAST(Id AS VARCHAR(10)))
    WHERE UniqueId = '${campaign.uniqueId}';
  `);

  campaignSlug = querySingleValue(`
    SELECT PeerToPeerSlug FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}';
  `);
};

const pagePath = () => `/campaigns/${campaignSlug}/${FUNDRAISER_SLUG}`;
const donatePath = () => `${pagePath()}/donate`;

test.beforeAll(() => {
  enablePeerToPeer();
  removeProbePage();
});

test.afterEach(() => removeProbePage());

test.describe('Public fundraiser page', () => {
  test('Page_LivePage_LeadsWithThePersonAndOffersTheDonateAction', async ({ page }) => {
    insertProbePage('Active');

    await page.goto(pagePath());

    await expect(page.getByRole('heading', { level: 1, name: DISPLAY_NAME })).toBeVisible();
    await expect(page.getByRole('button', { name: `Donate to ${DISPLAY_NAME}` })).toBeVisible();
  });

  test('Page_StoryWithMarkup_IsShownAsTextRatherThanExecuted', async ({ page }) => {
    insertProbePage('Active');

    let dialogAppeared = false;
    page.on('dialog', async (dialog) => {
      dialogAppeared = true;
      await dialog.dismiss();
    });

    await page.goto(pagePath());

    await expect(page.getByText('<script>alert(1)</script>', { exact: false })).toBeVisible();
    expect(dialogAppeared).toBe(false);
  });

  test('Page_AnyVisitor_SeesNoEmailAddressAnywhereInTheSource', async ({ page }) => {
    insertProbePage('Active');

    await page.goto(pagePath());
    await expect(page.getByRole('heading', { level: 1, name: DISPLAY_NAME })).toBeVisible();

    const source = await page.content();
    expect(source).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });

  test('Page_NoDonationsYet_ShowsTheDesignedEmptyStateRatherThanABlankPanel', async ({ page }) => {
    insertProbePage('Active');

    await page.goto(pagePath());

    await expect(page.getByText('No donations yet')).toBeVisible();
    await expect(page.getByText('Be the first to give, and your name appears here.')).toBeVisible();
  });

  test('Page_WaitingForApproval_ExplainsTheWaitAndOffersNoWayToPay', async ({ page }) => {
    insertProbePage('PendingApproval');

    await page.goto(pagePath());

    await expect(page.getByText('This page is waiting to be approved')).toBeVisible();
    await expect(page.getByRole('button', { name: /Donate to/ })).toHaveCount(0);
  });

  test('Page_Withdrawn_SaysSoAndOffersNoWayToPay', async ({ page }) => {
    insertProbePage('Paused');

    await page.goto(pagePath());

    await expect(page.getByText('This page is not taking donations')).toBeVisible();
    await expect(page.getByRole('button', { name: /Donate to/ })).toHaveCount(0);
  });

  test('Page_UnknownAddress_ShowsADesignedScreenWithNoBackendDetail', async ({ page }) => {
    await page.goto(`/campaigns/${campaignSlug}/nobody-by-that-name`);

    await expect(page.getByText('This fundraising page is not here')).toBeVisible();

    const source = await page.content();
    expect(source).not.toContain('Ideas.');
    expect(source).not.toContain('   at ');
  });

  test('Donate_ButtonPressed_OpensTheDonationFlowWithTheFundraiserNamed', async ({ page }) => {
    insertProbePage('Active');

    await page.goto(pagePath());
    await page.getByRole('button', { name: `Donate to ${DISPLAY_NAME}` }).click();

    await expect(page).toHaveURL(new RegExp(`${FUNDRAISER_SLUG}/donate$`));
    await expect(page.getByText(`You are supporting ${DISPLAY_NAME}`)).toBeVisible();
  });

  test('Donate_AddressOpenedDirectly_ShowsTheCampaignBehindThePageRatherThanTheAddress', async ({
    page,
  }) => {
    insertProbePage('Active');

    await page.goto(donatePath());

    await expect(page.getByText(`You are supporting ${DISPLAY_NAME}`)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to their page' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue to Payment/ })).toBeVisible();
  });

  test('Donate_PageWaitingForApproval_IsRefusedAtTheAddressRatherThanAtTheCardStep', async ({
    page,
  }) => {
    insertProbePage('PendingApproval');

    await page.goto(donatePath());

    await expect(page.getByText('This page is waiting to be approved')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue to Payment/ })).toHaveCount(0);
  });

  test('Donate_UnknownAddress_ShowsADesignedScreenWithNoBackendDetail', async ({ page }) => {
    await page.goto(`/campaigns/${campaignSlug}/nobody-by-that-name/donate`);

    await expect(page.getByText('This fundraising page is not here')).toBeVisible();

    const source = await page.content();
    expect(source).not.toContain('Ideas.');
    expect(source).not.toContain('   at ');
  });

  test('Donate_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    insertProbePage('Active');

    await page.goto(donatePath());
    await expect(page.getByText(`You are supporting ${DISPLAY_NAME}`)).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('Page_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    insertProbePage('Active');

    await page.goto(pagePath());
    await expect(page.getByRole('heading', { level: 1, name: DISPLAY_NAME })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('Page_EveryControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    insertProbePage('Active');

    await page.goto(pagePath());

    const donate = await page
      .getByRole('button', { name: `Donate to ${DISPLAY_NAME}` })
      .boundingBox();
    const copyLink = await page.getByRole('button', { name: 'Copy link' }).boundingBox();

    expect(donate?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(copyLink?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
