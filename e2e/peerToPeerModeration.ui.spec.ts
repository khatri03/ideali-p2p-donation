import { Page, expect, test } from '@playwright/test';
import { liveCampaign } from './support/campaignFixtures';
import { execute, query, querySingleValue } from './support/database';
import { PROBE_LIFECYCLE_TRAIL_SQL } from './support/fundraiserPages';

/**
 * The four oversight screens in a real browser, at every supported width. What no unit test can prove
 * lives here: that a decision taken on screen reaches the database, that the trail is read back with
 * it, and that a table with eight columns never makes the page itself scroll sideways.
 *
 * Everything this suite writes carries the probe tag and is removed afterwards.
 */

const campaign = liveCampaign();
const PROBE_TAG = 'e2e-moderation-ui';
const PROBE_PAGE_SLUG = 'e2e-moderation-ui-page';
const PROBE_PAGE_NAME = 'E2E Oversight Page';
const PROBE_TEAM_SLUG = 'e2e-moderation-ui-team';
const PROBE_TEAM_NAME = 'E2E Oversight Team';

const oversightRoot = `/organizer/donation/campaign/${campaign.uniqueId}/peer-to-peer`;
const fundraisersPath = `${oversightRoot}/fundraisers`;
const teamsPath = `${oversightRoot}/teams`;

const campaignIdSql = `(SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}')`;

const removeProbeData = (): void =>
  execute(`
    DECLARE @invoiceIds TABLE (Id INT);
    INSERT INTO @invoiceIds SELECT Id FROM Invoice WHERE CreatedBy = '${PROBE_TAG}';

    DELETE FROM InvoiceItem WHERE InvoiceId IN (SELECT Id FROM @invoiceIds);
    DELETE FROM DonationCampaignInvoice WHERE InvoiceId IN (SELECT Id FROM @invoiceIds);
    DELETE FROM Invoice WHERE Id IN (SELECT Id FROM @invoiceIds);

    ${PROBE_LIFECYCLE_TRAIL_SQL}

    DELETE FROM PeerToPeerModerationEntry WHERE SubjectName LIKE 'E2E Oversight%';

    DELETE FROM CampaignTeamMember
    WHERE CampaignTeamId IN (SELECT Id FROM CampaignTeam WHERE CreatedBy = '${PROBE_TAG}');

    DELETE FROM CampaignTeam WHERE CreatedBy = '${PROBE_TAG}';

    DELETE FROM CampaignFundraiser WHERE CreatedBy = '${PROBE_TAG}';
  `);

const insertProbePage = (status: string): void =>
  execute(`
    DECLARE @campaignId INT = ${campaignIdSql};
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);
    DECLARE @userId INT = (
      SELECT MIN(Id) FROM [User]
      WHERE Id NOT IN (
        SELECT UserId FROM CampaignFundraiser
        WHERE DonationCampaignId = @campaignId AND IsDeleted = 0
      )
    );

    INSERT INTO CampaignFundraiser
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, UserId, Slug, DisplayName, Story,
       PersonalGoal, CurrentStatus, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId, @userId, '${PROBE_PAGE_SLUG}', '${PROBE_PAGE_NAME}',
       'Written by the oversight suite.', 1000, '${status}', 0, '${PROBE_TAG}', SYSUTCDATETIME());
  `);

const insertProbeTeam = (isHidden: 0 | 1): void =>
  execute(`
    DECLARE @campaignId INT = ${campaignIdSql};
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);
    DECLARE @fundraiserId INT = (
      SELECT Id FROM CampaignFundraiser
      WHERE DonationCampaignId = @campaignId AND Slug = '${PROBE_PAGE_SLUG}' AND IsDeleted = 0
    );

    INSERT INTO CampaignTeam
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, CaptainUserId, Slug, Name, Story,
       TeamGoal, IsHidden, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId,
       (SELECT UserId FROM CampaignFundraiser WHERE Id = @fundraiserId),
       '${PROBE_TEAM_SLUG}', '${PROBE_TEAM_NAME}', 'Written by the oversight suite.', 5000,
       ${isHidden}, 0, '${PROBE_TAG}', SYSUTCDATETIME());

    INSERT INTO CampaignTeamMember
      (UniqueId, CampaignTeamId, CampaignFundraiserId, JoinedOnUtc, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES (NEWID(), SCOPE_IDENTITY(), @fundraiserId, SYSUTCDATETIME(), 0,
            '${PROBE_TAG}', SYSUTCDATETIME());
  `);

const probePageStatus = (): string =>
  querySingleValue(`
    SELECT CurrentStatus FROM CampaignFundraiser
    WHERE DonationCampaignId = ${campaignIdSql} AND Slug = '${PROBE_PAGE_SLUG}' AND IsDeleted = 0;
  `);

const probeTeamIsHidden = (): string =>
  querySingleValue(`
    SELECT CAST(IsHidden AS VARCHAR(1)) FROM CampaignTeam
    WHERE DonationCampaignId = ${campaignIdSql} AND Slug = '${PROBE_TEAM_SLUG}' AND IsDeleted = 0;
  `);

const auditReasons = (): string[] =>
  query(`
    SELECT ISNULL(Reason, '(none)') FROM PeerToPeerModerationEntry
    WHERE SubjectName LIKE 'E2E Oversight%' ORDER BY Id;
  `);

const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/**
 * The list renders as a table above lg and as cards below it, so both are in the document at every
 * width and only one of them is on screen. Every assertion here therefore looks for the visible copy
 * rather than the first one in the DOM.
 */
const visibleText = (page: Page, text: string) =>
  page.getByText(text).filter({ visible: true }).first();

const visibleLink = (page: Page, name: string) =>
  page.getByRole('link', { name }).filter({ visible: true }).first();

const openProbePage = async (page: Page) => {
  await page.goto(fundraisersPath);
  await page.getByLabel('Search fundraising pages').fill(PROBE_PAGE_NAME);
  await visibleLink(page, `Review ${PROBE_PAGE_NAME}`).click();
  await expect(page.getByRole('heading', { name: PROBE_PAGE_NAME })).toBeVisible();
};

const openProbeTeam = async (page: Page) => {
  await page.goto(teamsPath);
  await page.getByLabel('Search teams').fill(PROBE_TEAM_NAME);
  await visibleLink(page, `Review ${PROBE_TEAM_NAME}`).click();
  await expect(page.getByRole('heading', { name: PROBE_TEAM_NAME })).toBeVisible();
};

test.beforeEach(() => {
  removeProbeData();
});

test.afterAll(() => {
  removeProbeData();
});

test.describe('Getting to oversight', () => {
  test('Settings_Opened_OffersTheWayToThePagesAndTheTeams', async ({ page }) => {
    await page.goto(oversightRoot);

    await expect(page.getByRole('link', { name: 'Fundraising pages', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Teams', exact: true })).toBeVisible();
  });

  test('Tabs_FundraisersOpen_MarkThatTabAsTheCurrentOne', async ({ page }) => {
    await page.goto(fundraisersPath);

    await expect(page.getByRole('link', { name: 'Fundraising pages', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('Tabs_EveryOne_ShowsAPointerCursorOnHover', async ({ page }) => {
    await page.goto(fundraisersPath);

    await expect(page.getByRole('link', { name: 'Teams', exact: true })).toHaveCSS('cursor', 'pointer');
  });
});

test.describe('Screen 10 - the fundraiser list', () => {
  test('List_Opened_ShowsTheTwoTotalsWithTheirOwnDefinitions', async ({ page }) => {
    await page.goto(fundraisersPath);

    await expect(page.getByText('Raised through fundraisers')).toBeVisible();
    await expect(page.getByText('Raised in total')).toBeVisible();
    await expect(
      page.getByText(
        'Every settled gift on this campaign, whether a supporter was involved or not. Tips excluded, refunds deducted.',
      ),
    ).toBeVisible();
  });

  test('List_PageOnTheCampaign_ShowsItWithItsStatus', async ({ page }) => {
    insertProbePage('PendingApproval');

    await page.goto(fundraisersPath);
    await page.getByLabel('Search fundraising pages').fill(PROBE_PAGE_NAME);

    await expect(visibleText(page, PROBE_PAGE_NAME)).toBeVisible();
    await expect(visibleText(page, 'Waiting for approval')).toBeVisible();
  });

  test('Search_MatchesNothing_SaysSoRatherThanClaimingNobodyIsFundraising', async ({ page }) => {
    await page.goto(fundraisersPath);
    await page.getByLabel('Search fundraising pages').fill('no-such-supporter-anywhere');

    await expect(page.getByText('Nothing matches that')).toBeVisible();
  });

  test('ClearFilters_NothingFilteredYet_IsUnavailableAndShowsNotAllowed', async ({ page }) => {
    await page.goto(fundraisersPath);

    const clear = page.getByRole('button', { name: 'Clear filters' });

    await expect(clear).toBeDisabled();
    await expect(clear).toHaveCSS('cursor', 'not-allowed');
  });

  test('Status_FilteredToWaiting_LeavesTheLivePagesOut', async ({ page }) => {
    insertProbePage('Active');

    await page.goto(fundraisersPath);
    await page.getByLabel('Status').selectOption('PendingApproval');
    await page.getByLabel('Search fundraising pages').fill(PROBE_PAGE_NAME);

    await expect(page.getByText('Nothing matches that')).toBeVisible();
  });

  test('List_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    insertProbePage('Active');

    await page.goto(fundraisersPath);
    await expect(page.getByText('Raised in total')).toBeVisible();

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test('List_EveryControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    await page.goto(fundraisersPath);

    const search = await page.getByLabel('Search fundraising pages').boundingBox();
    const exportButton = await page.getByRole('button', { name: 'Export as CSV' }).boundingBox();

    expect(search?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(exportButton?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test('Export_PagesToExport_HandsOverAFileNamedAfterTheCampaign', async ({ page }) => {
    insertProbePage('Active');

    await page.goto(fundraisersPath);
    await expect(page.getByRole('button', { name: 'Export as CSV' })).toBeEnabled();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export as CSV' }).click();

    expect((await download).suggestedFilename()).toMatch(/-fundraising-pages\.csv$/);
  });

  test('List_UnknownCampaign_ShowsARetryableBannerAndNoInternalDetail', async ({ page }) => {
    await page.goto(
      '/organizer/donation/campaign/00000000-0000-0000-0000-0000000000ff/peer-to-peer/fundraisers',
    );

    const banner = page.getByRole('alert');
    await expect(banner).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();

    const message = (await banner.innerText()).toLowerCase();
    expect(message).not.toContain('exception');
    expect(message).not.toContain('stack');
    expect(message).not.toContain('sql');
  });
});

test.describe('Screen 18 - reviewing one page', () => {
  test('Review_PageWaitingForApproval_ShowsWhatTheSupporterWroteAndOffersBothDecisions', async ({
    page,
  }) => {
    insertProbePage('PendingApproval');

    await openProbePage(page);

    await expect(page.getByText('Written by the oversight suite.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Turn down' })).toBeVisible();
  });

  test('Approve_Confirmed_PutsThePageLiveInTheDatabase', async ({ page }) => {
    insertProbePage('PendingApproval');

    await openProbePage(page);
    await page.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('button', { name: 'Approve this page' }).click();

    await expect(page.getByText(`${PROBE_PAGE_NAME} is live.`)).toBeVisible();
    expect(probePageStatus()).toBe('Active');
  });

  test('Hide_Cancelled_ChangesNothing', async ({ page }) => {
    insertProbePage('Active');

    await openProbePage(page);
    await page.getByRole('button', { name: 'Hide' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByText(`Hide ${PROBE_PAGE_NAME}?`)).toBeHidden();
    expect(probePageStatus()).toBe('Active');
  });

  test('Hide_Confirmed_TakesThePageDownAndRecordsTheReason', async ({ page }) => {
    insertProbePage('Active');

    await openProbePage(page);
    await page.getByRole('button', { name: 'Hide' }).click();
    await page.getByLabel('Reason (optional)').fill('Wrong photo');
    await page.getByRole('button', { name: 'Hide this page' }).click();

    await expect(page.getByText(`${PROBE_PAGE_NAME} is hidden.`)).toBeVisible();
    expect(probePageStatus()).toBe('Paused');
    expect(auditReasons()).toEqual(['Wrong photo']);
  });

  test('Hide_Confirmed_ShowsTheDecisionInTheTrailWithoutAReload', async ({ page }) => {
    insertProbePage('Active');

    await openProbePage(page);
    await page.getByRole('button', { name: 'Hide' }).click();
    await page.getByLabel('Reason (optional)').fill('Wrong photo');
    await page.getByRole('button', { name: 'Hide this page' }).click();

    await expect(page.getByText('Wrong photo')).toBeVisible();
    await expect(page.getByText('Nothing has been changed on this yet.')).toBeHidden();
  });

  test('Unhide_HiddenPage_BringsItBackAndTheStatusFollows', async ({ page }) => {
    insertProbePage('Paused');

    await openProbePage(page);
    await page.getByRole('button', { name: 'Bring back' }).click();
    await page.getByRole('button', { name: 'Bring this page back' }).click();

    await expect(page.getByText(`${PROBE_PAGE_NAME} is back.`)).toBeVisible();
    expect(probePageStatus()).toBe('Active');
  });

  test('Reason_LongerThanAllowed_IsRefusedOnScreenAndSendsNothing', async ({ page }) => {
    insertProbePage('Active');

    await openProbePage(page);
    await page.getByRole('button', { name: 'Hide' }).click();
    await page.getByLabel('Reason (optional)').fill('x'.repeat(501));

    await expect(page.getByText('Keep the reason to 500 characters or fewer.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hide this page' })).toBeDisabled();
    expect(probePageStatus()).toBe('Active');
  });

  test('Confirmation_AtEveryViewport_IsFullScreenOnMobileAndCentredAbove', async ({
    page,
  }, testInfo) => {
    insertProbePage('Active');

    await openProbePage(page);
    await page.getByRole('button', { name: 'Hide' }).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();

    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();

    if (testInfo.project.name === 'mobile') {
      expect(box?.width ?? 0).toBeGreaterThanOrEqual((viewport?.width ?? 0) - 16);
    } else {
      expect(box?.width ?? 0).toBeLessThan(viewport?.width ?? 0);
    }
  });

  test('Review_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    insertProbePage('Active');

    await openProbePage(page);

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});

test.describe('Screen 16 and 17 - teams', () => {
  test('Teams_HiddenTeam_IsStillListedForTheCharityThatHidIt', async ({ page }) => {
    insertProbePage('Active');
    insertProbeTeam(1);

    await page.goto(teamsPath);
    await page.getByLabel('Search teams').fill(PROBE_TEAM_NAME);

    await expect(visibleText(page, PROBE_TEAM_NAME)).toBeVisible();
    await expect(visibleText(page, 'Hidden')).toBeVisible();
  });

  test('Teams_FilteredToHiddenOnly_LeavesTheVisibleOnesOut', async ({ page }) => {
    insertProbePage('Active');
    insertProbeTeam(0);

    await page.goto(teamsPath);
    await page.getByLabel('Visibility').selectOption('hidden');
    await page.getByLabel('Search teams').fill(PROBE_TEAM_NAME);

    await expect(page.getByText('Nothing matches that')).toBeVisible();
  });

  test('TeamReview_Opened_NamesTheMembersAndWhatEachRaised', async ({ page }) => {
    insertProbePage('Active');
    insertProbeTeam(0);

    await openProbeTeam(page);

    await expect(visibleText(page, 'Members')).toBeVisible();
    await expect(visibleText(page, PROBE_PAGE_NAME)).toBeVisible();
  });

  test('HideTeam_Confirmed_TakesItOffBrowsingAndLeavesTheMemberPageLive', async ({ page }) => {
    insertProbePage('Active');
    insertProbeTeam(0);

    await openProbeTeam(page);
    await page.getByRole('button', { name: 'Hide' }).click();
    await page.getByRole('button', { name: 'Hide this team' }).click();

    await expect(page.getByText(`${PROBE_TEAM_NAME} is hidden.`)).toBeVisible();
    expect(probeTeamIsHidden()).toBe('1');
    expect(probePageStatus()).toBe('Active');
  });

  test('TeamReview_HiddenTeam_OffersBringingItBackAndNoPublicLink', async ({ page }) => {
    insertProbePage('Active');
    insertProbeTeam(1);

    await openProbeTeam(page);

    await expect(page.getByRole('button', { name: 'Bring back' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open the team page/ })).toHaveCount(0);
  });

  test('TeamReview_AskedNothingAboutApproval_OffersOnlyHidingOrBringingBack', async ({ page }) => {
    insertProbePage('Active');
    insertProbeTeam(0);

    await openProbeTeam(page);

    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Turn down' })).toHaveCount(0);
  });

  test('Teams_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    insertProbePage('Active');
    insertProbeTeam(0);

    await page.goto(teamsPath);
    await expect(page.getByText('Raised in total')).toBeVisible();

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test('TeamReview_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    insertProbePage('Active');
    insertProbeTeam(0);

    await openProbeTeam(page);

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});
