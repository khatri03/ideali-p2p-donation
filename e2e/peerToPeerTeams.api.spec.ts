import { APIRequestContext, expect, test } from '@playwright/test';
import {
  anonymousApi,
  authenticatedApi,
  fundraiserPageUrl,
  joinUrl,
  settingsUrl,
  signIn,
  teamCaptainUrl,
  teamMembersUrl,
  teamUrl,
  teamsUrl,
} from './support/apiSession';
import { liveCampaign } from './support/campaignFixtures';
import { execute, query, querySingleValue } from './support/database';
import { clearFundraiserPages, restoreFundraiserPages } from './support/fundraiserPages';
import { PROBE_LIFECYCLE_TRAIL_SQL } from './support/fundraiserPages';

/**
 * The team endpoints against the real database. Two things are proved here that no unit test can:
 * that a team total is the sum of the member pages read back out of the tables by hand, and that the
 * campaign total is unchanged by any of it - a gift belongs to one fundraiser and is never credited a
 * second time because a team exists.
 *
 * Everything this suite writes carries the probe tag and is deleted afterwards.
 */

const campaign = liveCampaign();
const PROBE_TAG = 'e2e-team';
const SECOND_MEMBER_SLUG = 'e2e-team-second-member';

let api: APIRequestContext;
let anonymous: APIRequestContext;
let campaignSlug: string;
let captainSlug: string;
let originalSettings: Record<string, unknown>;

const enabledSettings = (allowTeams: boolean) => ({
  isPeerToPeerEnabled: true,
  defaultPersonalGoal: 250,
  allowTeams,
  requiresApproval: false,
  leaderboardVisibility: 'Public',
});

/** Removes only what this suite created, keyed on the campaign under test and the probe tag. */
const removeProbeData = (): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');

    DECLARE @invoiceIds TABLE (Id INT);
    INSERT INTO @invoiceIds SELECT Id FROM Invoice WHERE CreatedBy = '${PROBE_TAG}';

    DELETE FROM InvoiceItem WHERE InvoiceId IN (SELECT Id FROM @invoiceIds);
    DELETE FROM DonationCampaignInvoice WHERE InvoiceId IN (SELECT Id FROM @invoiceIds);
    DELETE FROM Invoice WHERE Id IN (SELECT Id FROM @invoiceIds);

    DELETE FROM CampaignTeamMember
    WHERE CampaignTeamId IN (SELECT Id FROM CampaignTeam WHERE DonationCampaignId = @campaignId);

    DELETE FROM CampaignTeam WHERE DonationCampaignId = @campaignId;

    ${PROBE_LIFECYCLE_TRAIL_SQL}

    DELETE FROM CampaignFundraiser
    WHERE DonationCampaignId = @campaignId AND CreatedBy = '${PROBE_TAG}';
  `);

/** A second fundraising page belonging to somebody else, so a team can hold more than one person. */
const insertSecondFundraiser = (): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');
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
      (NEWID(), 0, @organizerId, @campaignId, @userId, '${SECOND_MEMBER_SLUG}', 'E2E Second Member',
       NULL, 1000, 'Active', 0, '${PROBE_TAG}', SYSUTCDATETIME());
  `);

const insertGift = (fundraiserSlug: string, amount: number, tipAmount = 0): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');
    DECLARE @fundraiserId INT = (
      SELECT Id FROM CampaignFundraiser
      WHERE DonationCampaignId = @campaignId AND Slug = '${fundraiserSlug}' AND IsDeleted = 0
    );

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

/** Puts the second page into the team directly, because only its own owner could join through the API. */
const addSecondMemberToTeam = (teamSlug: string): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');
    DECLARE @teamId INT = (
      SELECT Id FROM CampaignTeam WHERE DonationCampaignId = @campaignId AND Slug = '${teamSlug}'
    );
    DECLARE @fundraiserId INT = (
      SELECT Id FROM CampaignFundraiser
      WHERE DonationCampaignId = @campaignId AND Slug = '${SECOND_MEMBER_SLUG}'
    );

    INSERT INTO CampaignTeamMember
      (UniqueId, CampaignTeamId, CampaignFundraiserId, JoinedOnUtc, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES (NEWID(), @teamId, @fundraiserId, SYSUTCDATETIME(), 0, '${PROBE_TAG}', SYSUTCDATETIME());
  `);

/** Hands captaincy to somebody else in the database, so the signed-in caller is a plain member. */
const takeCaptaincyAway = (teamSlug: string): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');

    UPDATE CampaignTeam
    SET CaptainUserId = (
      SELECT MIN(userAccount.Id) FROM [User] userAccount
      WHERE userAccount.Id <> CampaignTeam.CaptainUserId
    )
    WHERE DonationCampaignId = @campaignId AND Slug = '${teamSlug}';
  `);

const teamTotalFromTheDatabase = (teamSlug: string): number =>
  Number(
    querySingleValue(`
      DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');

      SELECT ISNULL(SUM(item.LineTotal), 0)
      FROM CampaignTeam team
      INNER JOIN CampaignTeamMember membership
        ON membership.CampaignTeamId = team.Id AND membership.IsDeleted = 0
      INNER JOIN DonationCampaignInvoice gift
        ON gift.CampaignFundraiserId = membership.CampaignFundraiserId
      INNER JOIN Invoice invoice
        ON invoice.Id = gift.InvoiceId AND invoice.IsDeleted = 0 AND invoice.InvoiceStatus = 'Paid'
      INNER JOIN InvoiceItem item
        ON item.InvoiceId = invoice.Id AND item.IsDeleted = 0 AND item.ItemType <> 'Tip'
      WHERE team.DonationCampaignId = @campaignId AND team.Slug = '${teamSlug}' AND team.IsDeleted = 0;
    `),
  );

const probeGiftRowCount = (): number =>
  Number(
    querySingleValue(`
      SELECT COUNT(*)
      FROM DonationCampaignInvoice gift
      INNER JOIN Invoice invoice ON invoice.Id = gift.InvoiceId
      WHERE invoice.CreatedBy = '${PROBE_TAG}';
    `),
  );

const liveTeamCount = (): number =>
  Number(
    querySingleValue(`
      SELECT COUNT(*) FROM CampaignTeam
      WHERE DonationCampaignId = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}')
        AND IsDeleted = 0;
    `),
  );

const CONSOLE_URL = '/api/member/my-fundraising';

/** The captain's own console entry, which is where the screen decides whether to offer a team at all. */
const readCaptainConsoleEntry = async () => {
  const response = await api.get(CONSOLE_URL);
  expect(response.status()).toBe(200);

  return (await response.json()).data.find(
    (page: { slug: string }) => page.slug === captainSlug,
  );
};

const createTeam = async (name: string) =>
  api.post(teamsUrl(campaignSlug), { data: { name, story: 'Written by the e2e suite.', teamGoal: 5000 } });

const createTeamAndReadSlug = async (name: string): Promise<string> => {
  const response = await createTeam(name);
  expect(response.status()).toBe(200);

  return (await response.json()).data.slug;
};

test.beforeAll(async () => {
  api = await authenticatedApi(await signIn());
  anonymous = await anonymousApi();

  originalSettings = (await (await api.get(settingsUrl(campaign.uniqueId))).json()).data;

  clearFundraiserPages(campaign.uniqueId);
  removeProbeData();

  await api.post(settingsUrl(campaign.uniqueId), { data: enabledSettings(true) });

  campaignSlug = querySingleValue(`
    SELECT PeerToPeerSlug FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}';
  `);

  // The captain joins once for the whole file. Joining is rate limited on purpose, so a suite that
  // re-joined per test would be refused with 429 part way through and report a product fault that
  // does not exist. Teams are torn down per test instead, which leaves the page itself untouched.
  const joined = await api.post(joinUrl(campaign.uniqueId), {
    data: { displayName: 'E2E Team Captain', personalGoal: 400, story: null },
  });
  const rawBody = await joined.text();

  expect(joined.status(), rawBody || 'empty body').toBe(200);
  captainSlug = JSON.parse(rawBody).data.slug;
});

test.beforeEach(async () => {
  removeProbeData();

  await api.post(settingsUrl(campaign.uniqueId), { data: enabledSettings(true) });
});

test.afterAll(async () => {
  removeProbeData();
  restoreFundraiserPages();
  await api.post(settingsUrl(campaign.uniqueId), { data: originalSettings });
  await api.dispose();
  await anonymous.dispose();
});

test.describe('Team endpoints', () => {
  test('Browse_SignedOutVisitor_CanReadTheTeamsWithoutAToken', async () => {
    await createTeamAndReadSlug('E2E Visible Team');

    const response = await anonymous.get(teamsUrl(campaignSlug));

    expect(response.status()).toBe(200);
    expect((await response.json()).data.teams.some((team: { name: string }) => team.name === 'E2E Visible Team')).toBe(true);
  });

  test('Browse_AnonymousCaller_IsOfferedNothingToDoBecauseTheyFundraiseForNobody', async () => {
    const body = await (await anonymous.get(teamsUrl(campaignSlug))).json();

    expect(body.data.isFundraiser).toBe(false);
    expect(body.data.myTeamSlug).toBeNull();
  });

  test('Browse_AnyResponse_CarriesNoEmailAddressAndNoUserIdentifier', async () => {
    await createTeamAndReadSlug('E2E Quiet Team');

    const raw = await (await anonymous.get(teamsUrl(campaignSlug))).text();

    expect(raw.toLowerCase()).not.toContain('userid');
    expect(raw.toLowerCase()).not.toContain('email');
  });

  test('Create_NoToken_IsRefusedBeforeAnythingIsWritten', async () => {
    const before = liveTeamCount();

    const response = await anonymous.post(teamsUrl(campaignSlug), {
      data: { name: 'E2E Team By A Stranger', story: null, teamGoal: null },
    });

    expect(response.status()).toBe(401);
    expect(liveTeamCount()).toBe(before);
  });

  test('Create_Fundraiser_BecomesTheCaptainAndTheFirstMember', async () => {
    const response = await createTeam('E2E Founding Team');

    expect(response.status()).toBe(200);

    const team = (await response.json()).data;
    expect(team.viewerRole).toBe('Captain');
    expect(team.members).toHaveLength(1);
    expect(team.members[0].isCaptain).toBe(true);
  });

  test('Create_SecondTeamByTheSamePerson_IsRefused', async () => {
    await createTeamAndReadSlug('E2E First Team');

    const response = await createTeam('E2E Second Team');

    expect(response.status()).not.toBe(200);
    expect((await response.json()).message).toBe('You are already in a team on this campaign.');
  });

  test('Create_BlankName_IsRefusedAndWritesNothing', async () => {
    const before = liveTeamCount();

    const response = await api.post(teamsUrl(campaignSlug), {
      data: { name: '   ', story: null, teamGoal: null },
    });

    expect(response.status()).not.toBe(200);
    expect(liveTeamCount()).toBe(before);
  });

  test('TeamPage_UnknownTeam_IsRefusedWithTheSameSentenceAsAnUnknownCampaign', async () => {
    const unknownTeam = await anonymous.get(teamUrl(campaignSlug, 'no-such-team'));
    const unknownCampaign = await anonymous.get(teamUrl('no-such-campaign', 'no-such-team'));

    expect(unknownTeam.status()).toBe(404);
    expect((await unknownTeam.json()).message).toBe('Team not found.');
    expect((await unknownCampaign.json()).message).toBe('Team not found.');
  });

  /** The phase gate, run rather than assumed: the sum is read back out of the tables by hand. */
  test('TeamTotal_TwoMembersRaising_MatchesTheSumReadBackFromTheDatabase', async () => {
    const teamSlug = await createTeamAndReadSlug('E2E Adding Up');

    insertSecondFundraiser();
    addSecondMemberToTeam(teamSlug);

    insertGift(captainSlug, 120, 15);
    insertGift(SECOND_MEMBER_SLUG, 80);

    const team = (await (await anonymous.get(teamUrl(campaignSlug, teamSlug))).json()).data;

    expect(team.raisedAmount).toBe(200);
    expect(team.raisedAmount).toBe(teamTotalFromTheDatabase(teamSlug));
    expect(team.donorCount).toBe(2);
  });

  /** A team is a view over the member pages: no gift row is written, moved or duplicated by one. */
  test('TeamTotal_GiftThroughAMemberPage_IsStillOneRowAttributedToThatOnePage', async () => {
    const teamSlug = await createTeamAndReadSlug('E2E No Double Count');

    insertSecondFundraiser();
    addSecondMemberToTeam(teamSlug);
    insertGift(SECOND_MEMBER_SLUG, 80);

    expect(probeGiftRowCount()).toBe(1);

    const attributions = query(`
      SELECT CAST(COUNT(*) AS VARCHAR(10))
      FROM DonationCampaignInvoice gift
      INNER JOIN Invoice invoice ON invoice.Id = gift.InvoiceId
      INNER JOIN CampaignFundraiser fundraiser ON fundraiser.Id = gift.CampaignFundraiserId
      WHERE invoice.CreatedBy = '${PROBE_TAG}' AND fundraiser.Slug = '${SECOND_MEMBER_SLUG}';
    `);

    expect(Number(attributions[0][0])).toBe(1);
  });

  test('RemoveMember_MemberWhoRaisedMoney_DropsTheTeamTotalAndLeavesTheirGiftWhereItWas', async () => {
    const teamSlug = await createTeamAndReadSlug('E2E Removing');

    insertSecondFundraiser();
    addSecondMemberToTeam(teamSlug);
    insertGift(SECOND_MEMBER_SLUG, 80);

    const before = (await (await api.get(teamUrl(campaignSlug, teamSlug))).json()).data;
    const membership = before.members.find(
      (member: { fundraiserSlug: string }) => member.fundraiserSlug === SECOND_MEMBER_SLUG,
    );

    const removed = await api.delete(`${teamMembersUrl(campaignSlug, teamSlug)}/${membership.uniqueId}`);

    expect(removed.status()).toBe(200);
    expect((await removed.json()).data.raisedAmount).toBe(0);
    expect(probeGiftRowCount()).toBe(1);
  });

  test('RemoveMember_Themselves_IsRefusedBecauseLeavingIsTheWayOut', async () => {
    const teamSlug = await createTeamAndReadSlug('E2E Self Removal');

    const team = (await (await api.get(teamUrl(campaignSlug, teamSlug))).json()).data;

    const response = await api.delete(
      `${teamMembersUrl(campaignSlug, teamSlug)}/${team.members[0].uniqueId}`,
    );

    expect(response.status()).not.toBe(200);
    expect((await response.json()).message).toBe('Leave the team instead of removing yourself.');
  });

  /** Captaincy is read from the team row on every write, never from a role claim or a menu item. */
  test('CaptainActions_PlainMember_AreEveryOneOfThemRefused', async () => {
    const teamSlug = await createTeamAndReadSlug('E2E Captain Only');

    insertSecondFundraiser();
    addSecondMemberToTeam(teamSlug);

    const team = (await (await api.get(teamUrl(campaignSlug, teamSlug))).json()).data;
    const otherMembership = team.members.find(
      (member: { fundraiserSlug: string }) => member.fundraiserSlug === SECOND_MEMBER_SLUG,
    );

    takeCaptaincyAway(teamSlug);

    const rename = await api.put(teamUrl(campaignSlug, teamSlug), {
      data: { name: 'E2E Renamed By A Member', story: null, teamGoal: null },
    });
    const remove = await api.delete(
      `${teamMembersUrl(campaignSlug, teamSlug)}/${otherMembership.uniqueId}`,
    );
    const handOver = await api.post(
      teamCaptainUrl(campaignSlug, teamSlug, otherMembership.uniqueId),
      { data: {} },
    );

    for (const response of [rename, remove, handOver]) {
      expect(response.status()).not.toBe(200);
      expect((await response.json()).message).toBe('Only the team captain can do that.');
    }
  });

  test('CaptainActions_PlainMemberRefused_ChangedNothingInTheDatabase', async () => {
    const teamSlug = await createTeamAndReadSlug('E2E Untouched');

    takeCaptaincyAway(teamSlug);

    await api.put(teamUrl(campaignSlug, teamSlug), {
      data: { name: 'E2E Renamed By A Member', story: null, teamGoal: null },
    });

    const storedName = querySingleValue(`
      SELECT Name FROM CampaignTeam
      WHERE DonationCampaignId = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}')
        AND Slug = '${teamSlug}';
    `);

    expect(storedName).toBe('E2E Untouched');
  });

  test('Leave_LastMember_ClosesTheTeamAndItsAddressAnswersNotFound', async () => {
    const teamSlug = await createTeamAndReadSlug('E2E Last One Out');

    const left = await api.delete(`${teamMembersUrl(campaignSlug, teamSlug)}/me`);
    expect(left.status()).toBe(200);

    const afterwards = await anonymous.get(teamUrl(campaignSlug, teamSlug));

    expect(afterwards.status()).toBe(404);
    expect((await afterwards.json()).message).toBe('Team not found.');
  });

  test('Leave_LastMember_LeavesEveryGiftTheCampaignBankedExactlyWhereItWas', async () => {
    const teamSlug = await createTeamAndReadSlug('E2E Money Stays');

    insertGift(captainSlug, 60);
    const before = probeGiftRowCount();

    await api.delete(`${teamMembersUrl(campaignSlug, teamSlug)}/me`);

    expect(probeGiftRowCount()).toBe(before);
  });

  test('TeamsSwitchedOff_NewTeam_IsRefused', async () => {
    await api.post(settingsUrl(campaign.uniqueId), { data: enabledSettings(false) });

    const response = await createTeam('E2E Team While Off');

    expect(response.status()).not.toBe(200);
    expect((await response.json()).message).toBe('This campaign is not using fundraising teams.');
  });

  test('TeamsSwitchedOff_TeamsThatAlreadyExist_StayReadableRatherThanDisappearing', async () => {
    const teamSlug = await createTeamAndReadSlug('E2E Still Here');

    await api.post(settingsUrl(campaign.uniqueId), { data: enabledSettings(false) });

    const response = await anonymous.get(teamUrl(campaignSlug, teamSlug));

    expect(response.status()).toBe(200);

    const team = (await response.json()).data;
    expect(team.name).toBe('E2E Still Here');
    expect(team.areTeamsAllowed).toBe(false);
  });

  test('TeamsSwitchedOff_Joining_IsRefusedToo', async () => {
    const teamSlug = await createTeamAndReadSlug('E2E Closed Doors');

    await api.post(settingsUrl(campaign.uniqueId), { data: enabledSettings(false) });

    const response = await api.post(teamMembersUrl(campaignSlug, teamSlug), { data: {} });

    expect(response.status()).not.toBe(200);
  });

  test('Console_FundraiserInATeam_CarriesTheTeamSoTheScreenCanLinkToIt', async () => {
    const teamSlug = await createTeamAndReadSlug('E2E Console Linked Team');

    const entry = await readCaptainConsoleEntry();

    expect(entry.areTeamsAllowed).toBe(true);
    expect(entry.myTeam).toEqual({ slug: teamSlug, name: 'E2E Console Linked Team' });
  });

  test('Console_FundraiserInNoTeam_CarriesNoTeamButStillSaysOneCanBeStarted', async () => {
    const entry = await readCaptainConsoleEntry();

    expect(entry.areTeamsAllowed).toBe(true);
    expect(entry.myTeam).toBeNull();
  });

  test('Console_TeamsSwitchedOff_SaysSoSoTheConsoleOffersNoWayIn', async () => {
    await api.post(settingsUrl(campaign.uniqueId), { data: enabledSettings(false) });

    const entry = await readCaptainConsoleEntry();

    expect(entry.areTeamsAllowed).toBe(false);
  });

  test('Console_TeamDisbanded_StopsNamingItRatherThanLinkingToNothing', async () => {
    const teamSlug = await createTeamAndReadSlug('E2E Console Doomed Team');

    const left = await api.delete(`${teamMembersUrl(campaignSlug, teamSlug)}/me`);
    expect(left.status()).toBe(200);

    expect((await readCaptainConsoleEntry()).myTeam).toBeNull();
  });

  test('PublicPage_FundraiserInATeam_NamesTheTeamToAnybodyWithTheAddress', async () => {
    const teamSlug = await createTeamAndReadSlug('E2E Publicly Named Team');

    const response = await anonymous.get(fundraiserPageUrl(campaignSlug, captainSlug));

    expect(response.status()).toBe(200);
    expect((await response.json()).data.team).toEqual({
      slug: teamSlug,
      name: 'E2E Publicly Named Team',
    });
  });

  test('PublicPage_FundraiserInNoTeam_NamesNoTeam', async () => {
    const response = await anonymous.get(fundraiserPageUrl(campaignSlug, captainSlug));

    expect((await response.json()).data.team).toBeNull();
  });

  test('PublicPage_TeamNamedOnIt_StillCarriesNoEmailAddressOrUserIdentifier', async () => {
    await createTeamAndReadSlug('E2E Publicly Quiet Team');

    const raw = await (await anonymous.get(fundraiserPageUrl(campaignSlug, captainSlug))).text();

    expect(raw.toLowerCase()).not.toContain('userid');
    expect(raw.toLowerCase()).not.toContain('@yopmail');
  });

  test('Create_ForgedToken_IsRefusedWithoutRevealingWhetherTheCampaignExists', async () => {
    const forged = await authenticatedApi('not.a.real.token');

    const response = await forged.post(teamsUrl(campaignSlug), {
      data: { name: 'E2E Forged', story: null, teamGoal: null },
    });

    expect(response.status()).toBe(401);
    await forged.dispose();
  });
});
