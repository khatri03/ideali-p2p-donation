import { Page, expect, test } from '@playwright/test';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';
import { PROBE_LIFECYCLE_TRAIL_SQL } from './support/fundraiserPages';

/**
 * The standings as a reader opens them, at desktop, tablet and 375px.
 *
 * Signed out on purpose: a published board is something supporters share with people who hold no
 * account, so the whole surface has to work without one. Every row this suite writes is tagged and
 * removed afterwards.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const campaign = liveCampaign();
const FIRST_SLUG = 'e2e-board-first';
const SECOND_SLUG = 'e2e-board-second';
const FIRST_NAME = 'E2E Board First';
const SECOND_NAME = 'E2E Board Second';
const PROBE_TAG = 'e2e-board';

let campaignSlug: string;

/** Both the table and the card list are in the DOM at every width, so a name matches twice. */
const visibleText = (page: Page, text: string) =>
  page.getByText(text, { exact: false }).filter({ visible: true }).first();

const removeProbeRows = (): void =>
  execute(`
    ${PROBE_LIFECYCLE_TRAIL_SQL}

    DELETE fundraiser
    FROM CampaignFundraiser fundraiser
    INNER JOIN DonationCampaign campaign ON campaign.Id = fundraiser.DonationCampaignId
    WHERE campaign.UniqueId = '${campaign.uniqueId}' AND fundraiser.CreatedBy = '${PROBE_TAG}';
  `);

/**
 * One page per person per campaign is a unique index, so two probe pages have to belong to two people
 * and to two nobody else is using. The offset picks a different account for the second, counting down
 * from the highest free one because the suites written before this take the lowest.
 */
const insertProbePage = (
  slug: string,
  displayName: string,
  status: string,
  userOffset = 0,
): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);
    DECLARE @userId INT = (
      SELECT Id FROM [User]
      WHERE Id NOT IN (
        SELECT UserId FROM CampaignFundraiser WHERE DonationCampaignId = @campaignId AND IsDeleted = 0
      )
      ORDER BY Id DESC OFFSET ${userOffset} ROWS FETCH NEXT 1 ROWS ONLY
    );

    INSERT INTO CampaignFundraiser
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, UserId, Slug, DisplayName, Story,
       PersonalGoal, CurrentStatus, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId, @userId, '${slug}', '${displayName}',
       NULL, 500, '${status}', 0, '${PROBE_TAG}', SYSUTCDATETIME());
  `);

const setCampaign = (columns: string): void =>
  execute(`UPDATE DonationCampaign SET ${columns} WHERE UniqueId = '${campaign.uniqueId}';`);

/**
 * Also clears the cancellation the finished-campaign test sets, so an interrupted run cannot leave the
 * campaign closed behind it: every test here repairs the state it depends on before using it.
 */
const publishBoard = (): void =>
  setCampaign(
    "IsPeerToPeerEnabled = 1, PeerToPeerAllowTeams = 1, IsCancelled = 0, "
      + "PeerToPeerLeaderboardVisibility = 'Public'",
  );

const boardPath = () => `/campaigns/${campaignSlug}/leaderboard`;

test.beforeAll(() => {
  setCampaign(
    "IsPeerToPeerEnabled = 1, PeerToPeerSlug = ISNULL(PeerToPeerSlug, 'e2e-campaign-' + CAST(Id AS VARCHAR(10)))",
  );

  campaignSlug = querySingleValue(`
    SELECT PeerToPeerSlug FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}';
  `);

  removeProbeRows();
});

test.beforeEach(() => {
  publishBoard();
  removeProbeRows();
});

test.afterAll(() => {
  publishBoard();
  removeProbeRows();
});

test.describe('The leaderboard a reader opens', () => {
  test('Board_Published_OpensAtItsOwnAddressAndNamesTheCampaign', async ({ page }) => {
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');

    await page.goto(boardPath());

    await expect(page.getByRole('heading', { level: 1, name: 'Leaderboard' })).toBeVisible();
    await expect(visibleText(page, campaign.name)).toBeVisible();
  });

  test('Board_Published_RanksEveryApprovedPageWithItsPlace', async ({ page }) => {
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');
    insertProbePage(SECOND_SLUG, SECOND_NAME, 'Active', 1);

    await page.goto(boardPath());

    await expect(visibleText(page, FIRST_NAME)).toBeVisible();
    await expect(visibleText(page, SECOND_NAME)).toBeVisible();
    await expect(page.getByLabel('Place 1').filter({ visible: true }).first()).toBeVisible();
  });

  test('Board_PageWaitingForApproval_IsNeverShownToAReader', async ({ page }) => {
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');
    insertProbePage(SECOND_SLUG, SECOND_NAME, 'PendingApproval', 1);

    await page.goto(boardPath());

    await expect(visibleText(page, FIRST_NAME)).toBeVisible();
    await expect(page.getByText(SECOND_NAME)).toHaveCount(0);
  });

  test('Board_PageTheCharityPaused_IsNeverShownToAReader', async ({ page }) => {
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');
    insertProbePage(SECOND_SLUG, SECOND_NAME, 'Paused', 1);

    await page.goto(boardPath());

    await expect(visibleText(page, FIRST_NAME)).toBeVisible();
    await expect(page.getByText(SECOND_NAME)).toHaveCount(0);
  });

  test('Board_FundraiserChosen_OpensTheirPublicPageAtItsUsualAddress', async ({ page }) => {
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');

    await page.goto(boardPath());
    await page.getByRole('link', { name: `View page: ${FIRST_NAME}` }).first().click();

    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignSlug}/${FIRST_SLUG}$`));
  });

  test('Board_TeamsTab_IsReachableAndAnswersForThisCampaign', async ({ page }) => {
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');

    await page.goto(boardPath());
    await page.getByRole('tab', { name: 'Teams' }).click();

    await expect(
      page.getByText(/No teams yet|The Early Risers|raised/).first(),
    ).toBeVisible();
  });

  test('Board_BiggestGiftsTab_IsReachableAndNeverPromisesAnonymousDonors', async ({ page }) => {
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');

    await page.goto(boardPath());
    await page.getByRole('tab', { name: 'Biggest gifts' }).click();

    await expect(page.getByText('Anonymous', { exact: true })).toHaveCount(0);
  });

  test('Board_PageThatHasRaisedNothing_IsStillListedRatherThanDropped', async ({ page }) => {
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');

    await page.goto(boardPath());

    await expect(visibleText(page, FIRST_NAME)).toBeVisible();
    await expect(visibleText(page, '$0')).toBeVisible();
    await expect(page.getByLabel('Place 1').filter({ visible: true }).first()).toBeVisible();
  });

  test('Board_KeptToTheCharity_ShowsAStrangerTheSameNoticeAsAMistypedAddress', async ({ page }) => {
    setCampaign("PeerToPeerLeaderboardVisibility = 'OrganizerOnly'");

    await page.goto(boardPath());

    await expect(page.getByText('This leaderboard is not here')).toBeVisible();
  });

  test('Board_HiddenByTheCharity_ShowsTheSameNoticeToEveryone', async ({ page }) => {
    setCampaign("PeerToPeerLeaderboardVisibility = 'Hidden'");

    await page.goto(boardPath());

    await expect(page.getByText('This leaderboard is not here')).toBeVisible();
  });

  test('Board_MistypedAddress_ShowsTheSameNoticeWithoutConfirmingAnythingEverExisted', async ({
    page,
  }) => {
    await page.goto('/campaigns/no-such-campaign-at-all/leaderboard');

    await expect(page.getByText('This leaderboard is not here')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('Board_CampaignThatHasFinished_SaysTheseAreTheFinalStandings', async ({ page }) => {
    // CurrentStatus is a computed column, so a campaign is closed the way the product closes one.
    setCampaign('IsCancelled = 1');
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');

    await page.goto(boardPath());

    await expect(
      page.getByText('This campaign has finished. These are the final standings.'),
    ).toBeVisible();

    setCampaign('IsCancelled = 0');
  });

  test('Board_PublishedBoard_IsOfferedFromAFundraiserPage', async ({ page }) => {
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');

    await page.goto(`/campaigns/${campaignSlug}/${FIRST_SLUG}`);
    await page.getByRole('link', { name: 'Leaderboard' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Leaderboard' })).toBeVisible();
  });

  test('Board_NotPublished_IsNotOfferedFromAFundraiserPage', async ({ page }) => {
    setCampaign("PeerToPeerLeaderboardVisibility = 'Hidden'");
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');

    await page.goto(`/campaigns/${campaignSlug}/${FIRST_SLUG}`);
    await expect(page.getByRole('heading', { level: 1, name: FIRST_NAME })).toBeVisible();

    await expect(page.getByRole('link', { name: 'Leaderboard' })).toHaveCount(0);
  });

  test('Board_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');
    insertProbePage(SECOND_SLUG, SECOND_NAME, 'Active', 1);

    await page.goto(boardPath());
    await expect(visibleText(page, FIRST_NAME)).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('Board_EveryControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');

    await page.goto(boardPath());
    await expect(visibleText(page, FIRST_NAME)).toBeVisible();

    const tab = await page.getByRole('tab', { name: 'Fundraisers' }).boundingBox();
    const link = await page
      .getByRole('link', { name: `View page: ${FIRST_NAME}` })
      .first()
      .boundingBox();

    expect(tab?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(link?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test('Board_EveryLinkOnIt_ShowsAPointerCursor', async ({ page }) => {
    insertProbePage(FIRST_SLUG, FIRST_NAME, 'Active');

    await page.goto(boardPath());

    const cursor = await page
      .getByRole('link', { name: `View page: ${FIRST_NAME}` })
      .first()
      .evaluate((element) => getComputedStyle(element).cursor);

    expect(cursor).toBe('pointer');
  });
});
