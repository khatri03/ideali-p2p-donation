import { APIRequestContext, expect, test } from '@playwright/test';
import {
  anonymousApi,
  authenticatedApi,
  fundraiserPageUrl,
  moderateFundraiserUrl,
  moderateTeamUrl,
  moderatedFundraiserUrl,
  moderatedFundraisersUrl,
  moderatedTeamUrl,
  moderatedTeamsUrl,
  settingsUrl,
  signIn,
  teamUrl,
  teamsUrl,
} from './support/apiSession';
import { liveCampaign, secondLiveCampaign } from './support/campaignFixtures';
import { execute, query, querySingleValue } from './support/database';
import { PROBE_LIFECYCLE_TRAIL_SQL } from './support/fundraiserPages';

/**
 * The oversight endpoints against the real database. What only this level can prove: that the two
 * totals are read from the same tables the donation dashboard reads, that a decision writes an audit
 * row in the same breath as the status it changes, and that a valid identifier belonging to another
 * campaign is refused without revealing that it exists.
 *
 * Everything this suite writes carries the probe tag and is removed afterwards.
 */

const campaign = liveCampaign();
const otherCampaign = secondLiveCampaign();
const PROBE_TAG = 'e2e-moderation';
const PROBE_PAGE_SLUG = 'e2e-moderation-page';
const PROBE_TEAM_SLUG = 'e2e-moderation-team';

let api: APIRequestContext;
let anonymous: APIRequestContext;
let campaignSlug: string;
let originalSettings: Record<string, unknown>;

const campaignIdSql = (uniqueId: string) =>
  `(SELECT Id FROM DonationCampaign WHERE UniqueId = '${uniqueId}')`;

const removeProbeData = (): void =>
  execute(`
    DECLARE @invoiceIds TABLE (Id INT);
    INSERT INTO @invoiceIds SELECT Id FROM Invoice WHERE CreatedBy = '${PROBE_TAG}';

    DELETE FROM InvoiceItem WHERE InvoiceId IN (SELECT Id FROM @invoiceIds);
    DELETE FROM DonationCampaignInvoice WHERE InvoiceId IN (SELECT Id FROM @invoiceIds);
    DELETE FROM Invoice WHERE Id IN (SELECT Id FROM @invoiceIds);

    ${PROBE_LIFECYCLE_TRAIL_SQL}

    DELETE FROM PeerToPeerModerationEntry
    WHERE SubjectName LIKE 'E2E Moderation%';

    DELETE FROM CampaignTeamMember
    WHERE CampaignTeamId IN (SELECT Id FROM CampaignTeam WHERE CreatedBy = '${PROBE_TAG}');

    DELETE FROM CampaignTeam WHERE CreatedBy = '${PROBE_TAG}';

    DELETE FROM CampaignFundraiser WHERE CreatedBy = '${PROBE_TAG}';
  `);

/** A page belonging to somebody the run does not sign in as, so nothing here depends on the caller. */
const insertProbePage = (status: string): void =>
  execute(`
    DECLARE @campaignId INT = ${campaignIdSql(campaign.uniqueId)};
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
      (NEWID(), 0, @organizerId, @campaignId, @userId, '${PROBE_PAGE_SLUG}', 'E2E Moderation Page',
       'Written by the e2e suite.', 1000, '${status}', 0, '${PROBE_TAG}', SYSUTCDATETIME());
  `);

const insertProbeTeam = (isHidden: 0 | 1): void =>
  execute(`
    DECLARE @campaignId INT = ${campaignIdSql(campaign.uniqueId)};
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);
    DECLARE @fundraiserId INT = (
      SELECT Id FROM CampaignFundraiser
      WHERE DonationCampaignId = @campaignId AND Slug = '${PROBE_PAGE_SLUG}' AND IsDeleted = 0
    );
    DECLARE @captainUserId INT = (SELECT UserId FROM CampaignFundraiser WHERE Id = @fundraiserId);

    INSERT INTO CampaignTeam
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, CaptainUserId, Slug, Name, Story,
       TeamGoal, IsHidden, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId, @captainUserId, '${PROBE_TEAM_SLUG}',
       'E2E Moderation Team', 'Written by the e2e suite.', 5000, ${isHidden}, 0,
       '${PROBE_TAG}', SYSUTCDATETIME());

    INSERT INTO CampaignTeamMember
      (UniqueId, CampaignTeamId, CampaignFundraiserId, JoinedOnUtc, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES (NEWID(), SCOPE_IDENTITY(), @fundraiserId, SYSUTCDATETIME(), 0,
            '${PROBE_TAG}', SYSUTCDATETIME());
  `);

const insertGift = (amount: number, tipAmount = 0, throughThePage = true): void =>
  execute(`
    DECLARE @campaignId INT = ${campaignIdSql(campaign.uniqueId)};
    DECLARE @fundraiserId INT = ${
      throughThePage
        ? `(SELECT Id FROM CampaignFundraiser
             WHERE DonationCampaignId = @campaignId AND Slug = '${PROBE_PAGE_SLUG}' AND IsDeleted = 0)`
        : 'NULL'
    };

    INSERT INTO Invoice (UniqueId, RowVersion, Module, InvoiceType, TotalAmount, InvoiceStatus,
                         IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES (NEWID(), 0, 'Donation', 'Regular', ${amount + tipAmount}, 'Paid', 0,
            '${PROBE_TAG}', SYSUTCDATETIME());

    DECLARE @invoiceId INT = SCOPE_IDENTITY();

    INSERT INTO InvoiceItem (UniqueId, InvoiceId, Description, InvoiceItemStatus, Quantity, UnitPrice,
                             LineTotal, ItemType, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES (NEWID(), @invoiceId, 'Donation', 'Pending', 1, ${amount}, ${amount}, 'Regular', 0,
            '${PROBE_TAG}', SYSUTCDATETIME());

    IF ${tipAmount} > 0
      INSERT INTO InvoiceItem (UniqueId, InvoiceId, Description, InvoiceItemStatus, Quantity,
                               UnitPrice, LineTotal, ItemType, IsDeleted, CreatedBy, CreatedOnUtc)
      VALUES (NEWID(), @invoiceId, 'Tip', 'Pending', 1, ${tipAmount}, ${tipAmount}, 'Tip', 0,
              '${PROBE_TAG}', SYSUTCDATETIME());

    INSERT INTO DonationCampaignInvoice (UniqueId, DonationCampaignId, InvoiceId, CampaignFundraiserId)
    VALUES (NEWID(), @campaignId, @invoiceId, @fundraiserId);
  `);

/** The campaign total the donation dashboard reads: settled gifts, tips out, refunds off. */
const campaignTotalFromTheDatabase = (): number =>
  Number(
    querySingleValue(`
      SELECT ISNULL(SUM(item.LineTotal), 0)
      FROM DonationCampaignInvoice gift
      INNER JOIN Invoice invoice
        ON invoice.Id = gift.InvoiceId AND invoice.IsDeleted = 0 AND invoice.InvoiceStatus = 'Paid'
      INNER JOIN InvoiceItem item
        ON item.InvoiceId = invoice.Id AND item.IsDeleted = 0 AND item.ItemType <> 'Tip'
      WHERE gift.DonationCampaignId = ${campaignIdSql(campaign.uniqueId)};
    `),
  );

const throughFundraisersFromTheDatabase = (): number =>
  Number(
    querySingleValue(`
      SELECT ISNULL(SUM(item.LineTotal), 0)
      FROM DonationCampaignInvoice gift
      INNER JOIN Invoice invoice
        ON invoice.Id = gift.InvoiceId AND invoice.IsDeleted = 0 AND invoice.InvoiceStatus = 'Paid'
      INNER JOIN InvoiceItem item
        ON item.InvoiceId = invoice.Id AND item.IsDeleted = 0 AND item.ItemType <> 'Tip'
      WHERE gift.DonationCampaignId = ${campaignIdSql(campaign.uniqueId)}
        AND gift.CampaignFundraiserId IS NOT NULL;
    `),
  );

const probePageUniqueId = (): string =>
  querySingleValue(`
    SELECT CAST(UniqueId AS VARCHAR(40)) FROM CampaignFundraiser
    WHERE DonationCampaignId = ${campaignIdSql(campaign.uniqueId)}
      AND Slug = '${PROBE_PAGE_SLUG}' AND IsDeleted = 0;
  `);

const probeTeamUniqueId = (): string =>
  querySingleValue(`
    SELECT CAST(UniqueId AS VARCHAR(40)) FROM CampaignTeam
    WHERE DonationCampaignId = ${campaignIdSql(campaign.uniqueId)}
      AND Slug = '${PROBE_TEAM_SLUG}' AND IsDeleted = 0;
  `);

const probePageStatus = (): string =>
  querySingleValue(`
    SELECT CurrentStatus FROM CampaignFundraiser
    WHERE DonationCampaignId = ${campaignIdSql(campaign.uniqueId)}
      AND Slug = '${PROBE_PAGE_SLUG}' AND IsDeleted = 0;
  `);

const probeTeamIsHidden = (): string =>
  querySingleValue(`
    SELECT CAST(IsHidden AS VARCHAR(1)) FROM CampaignTeam
    WHERE DonationCampaignId = ${campaignIdSql(campaign.uniqueId)}
      AND Slug = '${PROBE_TEAM_SLUG}' AND IsDeleted = 0;
  `);

const auditRows = (): string[] =>
  query(`
    SELECT CAST(logEntry.Action AS VARCHAR(32)) + '|' + logEntry.SubjectName + '|' +
           CAST(logEntry.Subject AS VARCHAR(32)) + '|' + ISNULL(logEntry.Reason, '')
    FROM PeerToPeerModerationEntry logEntry
    WHERE logEntry.SubjectName LIKE 'E2E Moderation%'
    ORDER BY logEntry.Id;
  `);

const moderate = (fundraiserUniqueId: string, action: string, reason?: string) =>
  api.post(moderateFundraiserUrl(campaign.uniqueId, fundraiserUniqueId), {
    data: reason === undefined ? { action } : { action, reason },
  });

const moderateTheTeam = (teamUniqueId: string, action: string) =>
  api.post(moderateTeamUrl(campaign.uniqueId, teamUniqueId), { data: { action } });

test.beforeAll(async () => {
  api = await authenticatedApi(await signIn());
  anonymous = await anonymousApi();

  const current = await api.get(settingsUrl(campaign.uniqueId));
  expect(current.status()).toBe(200);
  originalSettings = (await current.json()).data;

  const enabled = await api.post(settingsUrl(campaign.uniqueId), {
    data: {
      isPeerToPeerEnabled: true,
      defaultPersonalGoal: 250,
      allowTeams: true,
      requiresApproval: false,
      leaderboardVisibility: 'Public',
    },
  });
  expect(enabled.status()).toBe(200);

  campaignSlug = (await (await api.get(settingsUrl(campaign.uniqueId))).json()).data.peerToPeerSlug;

  removeProbeData();
});

test.afterAll(async () => {
  removeProbeData();

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
  await anonymous.dispose();
});

test.beforeEach(() => {
  removeProbeData();
});

test.describe('Reading what supporters published', () => {
  test('Fundraisers_NoToken_IsRefusedWithoutSayingWhetherTheCampaignExists', async () => {
    const response = await anonymous.get(moderatedFundraisersUrl(campaign.uniqueId));

    expect(response.status()).toBe(401);
    expect(await response.text()).not.toContain(campaign.name);
  });

  test('Fundraisers_ForgedToken_IsRefused', async () => {
    const forged = await authenticatedApi('not-a-real-token');
    const response = await forged.get(moderatedFundraisersUrl(campaign.uniqueId));

    expect(response.status()).toBe(401);

    await forged.dispose();
  });

  test('Fundraisers_CampaignIdentifierThatWasNeverIssued_IsRefusedWithTheSameSentence', async () => {
    const response = await api.get(
      moderatedFundraisersUrl('00000000-0000-0000-0000-000000000000'),
    );

    expect(response.status()).toBe(400);
    expect((await response.json()).message).toBe('Campaign not found.');
  });

  test('Fundraisers_PagesOnTheCampaign_CarryWhatEachRaisedAndItsStatus', async () => {
    insertProbePage('Active');
    insertGift(120, 15);

    const response = await api.get(moderatedFundraisersUrl(campaign.uniqueId), {
      params: { page: 1, pageSize: 100, search: 'E2E Moderation' },
    });

    expect(response.status()).toBe(200);

    const rows = (await response.json()).data.page.pageData;
    const mine = rows.find((row: { slug: string }) => row.slug === PROBE_PAGE_SLUG);

    expect(mine.displayName).toBe('E2E Moderation Page');
    expect(mine.currentStatus).toBe('Active');
    expect(mine.raisedAmount).toBe(120);
    expect(mine.donorCount).toBe(1);
  });

  test('Fundraisers_Loaded_ReportsTheTwoTotalsExactlyAsTheDatabaseHoldsThem', async () => {
    insertProbePage('Active');
    insertGift(200);
    insertGift(500, 0, false);

    const response = await api.get(moderatedFundraisersUrl(campaign.uniqueId), {
      params: { page: 1, pageSize: 100 },
    });

    const totals = (await response.json()).data.totals;

    expect(totals.raisedInTotal).toBe(campaignTotalFromTheDatabase());
    expect(totals.raisedThroughFundraisers).toBe(throughFundraisersFromTheDatabase());
    expect(totals.raisedThroughFundraisers).toBeLessThanOrEqual(totals.raisedInTotal);
  });

  test('Fundraisers_PageSizeBeyondWhatIsAllowed_IsClampedRatherThanHonoured', async () => {
    const response = await api.get(moderatedFundraisersUrl(campaign.uniqueId), {
      params: { page: 0, pageSize: 100000 },
    });

    const page = (await response.json()).data.page;

    expect(page.pageNo).toBe(1);
    expect(page.pageSize).toBe(20);
  });

  test('Fundraiser_PageOnAnotherCampaign_IsRefusedWithoutConfirmingItExists', async () => {
    insertProbePage('Active');

    const response = await api.get(
      moderatedFundraiserUrl(otherCampaign.uniqueId, probePageUniqueId()),
    );

    expect(response.status()).toBe(400);
    expect((await response.json()).message).toBe('Fundraising page not found.');
  });
});

test.describe('Taking a page down and putting it back', () => {
  test('Approve_PageThatWasWaiting_PutsItLiveAndLetsThePublicAddressWork', async () => {
    insertProbePage('PendingApproval');

    const beforeApproval = await anonymous.get(fundraiserPageUrl(campaignSlug, PROBE_PAGE_SLUG));
    expect((await beforeApproval.json()).data.state).toBe('AwaitingApproval');

    const response = await moderate(probePageUniqueId(), 'Approve');
    expect(response.status()).toBe(200);
    expect(probePageStatus()).toBe('Active');

    const afterApproval = await anonymous.get(fundraiserPageUrl(campaignSlug, PROBE_PAGE_SLUG));
    expect((await afterApproval.json()).data.state).toBe('Available');
  });

  test('Hide_LivePage_TakesItOffThePublicSiteWithoutDeletingIt', async () => {
    insertProbePage('Active');
    insertGift(75);

    const response = await moderate(probePageUniqueId(), 'Hide', 'Wrong photo');
    expect(response.status()).toBe(200);
    expect(probePageStatus()).toBe('Paused');

    const publicPage = await anonymous.get(fundraiserPageUrl(campaignSlug, PROBE_PAGE_SLUG));
    expect((await publicPage.json()).data.state).toBe('Closed');
  });

  test('Unhide_HiddenPage_BringsItBackWithItsMoneyIntact', async () => {
    insertProbePage('Active');
    insertGift(90);

    await moderate(probePageUniqueId(), 'Hide');
    const response = await moderate(probePageUniqueId(), 'Unhide');

    expect(response.status()).toBe(200);
    expect(probePageStatus()).toBe('Active');

    const detail = await api.get(moderatedFundraiserUrl(campaign.uniqueId, probePageUniqueId()));
    expect((await detail.json()).data.raisedAmount).toBe(90);
  });

  test('Hide_PageThatIsAlreadyHidden_IsRefusedAndWritesNoSecondAuditRow', async () => {
    insertProbePage('Paused');

    const response = await moderate(probePageUniqueId(), 'Hide');

    expect(response.status()).toBe(400);
    expect((await response.json()).message).toBe('This page is already hidden.');
    expect(auditRows()).toHaveLength(0);
  });

  test('Moderate_ReasonLongerThanTheColumnHolds_IsRefusedBeforeAnythingIsWritten', async () => {
    insertProbePage('Active');

    const response = await moderate(probePageUniqueId(), 'Hide', 'x'.repeat(501));

    expect(response.status()).toBe(400);
    expect((await response.json()).message).toBe('Keep the reason to 500 characters or fewer.');
    expect(probePageStatus()).toBe('Active');
    expect(auditRows()).toHaveLength(0);
  });

  test('Moderate_PageAddressedThroughAnotherCampaign_IsRefusedAndChangesNothing', async () => {
    insertProbePage('Active');

    const response = await api.post(
      moderateFundraiserUrl(otherCampaign.uniqueId, probePageUniqueId()),
      { data: { action: 'Hide' } },
    );

    expect(response.status()).toBe(400);
    expect((await response.json()).message).toBe('Fundraising page not found.');
    expect(probePageStatus()).toBe('Active');
  });

  test('Moderate_NoToken_IsRefusedAndChangesNothing', async () => {
    insertProbePage('Active');

    const response = await anonymous.post(
      moderateFundraiserUrl(campaign.uniqueId, probePageUniqueId()),
      { data: { action: 'Hide' } },
    );

    expect(response.status()).toBe(401);
    expect(probePageStatus()).toBe('Active');
  });

  test('Moderate_DecisionTaken_LeavesATrailSayingWhoWhatAndWhy', async () => {
    insertProbePage('Active');

    await moderate(probePageUniqueId(), 'Hide', 'Unacceptable wording');

    expect(auditRows()).toEqual(['Hide|E2E Moderation Page|Fundraiser|Unacceptable wording']);
  });

  test('Moderate_TwoDecisionsInARow_AreBothOnRecordInOrder', async () => {
    insertProbePage('PendingApproval');

    await moderate(probePageUniqueId(), 'Reject', 'Not this year');
    await moderate(probePageUniqueId(), 'Approve', 'Appealed');

    expect(auditRows()).toEqual([
      'Reject|E2E Moderation Page|Fundraiser|Not this year',
      'Approve|E2E Moderation Page|Fundraiser|Appealed',
    ]);
  });

  test('Detail_AfterADecision_ReadsTheTrailBackWithTheNameOfWhoeverTookIt', async () => {
    insertProbePage('Active');

    await moderate(probePageUniqueId(), 'Hide', 'Wrong photo');

    const detail = await api.get(moderatedFundraiserUrl(campaign.uniqueId, probePageUniqueId()));
    const history = (await detail.json()).data.history;

    expect(history).toHaveLength(1);
    expect(history[0].action).toBe('Hide');
    expect(history[0].reason).toBe('Wrong photo');
    expect(String(history[0].actedByName).length).toBeGreaterThan(0);
  });
});

test.describe('Taking a team down and putting it back', () => {
  test('Teams_HiddenTeam_IsVisibleToTheCharityAndNowhereElse', async () => {
    insertProbePage('Active');
    insertProbeTeam(1);

    const oversight = await api.get(moderatedTeamsUrl(campaign.uniqueId), {
      params: { page: 1, pageSize: 100, search: 'E2E Moderation' },
    });
    const rows = (await oversight.json()).data.page.pageData;

    expect(rows.some((row: { slug: string }) => row.slug === PROBE_TEAM_SLUG)).toBe(true);

    const browse = await anonymous.get(teamsUrl(campaignSlug));
    const browsed = (await browse.json()).data.teams;

    expect(browsed.some((row: { slug: string }) => row.slug === PROBE_TEAM_SLUG)).toBe(false);
  });

  test('TeamPage_HiddenTeam_GivesTheSameAnswerAsAnAddressThatNeverExisted', async () => {
    insertProbePage('Active');
    insertProbeTeam(1);

    const hidden = await anonymous.get(teamUrl(campaignSlug, PROBE_TEAM_SLUG));
    const invented = await anonymous.get(teamUrl(campaignSlug, 'no-such-team-at-all'));

    expect(hidden.status()).toBe(invented.status());
    expect((await hidden.json()).message).toBe((await invented.json()).message);
  });

  test('HideTeam_VisibleTeam_TakesItOffBrowsingAndLeavesTheMemberPagesLive', async () => {
    insertProbePage('Active');
    insertProbeTeam(0);

    const response = await moderateTheTeam(probeTeamUniqueId(), 'Hide');

    expect(response.status()).toBe(200);
    expect(probeTeamIsHidden()).toBe('1');
    expect(probePageStatus()).toBe('Active');

    const publicPage = await anonymous.get(fundraiserPageUrl(campaignSlug, PROBE_PAGE_SLUG));
    expect((await publicPage.json()).data.state).toBe('Available');
  });

  test('UnhideTeam_HiddenTeam_ReturnsItToBrowsingWithItsTotalUnchanged', async () => {
    insertProbePage('Active');
    insertProbeTeam(1);
    insertGift(60);

    const response = await moderateTheTeam(probeTeamUniqueId(), 'Unhide');
    expect(response.status()).toBe(200);

    const browse = await anonymous.get(teamsUrl(campaignSlug));
    const mine = (await browse.json()).data.teams.find(
      (row: { slug: string }) => row.slug === PROBE_TEAM_SLUG,
    );

    expect(mine.raisedAmount).toBe(60);
  });

  test('ModerateTeam_AskedToApprove_IsRefusedBecauseTeamsNeverWaitForApproval', async () => {
    insertProbePage('Active');
    insertProbeTeam(0);

    const response = await moderateTheTeam(probeTeamUniqueId(), 'Approve');

    expect(response.status()).toBe(400);
    expect((await response.json()).message).toBe(
      'Teams do not go through approval. A team can be hidden or brought back.',
    );
    expect(probeTeamIsHidden()).toBe('0');
  });

  test('ModerateTeam_TeamAddressedThroughAnotherCampaign_IsRefusedAndLeavesItVisible', async () => {
    insertProbePage('Active');
    insertProbeTeam(0);

    const response = await api.post(
      moderateTeamUrl(otherCampaign.uniqueId, probeTeamUniqueId()),
      { data: { action: 'Hide' } },
    );

    expect(response.status()).toBe(400);
    expect((await response.json()).message).toBe('Team not found.');
    expect(probeTeamIsHidden()).toBe('0');
  });

  test('ModerateTeam_NoToken_IsRefusedAndChangesNothing', async () => {
    insertProbePage('Active');
    insertProbeTeam(0);

    const response = await anonymous.post(
      moderateTeamUrl(campaign.uniqueId, probeTeamUniqueId()),
      { data: { action: 'Hide' } },
    );

    expect(response.status()).toBe(401);
    expect(probeTeamIsHidden()).toBe('0');
  });

  test('TeamDetail_TeamOnThisCampaign_NamesItsMembersAndWhatEachRaised', async () => {
    insertProbePage('Active');
    insertProbeTeam(0);
    insertGift(45);

    const response = await api.get(moderatedTeamUrl(campaign.uniqueId, probeTeamUniqueId()));
    const detail = (await response.json()).data;

    expect(response.status()).toBe(200);
    expect(detail.members).toHaveLength(1);
    expect(detail.members[0].displayName).toBe('E2E Moderation Page');
    expect(detail.members[0].raisedAmount).toBe(45);
    expect(detail.raisedAmount).toBe(45);
  });

  test('TeamDetail_AfterADecision_ReadsTheTrailBackAgainstTheTeamRatherThanAPage', async () => {
    insertProbePage('Active');
    insertProbeTeam(0);

    await moderateTheTeam(probeTeamUniqueId(), 'Hide');

    const response = await api.get(moderatedTeamUrl(campaign.uniqueId, probeTeamUniqueId()));
    const history = (await response.json()).data.history;

    expect(history).toHaveLength(1);
    expect(history[0].subject).toBe('Team');
    expect(history[0].subjectName).toBe('E2E Moderation Team');
  });
});
