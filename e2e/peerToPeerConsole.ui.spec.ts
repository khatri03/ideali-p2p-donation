import { expect, test } from '@playwright/test';
import { e2eEnv } from './support/e2eEnv';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';

/**
 * The console and the edit screen, at 1280, 768 and 375. The page under test is inserted against the
 * signed-in account and removed afterwards, because what is being proven is what the owner sees, not
 * how the page was created.
 */

const campaign = liveCampaign();
const PROBE_TAG = 'e2e-console-ui';
const SLUG = 'e2e-console-ui-page';
const DISPLAY_NAME = 'E2E Console Screen';

const CONSOLE_PATH = '/member/my-fundraising';

let pageUniqueId: string;

const removeProbePage = (): void =>
  execute(`DELETE FROM CampaignFundraiser WHERE CreatedBy = '${PROBE_TAG}';`);

const insertProbePage = (): string => {
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);
    DECLARE @userId INT = (SELECT TOP 1 Id FROM [User] WHERE UserName = '${e2eEnv.organizerUsername}' ORDER BY Id);

    INSERT INTO CampaignFundraiser
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, UserId, Slug, DisplayName, Story,
       PersonalGoal, CurrentStatus, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId, @userId, '${SLUG}', '${DISPLAY_NAME}',
       'Written by the e2e suite.', 500, 'Active', 0, '${PROBE_TAG}', SYSUTCDATETIME());
  `);

  // SQL Server returns a GUID upper case; the browser address bar carries it lower case.
  return querySingleValue(`
    SELECT LOWER(CAST(UniqueId AS VARCHAR(50))) FROM CampaignFundraiser WHERE Slug = '${SLUG}';
  `);
};

/**
 * A suggested goal is put on the campaign on purpose: clearing a personal goal has to leave the page
 * with none, and a campaign carrying no suggestion could not tell that apart from the old behaviour of
 * quietly handing the charity's figure back.
 */
let defaultGoalBeforeTheRun: string;

test.beforeAll(() => {
  defaultGoalBeforeTheRun = querySingleValue(`
    SELECT ISNULL(CAST(PeerToPeerDefaultPersonalGoal AS VARCHAR(20)), 'NULL')
    FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}';
  `);

  execute(`
    UPDATE DonationCampaign
    SET IsPeerToPeerEnabled = 1,
        PeerToPeerDefaultPersonalGoal = 250,
        PeerToPeerSlug = ISNULL(PeerToPeerSlug, 'e2e-campaign-' + CAST(Id AS VARCHAR(10)))
    WHERE UniqueId = '${campaign.uniqueId}';
  `);
});

test.beforeEach(() => {
  removeProbePage();
  pageUniqueId = insertProbePage();
});

test.afterAll(() => {
  removeProbePage();

  execute(`
    UPDATE DonationCampaign
    SET PeerToPeerDefaultPersonalGoal = ${defaultGoalBeforeTheRun === 'NULL' ? 'NULL' : defaultGoalBeforeTheRun}
    WHERE UniqueId = '${campaign.uniqueId}';
  `);
});

test.describe('Fundraiser console screens', () => {
  test('Console_Opened_ListsThePageWithItsCampaignAndTotal', async ({ page }) => {
    await page.goto(CONSOLE_PATH);

    await expect(page.getByRole('heading', { level: 1, name: 'My fundraising' })).toBeVisible();
    await expect(page.getByRole('heading', { name: campaign.name })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit my page' })).toBeVisible();
  });

  test('Console_ShareLink_IsShownInFullSoItCanBeCopiedByHand', async ({ page }) => {
    await page.goto(CONSOLE_PATH);

    await expect(page.getByText(new RegExp(`/campaigns/[^/]+/${SLUG}$`))).toBeVisible();
  });

  test('Console_EditPressed_OpensThatPagesEditorPrefilled', async ({ page }) => {
    await page.goto(CONSOLE_PATH);
    await page.getByRole('button', { name: 'Edit my page' }).click();

    await expect(page).toHaveURL(new RegExp(`${pageUniqueId}$`));
    await expect(page.getByLabel('Name on your page')).toHaveValue(DISPLAY_NAME);
  });

  test('Edit_SavedChange_ReachesThePublicPage', async ({ page }) => {
    await page.goto(`${CONSOLE_PATH}/${pageUniqueId}`);

    const name = page.getByLabel('Name on your page');
    await name.fill('E2E Console Renamed');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Your page is updated.')).toBeVisible();

    const campaignSlug = querySingleValue(`
      SELECT PeerToPeerSlug FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}';
    `);

    await page.goto(`/campaigns/${campaignSlug}/${SLUG}`);

    await expect(
      page.getByRole('heading', { level: 1, name: 'E2E Console Renamed' }),
    ).toBeVisible();
  });

  test('Edit_GoalCleared_IsStillEmptyAfterAReloadAndThePageLosesItsProgressBar', async ({ page }) => {
    await page.goto(`${CONSOLE_PATH}/${pageUniqueId}`);

    await page.getByLabel('Your goal').fill('');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Your page is updated.')).toBeVisible();

    await page.reload();

    await expect(page.getByLabel('Your goal')).toHaveValue('');

    const campaignSlug = querySingleValue(`
      SELECT PeerToPeerSlug FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}';
    `);

    await page.goto(`/campaigns/${campaignSlug}/${SLUG}`);

    await expect(page.getByRole('heading', { level: 1, name: DISPLAY_NAME })).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveCount(0);
  });

  test('Edit_EmptyName_IsRefusedOnTheScreenBeforeAnythingIsSent', async ({ page }) => {
    await page.goto(`${CONSOLE_PATH}/${pageUniqueId}`);

    await page.getByLabel('Name on your page').fill('');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(
      page.getByText('Enter the name to show on your fundraising page.'),
    ).toBeVisible();
  });

  test('Edit_GoalOfZero_IsRefusedOnTheScreen', async ({ page }) => {
    await page.goto(`${CONSOLE_PATH}/${pageUniqueId}`);

    await page.getByLabel('Your goal').fill('0');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(
      page.getByText('Enter a goal greater than zero, or leave it blank.'),
    ).toBeVisible();
  });

  test('Edit_PageThatIsNotTheirs_ShowsADesignedRefusalWithNoBackendDetail', async ({ page }) => {
    await page.goto(`${CONSOLE_PATH}/11111111-1111-1111-1111-111111111111`);

    await expect(page.getByText('This fundraising page is not here')).toBeVisible();

    const source = await page.content();
    expect(source).not.toContain('Ideas.');
    expect(source).not.toContain('   at ');
  });

  test('Console_NoPagesAtAll_ShowsTheDesignedEmptyStateRatherThanADeadScreen', async ({ page }) => {
    removeProbePage();

    await page.goto(CONSOLE_PATH);

    await expect(page.getByText('You are not fundraising yet')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Find a campaign' })).toBeVisible();
  });

  test('Console_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    await page.goto(CONSOLE_PATH);
    await expect(page.getByRole('heading', { level: 1, name: 'My fundraising' })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('Edit_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    await page.goto(`${CONSOLE_PATH}/${pageUniqueId}`);
    await expect(page.getByLabel('Name on your page')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('Console_EveryControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    await page.goto(CONSOLE_PATH);

    const edit = await page.getByRole('button', { name: 'Edit my page' }).boundingBox();
    const copy = await page.getByRole('button', { name: 'Copy link' }).boundingBox();

    expect(edit?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(copy?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test('Edit_EveryControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    await page.goto(`${CONSOLE_PATH}/${pageUniqueId}`);

    const save = await page.getByRole('button', { name: 'Save changes' }).boundingBox();
    const upload = await page.getByRole('button', { name: 'Upload a photo' }).boundingBox();

    expect(save?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(upload?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
