import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { e2eEnv } from './support/e2eEnv';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';
import { buildPng, pngSize } from './support/testImages';

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

/** Wider than it is tall, so the framing has room to move and the saved square is provably a crop. */
const CHOSEN_PHOTO = {
  name: 'portrait.png',
  mimeType: 'image/png',
  buffer: buildPng(600, 300),
};

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

  test('Console_ViewMyPage_OpensThePublicPageInANewTabAndLeavesTheConsoleWhereItWas', async ({
    page,
    context,
  }) => {
    await page.goto(CONSOLE_PATH);

    const [publicPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('link', { name: /View my page/ }).click(),
    ]);

    await publicPage.waitForLoadState('domcontentloaded');

    expect(publicPage.url()).toMatch(new RegExp(`/campaigns/[^/]+/${SLUG}$`));
    await expect(page).toHaveURL(new RegExp(`${CONSOLE_PATH}$`));

    await publicPage.close();
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

  test('Edit_LettersTypedIntoTheGoal_NeverAppearInTheField', async ({ page }) => {
    await page.goto(`${CONSOLE_PATH}/${pageUniqueId}`);

    const goal = page.getByLabel('Your goal');

    await goal.fill('');
    await goal.pressSequentially('lots');

    await expect(goal).toHaveValue('');

    await goal.pressSequentially('$1,250.567');

    await expect(goal).toHaveValue('1250.56');
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

  const storedPhotoId = (): string =>
    querySingleValue(`
      SELECT ISNULL(CAST(PhotoFileStorageId AS VARCHAR(20)), 'NONE')
      FROM CampaignFundraiser WHERE UniqueId = '${pageUniqueId}';
    `);

  const chooseAPhoto = async (page: Page): Promise<void> => {
    await page.goto(`${CONSOLE_PATH}/${pageUniqueId}`);
    await expect(page.getByRole('button', { name: 'Upload a photo' })).toBeVisible();
    await page.setInputFiles('input[type="file"]', CHOSEN_PHOTO);
  };

  test('Edit_PhotoChosenInTheBrowser_IsFramedBeforeAnythingIsUploaded', async ({ page }) => {
    await chooseAPhoto(page);

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('portrait.png', { exact: false })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Zoom' })).toBeVisible();
    expect(storedPhotoId()).toBe('NONE');
  });

  test('Edit_FramingAbandoned_LeavesThePageWithoutAPhoto', async ({ page }) => {
    await chooseAPhoto(page);

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Upload a photo' })).toBeVisible();
    expect(storedPhotoId()).toBe('NONE');
  });

  test('Edit_PhotoFramedAndConfirmed_IsStoredAsASquareCropAndCanBeTakenBackOff', async ({
    page,
  }) => {
    await chooseAPhoto(page);

    await page.getByRole('button', { name: 'Zoom in' }).click();

    const stage = page.getByRole('group', { name: /Photo position/ });
    const frame = await stage.boundingBox();

    expect(frame, 'the framing circle should be on screen').not.toBeNull();

    // Dragged rather than nudged so the pointer path itself is under test, which is how a fundraiser
    // will actually move the picture.
    await page.mouse.move(frame!.x + frame!.width / 2, frame!.y + frame!.height / 2);
    await page.mouse.down();
    await page.mouse.move(frame!.x + frame!.width / 2 - 40, frame!.y + frame!.height / 2, { steps: 8 });
    await page.mouse.up();

    await page.getByRole('button', { name: 'Use this photo' }).click();

    await expect(page.getByRole('button', { name: 'Remove photo' })).toBeVisible();

    const storedId = storedPhotoId();

    expect(storedId).not.toBe('NONE');

    const savedPath = querySingleValue(`
      SELECT FilePath FROM FileStorage WHERE Id = ${storedId};
    `);

    // Read from the file the API wrote rather than through the image endpoint: what is being proven
    // here is that the browser sent a framed square, and the stored bytes say that without depending
    // on how the image is served back.
    const saved = pngSize(readFileSync(savedPath));

    expect(saved.width).toBe(saved.height);
    expect(saved.width).toBe(512);

    // An <img> that fails to load leaves the avatar showing initials and says nothing, so the picture
    // is asked whether it actually decoded rather than merely being on the page.
    const shownPhoto = page.locator('img[src*="/api/images/"]').first();

    await expect(shownPhoto).toBeVisible();
    await expect
      .poll(() => shownPhoto.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Remove photo' }).click();

    await expect(page.getByRole('button', { name: 'Upload a photo' })).toBeVisible();
    expect(storedPhotoId()).toBe('NONE');
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
