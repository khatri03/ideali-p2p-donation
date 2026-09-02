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

const probeDecisionEmails = (): string[] =>
  query(`
    SELECT dispatch.TemplateType + '|' + dispatch.DispatchKey
    FROM PeerToPeerEmailDispatch dispatch
    INNER JOIN CampaignFundraiser fundraiser ON fundraiser.Id = dispatch.CampaignFundraiserId
    WHERE fundraiser.Slug = '${PROBE_PAGE_SLUG}' AND fundraiser.IsDeleted = 0
    ORDER BY dispatch.Id;
  `);

const probeDecisionKeys = (): string[] =>
  query(`
    SELECT LOWER(REPLACE(CAST(entry.UniqueId AS VARCHAR(40)), '-', ''))
    FROM PeerToPeerModerationEntry entry
    WHERE entry.SubjectName = '${PROBE_PAGE_NAME}'
      AND entry.Action IN ('Approve', 'Reject')
    ORDER BY entry.Id;
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
const visibleText = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true }).first();

const visibleLink = (page: Page, name: string | RegExp) =>
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

  test('Approve_BeforeConfirming_SaysTheSupporterIsToldTheDecision', async ({ page }) => {
    insertProbePage('PendingApproval');

    await openProbePage(page);
    await page.getByRole('button', { name: 'Approve' }).click();

    await expect(visibleText(page, 'They are emailed that you approved it.')).toBeVisible();
  });

  test('Approve_Confirmed_ClaimsTheApprovalEmailForTheDecisionItJustRecorded', async ({ page }) => {
    insertProbePage('PendingApproval');

    await openProbePage(page);
    await page.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('button', { name: 'Approve this page' }).click();

    await expect(page.getByText(`${PROBE_PAGE_NAME} is live.`)).toBeVisible();

    const decisions = probeDecisionKeys();

    expect(decisions).toHaveLength(1);
    expect(probeDecisionEmails()).toEqual([`PageApproved|${decisions[0]}`]);
  });

  test('Reject_BeforeConfirming_SaysTheReasonStaysWithTheCharity', async ({ page }) => {
    insertProbePage('PendingApproval');

    await openProbePage(page);
    await page.getByRole('button', { name: 'Turn down' }).click();

    await expect(
      visibleText(page, 'without the reason you write below'),
    ).toBeVisible();
    await expect(
      visibleText(page, 'The supporter is not shown what you write here.'),
    ).toBeVisible();
  });

  test('Reject_Confirmed_ClaimsTheRefusalEmailAndKeepsTheReasonOutOfIt', async ({ page }) => {
    insertProbePage('PendingApproval');

    await openProbePage(page);
    await page.getByRole('button', { name: 'Turn down' }).click();
    await page.getByLabel('Reason (optional)').fill('Photo belongs to somebody else');
    await page.getByRole('button', { name: 'Turn this page down' }).click();

    await expect(page.getByText(`${PROBE_PAGE_NAME} has been turned down.`)).toBeVisible();

    const decisions = probeDecisionKeys();

    expect(decisions).toHaveLength(1);
    expect(probeDecisionEmails()).toEqual([`PageRejected|${decisions[0]}`]);
    expect(auditReasons()).toContain('Photo belongs to somebody else');
  });

  test('Hide_Confirmed_ClaimsNoDecisionEmailBecauseNobodyIsWaitingOnIt', async ({ page }) => {
    insertProbePage('Active');

    await openProbePage(page);
    await page.getByRole('button', { name: 'Hide' }).click();
    await page.getByRole('button', { name: 'Hide this page' }).click();

    await expect(page.getByText(`${PROBE_PAGE_NAME} is hidden.`)).toBeVisible();
    expect(probeDecisionEmails()).toEqual([]);
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

/**
 * The one place a charity learns that somebody is waiting on it. Everything else in this suite assumes
 * the charity already opened the oversight screens; these tests prove they are told to.
 */
test.describe('Campaign list approval badge', () => {
  const campaignsPath = '/organizer/donation/manage-donation-module';

  const campaignCard = (page: Page) =>
    page.getByText(campaign.name).filter({ visible: true }).first();

  test.beforeEach(() => {
    removeProbeData();
  });

  test.afterEach(() => {
    removeProbeData();
  });

  /**
   * A page waiting on a decision is announced on the campaign card itself, in words rather than an
   * icon, because an icon alone says only that something is wrong.
   */
  test('CampaignList_PageWaitingForApproval_SaysSoOnTheCampaignCard', async ({ page }) => {
    insertProbePage('PendingApproval');

    await page.goto(campaignsPath);
    await expect(campaignCard(page)).toBeVisible();

    await expect(visibleText(page, /\d+ awaiting approval/)).toBeVisible();
  });

  /**
   * Following the badge lands on the pages already narrowed to the ones waiting, each carrying the way
   * in to its decision, so the charity never has to set the filter by hand to find what is waiting.
   */
  test('CampaignList_BadgeFollowed_OpensThePagesAlreadyNarrowedToTheWaitingOnes', async ({ page }) => {
    insertProbePage('PendingApproval');

    await page.goto(campaignsPath);
    await visibleLink(page, /\d+ awaiting approval/).click();

    await expect(page).toHaveURL(/\/peer-to-peer\/fundraisers\?status=PendingApproval/);
    await expect(visibleText(page, PROBE_PAGE_NAME)).toBeVisible();
    await expect(visibleLink(page, `Review ${PROBE_PAGE_NAME}`)).toBeVisible();
  });

  /**
   * A campaign with nothing waiting shows no badge. A warning that is always there is a warning nobody
   * reads, and the charity would stop trusting the one that matters.
   */
  test('CampaignList_NothingWaiting_ShowsNoBadgeAtAll', async ({ page }) => {
    insertProbePage('Active');

    await page.goto(campaignsPath);
    await expect(campaignCard(page)).toBeVisible();

    await expect(page.getByText(/awaiting approval/)).toHaveCount(0);
  });

  /**
   * The badge is a control a finger has to hit, so it is at least 44px tall however small the pill it
   * draws, and it must not push the page sideways at any supported width.
   */
  test('CampaignList_Badge_IsReachableByTouchAndDoesNotScrollThePageSideways', async ({ page }) => {
    insertProbePage('PendingApproval');

    await page.goto(campaignsPath);

    const badge = visibleLink(page, /\d+ awaiting approval/);
    await expect(badge).toBeVisible();

    const box = await badge.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});

/**
 * The marking that tells a charity, on the list it already opens daily, which of its campaigns let
 * supporters raise money. Without it the answer costs an open of every campaign in turn, and the
 * database is the only place that can prove the marking follows the setting rather than a guess.
 */
test.describe('Campaign list peer-to-peer pill', () => {
  const campaignsPath = '/organizer/donation/manage-donation-module';

  const campaignCard = (page: Page) =>
    page.getByText(campaign.name).filter({ visible: true }).first();

  const fundraisingIsOn = (): boolean =>
    querySingleValue(
      `SELECT CAST(IsPeerToPeerEnabled AS INT) FROM DonationCampaign WHERE Id = ${campaignIdSql};`,
    ) === '1';

  const setFundraising = (isOn: boolean): void =>
    execute(
      `UPDATE DonationCampaign SET IsPeerToPeerEnabled = ${isOn ? 1 : 0} WHERE Id = ${campaignIdSql};`,
    );

  let wasFundraisingOn = true;

  test.beforeAll(() => {
    wasFundraisingOn = fundraisingIsOn();
  });

  test.afterAll(() => {
    setFundraising(wasFundraisingOn);
  });

  /**
   * A campaign that lets supporters fundraise is marked as one, in text the card itself carries rather
   * than in a tooltip a phone can never show.
   */
  test('CampaignList_CampaignRunsSupporterFundraising_MarksTheCard', async ({ page }) => {
    setFundraising(true);

    await page.goto(campaignsPath);
    await expect(campaignCard(page)).toBeVisible();

    await expect(visibleText(page, 'P2P')).toBeVisible();
  });

  /**
   * Turning supporter fundraising off takes the marking off the card. A pill that outlives the setting
   * sends supporters to a screen that refuses them.
   */
  test('CampaignList_FundraisingTurnedOff_TakesTheMarkingOffTheCard', async ({ page }) => {
    setFundraising(false);

    await page.goto(campaignsPath);
    await expect(campaignCard(page)).toBeVisible();

    await expect(page.getByRole('link', { name: /^P2P\./ })).toHaveCount(0);
  });

  /**
   * Following the pill lands on that campaign's own fundraising settings, the screen that says what
   * the marking means and the one place it can be turned off.
   */
  test('CampaignList_PillFollowed_OpensThatCampaignsFundraisingSettings', async ({ page }) => {
    setFundraising(true);

    await page.goto(campaignsPath);
    await visibleLink(page, /^P2P\./).click();

    await expect(page).toHaveURL(new RegExp(`${campaign.uniqueId}/peer-to-peer$`));
    await expect(page.getByRole('heading', { name: 'P2P fundraising' })).toBeVisible();
  });

  /**
   * The pill is a control a finger has to hit, so it is at least 44px tall however small it draws, and
   * a card carrying it must not push the page sideways at any supported width.
   */
  test('CampaignList_Pill_IsReachableByTouchAndDoesNotScrollThePageSideways', async ({ page }) => {
    setFundraising(true);

    await page.goto(campaignsPath);

    const pill = visibleLink(page, /^P2P\./);
    await expect(pill).toBeVisible();

    const box = await pill.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});
