import { Locator, expect, test } from '@playwright/test';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';
import { e2eEnv } from './support/e2eEnv';
import { PROBE_LIFECYCLE_TRAIL_SQL } from './support/fundraiserPages';

/**
 * The team screens at desktop, tablet and 375px. The public surfaces are exercised signed out, because
 * a donor following a shared team link never holds an account; the captain screen is exercised signed
 * in as the account that owns the captain page.
 *
 * The team and its pages are inserted directly and removed afterwards: what is under test is what a
 * person sees and can do, not how the rows came to exist.
 */

const campaign = liveCampaign();
const PROBE_TAG = 'e2e-team-ui';
const TEAM_SLUG = 'e2e-team-ui-probe';
const TEAM_NAME = 'E2E Early Risers';
const TEAM_STORY = 'We run before work. <script>alert(1)</script>';
const CAPTAIN_SLUG = 'e2e-team-ui-captain';
const CAPTAIN_NAME = 'E2E Team Captain';
const MEMBER_SLUG = 'e2e-team-ui-member';
const MEMBER_NAME = 'E2E Team Member';

let campaignSlug: string;
let signedInUserId: string;

const browsePath = () => `/campaigns/${campaignSlug}/teams`;
const teamPath = () => `/campaigns/${campaignSlug}/teams/${TEAM_SLUG}`;
const managePath = () => `${teamPath()}/members`;

const removeProbeData = (): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');

    ${PROBE_LIFECYCLE_TRAIL_SQL}

    DELETE FROM CampaignTeamMember WHERE CreatedBy = '${PROBE_TAG}';
    DELETE FROM CampaignTeam WHERE DonationCampaignId = @campaignId AND CreatedBy = '${PROBE_TAG}';
    DELETE FROM CampaignFundraiser
    WHERE DonationCampaignId = @campaignId AND CreatedBy = '${PROBE_TAG}';
  `);

const setTeamsAllowed = (allowTeams: 0 | 1): void =>
  execute(`
    UPDATE DonationCampaign
    SET IsPeerToPeerEnabled = 1,
        PeerToPeerAllowTeams = ${allowTeams},
        PeerToPeerSlug = ISNULL(PeerToPeerSlug, 'e2e-campaign-' + CAST(Id AS VARCHAR(10)))
    WHERE UniqueId = '${campaign.uniqueId}';
  `);

/** One team with a captain and a second member, both raising, so the total has something to add up. */
const insertTeamWithTwoMembers = (captainUserId: string): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);
    DECLARE @otherUserId INT = (SELECT MIN(Id) FROM [User] WHERE Id <> ${captainUserId});

    INSERT INTO CampaignFundraiser
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, UserId, Slug, DisplayName, Story,
       PersonalGoal, CurrentStatus, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId, ${captainUserId}, '${CAPTAIN_SLUG}', '${CAPTAIN_NAME}',
       NULL, 500, 'Active', 0, '${PROBE_TAG}', SYSUTCDATETIME()),
      (NEWID(), 0, @organizerId, @campaignId, @otherUserId, '${MEMBER_SLUG}', '${MEMBER_NAME}',
       NULL, 500, 'Active', 0, '${PROBE_TAG}', SYSUTCDATETIME());

    INSERT INTO CampaignTeam
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, CaptainUserId, Slug, Name, Story,
       TeamGoal, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId, ${captainUserId}, '${TEAM_SLUG}', '${TEAM_NAME}',
       '${TEAM_STORY.replace(/'/g, "''")}', 1000, 0, '${PROBE_TAG}', SYSUTCDATETIME());

    DECLARE @teamId INT = (
      SELECT Id FROM CampaignTeam
      WHERE DonationCampaignId = @campaignId AND Slug = '${TEAM_SLUG}'
    );

    INSERT INTO CampaignTeamMember
      (UniqueId, CampaignTeamId, CampaignFundraiserId, JoinedOnUtc, IsDeleted, CreatedBy, CreatedOnUtc)
    SELECT NEWID(), @teamId, fundraiser.Id, SYSUTCDATETIME(), 0, '${PROBE_TAG}', SYSUTCDATETIME()
    FROM CampaignFundraiser fundraiser
    WHERE fundraiser.DonationCampaignId = @campaignId AND fundraiser.CreatedBy = '${PROBE_TAG}';
  `);

/** The captain's own fundraising page with no team, so the console has a fundraiser but nothing joined. */
const insertCaptainPageOnly = (captainUserId: string): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);

    INSERT INTO CampaignFundraiser
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, UserId, Slug, DisplayName, Story,
       PersonalGoal, CurrentStatus, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId, ${captainUserId}, '${CAPTAIN_SLUG}', '${CAPTAIN_NAME}',
       NULL, 500, 'Active', 0, '${PROBE_TAG}', SYSUTCDATETIME());
  `);

const takeCaptaincyAway = (): void =>
  execute(`
    UPDATE CampaignTeam
    SET CaptainUserId = (SELECT MIN(Id) FROM [User] WHERE Id <> ${signedInUserId})
    WHERE Slug = '${TEAM_SLUG}' AND CreatedBy = '${PROBE_TAG}';
  `);

const horizontalOverflow = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.beforeAll(() => {
  setTeamsAllowed(1);

  campaignSlug = querySingleValue(`
    SELECT PeerToPeerSlug FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}';
  `);

  signedInUserId = querySingleValue(`
    SELECT CAST(Id AS VARCHAR(20)) FROM [User]
    WHERE UserName = '${e2eEnv.organizerUsername.replace(/'/g, "''")}';
  `);

  removeProbeData();
});

test.afterEach(() => {
  removeProbeData();
  setTeamsAllowed(1);
});

test.describe('Team screens a stranger can open', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Browse_TeamsOnTheCampaign_ListsEachWithItsStandingAndSize', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(browsePath());

    await expect(page.getByRole('heading', { level: 1, name: 'Fundraising teams' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: TEAM_NAME })).toBeVisible();
    await expect(page.getByText('2 fundraisers').first()).toBeVisible();
  });

  test('Browse_NoTeamsYet_ShowsTheDesignedEmptyStateRatherThanABlankArea', async ({ page }) => {
    await page.goto(browsePath());

    await expect(page.getByRole('heading', { name: 'No teams yet' })).toBeVisible();
    await expect(page.getByText(/Be the first to start one/i)).toBeVisible();
  });

  test('Browse_Stranger_IsOfferedNeitherJoiningNorStartingATeam', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(browsePath());
    await expect(page.getByRole('heading', { level: 3, name: TEAM_NAME })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Join this team' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Start a team' })).toHaveCount(0);
  });

  test('Browse_TeamsSwitchedOff_ExplainsWhyAndStillListsTheTeamsThatExist', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);
    setTeamsAllowed(0);

    await page.goto(browsePath());

    await expect(page.getByText(/is not using teams/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: TEAM_NAME })).toBeVisible();
  });

  test('Browse_SearchThatMatchesNothing_ShowsADesignedNoticeWithAWayToClearIt', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(browsePath());
    await expect(page.getByRole('heading', { level: 3, name: TEAM_NAME })).toBeVisible();

    await page.getByLabel('Search teams').fill('nothing matches this');

    await expect(page.getByRole('heading', { name: 'No team matches that search' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear search' })).toBeVisible();
  });

  test('TeamPage_Opened_ShowsTheCombinedTotalAndEveryMemberWithTheirOwnTotal', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(teamPath());

    await expect(page.getByRole('heading', { level: 1, name: TEAM_NAME })).toBeVisible();
    await expect(page.getByText(CAPTAIN_NAME).first()).toBeVisible();
    await expect(page.getByText(MEMBER_NAME).first()).toBeVisible();
  });

  test('TeamPage_StoryWithMarkup_IsShownAsTextRatherThanExecuted', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    let dialogAppeared = false;
    page.on('dialog', async (dialog) => {
      dialogAppeared = true;
      await dialog.dismiss();
    });

    await page.goto(teamPath());

    await expect(page.getByText('<script>alert(1)</script>', { exact: false })).toBeVisible();
    expect(dialogAppeared).toBe(false);
  });

  test('TeamPage_AnyVisitor_SeesNoEmailAddressAnywhereInTheSource', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(teamPath());
    await expect(page.getByRole('heading', { level: 1, name: TEAM_NAME })).toBeVisible();

    expect((await page.content()).toLowerCase()).not.toContain('@yopmail');
  });

  /** A team is not a payee: the donor is asked who to support and goes down the existing donate route. */
  test('TeamPage_DonatePressed_AsksWhoToSupportAndOpensThatFundraisersDonateScreen', async ({
    page,
  }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(teamPath());
    await page.getByRole('button', { name: 'Donate to a team member' }).click();

    await expect(page.getByText('Choose who to support')).toBeVisible();

    await page.getByRole('button', { name: `Donate to ${MEMBER_NAME}` }).click();

    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignSlug}/${MEMBER_SLUG}/donate$`));
  });

  test('TeamPage_TeamThatWasClosed_ShowsADesignedNoticeRatherThanABrokenPage', async ({ page }) => {
    await page.goto(teamPath());

    await expect(page.getByRole('heading', { name: 'This team is not here' })).toBeVisible();
    await expect(page.getByText(/closed the team/i)).toBeVisible();
  });

  test('TeamPage_Stranger_IsOfferedNeitherManagementNorLeaving', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(teamPath());
    await expect(page.getByRole('heading', { level: 1, name: TEAM_NAME })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Manage team' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Leave this team' })).toHaveCount(0);
  });

  test('Browse_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(browsePath());
    await expect(page.getByRole('heading', { level: 3, name: TEAM_NAME })).toBeVisible();

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test('TeamPage_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(teamPath());
    await expect(page.getByRole('heading', { level: 1, name: TEAM_NAME })).toBeVisible();

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test('TeamPage_EveryControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(teamPath());

    const donate = await page.getByRole('button', { name: 'Donate to a team member' }).boundingBox();
    const copyLink = await page.getByRole('button', { name: 'Copy link' }).boundingBox();

    expect(donate?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(copyLink?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Team screens the captain opens', () => {
  test('Manage_OpenedByTheCaptain_ListsTheMembersWithTheirActions', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(managePath());

    await expect(page.getByRole('heading', { level: 1, name: 'Manage this team' })).toBeVisible();
    await expect(page.getByRole('button', { name: `Remove: ${MEMBER_NAME}` })).toBeVisible();
    await expect(page.getByRole('button', { name: `Make captain: ${MEMBER_NAME}` })).toBeVisible();
  });

  test('Manage_Captain_IsOfferedNoActionAgainstThemselves', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(managePath());
    await expect(page.getByRole('heading', { level: 1, name: 'Manage this team' })).toBeVisible();

    await expect(page.getByRole('button', { name: `Remove: ${CAPTAIN_NAME}` })).toHaveCount(0);
  });

  test('Remove_Pressed_NamesThePersonAndSaysTheirOwnMoneyIsUnaffected', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(managePath());
    await page.getByRole('button', { name: `Remove: ${MEMBER_NAME}` }).click();

    await expect(page.getByText(`Remove ${MEMBER_NAME} from the team?`)).toBeVisible();
    await expect(page.getByText(/keeps their fundraising page and every donation on it/i)).toBeVisible();
  });

  test('Remove_Confirmed_TakesThemOutOfTheTeamOnScreen', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(managePath());
    await page.getByRole('button', { name: `Remove: ${MEMBER_NAME}` }).click();
    await page.getByRole('button', { name: 'Yes, remove' }).click();

    await expect(page.getByRole('button', { name: `Remove: ${MEMBER_NAME}` })).toHaveCount(0);
    await expect(page.getByText('1 fundraiser', { exact: true }).first()).toBeVisible();
  });

  test('HandOver_Pressed_NamesThePersonTakingOverBeforeAnythingHappens', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(managePath());
    await page.getByRole('button', { name: `Make captain: ${MEMBER_NAME}` }).click();

    await expect(page.getByText(`Make ${MEMBER_NAME} the captain?`)).toBeVisible();
  });

  test('Edit_NameCleared_IsRefusedOnTheScreenBeforeAnythingIsSent', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(managePath());
    await page.getByLabel('Team name').fill('');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Enter a name for your team.')).toBeVisible();
  });

  test('Edit_SavedChange_ReachesThePublicTeamPage', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(managePath());
    await page.getByLabel('Team name').fill('E2E Renamed Team');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('The team is updated.')).toBeVisible();

    await page.goto(teamPath());
    await expect(page.getByRole('heading', { level: 1, name: 'E2E Renamed Team' })).toBeVisible();
  });

  /** Hiding is presentation; the server refuses these again. This proves the screen half of that. */
  test('Manage_OpenedBySomebodyWhoIsNotTheCaptain_ShowsADesignedRefusalWithNoBackendDetail', async ({
    page,
  }) => {
    insertTeamWithTwoMembers(signedInUserId);
    takeCaptaincyAway();

    await page.goto(managePath());

    await expect(
      page.getByRole('heading', { name: 'Only the team captain can open this' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: `Remove: ${MEMBER_NAME}` })).toHaveCount(0);
    expect(await page.content()).not.toContain('CaptainUserId');
  });

  test('Manage_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(managePath());
    await expect(page.getByRole('heading', { level: 1, name: 'Manage this team' })).toBeVisible();

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test('Manage_EveryControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(managePath());

    const remove = await page.getByRole('button', { name: `Remove: ${MEMBER_NAME}` }).boundingBox();
    const save = await page.getByRole('button', { name: 'Save changes' }).boundingBox();

    expect(remove?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(save?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});

/**
 * The teams surface is addressed by campaign slug, which nobody types. These prove a fundraiser reaches
 * it from the two places they already are: their own console, and their own public page.
 */
test.describe('Reaching a team without typing its address', () => {
  const consoleCard = (page: import('@playwright/test').Page) =>
    page.getByRole('region', { name: `${CAPTAIN_NAME} fundraising for ${campaign.name}` });


/**
 * The console groups a supporter's pages by campaign and only opens a section on its own when it is
 * the only one, so anything reading what is behind the disclosure opens it first.
 */
const openConsoleSection = async (card: Locator): Promise<void> => {
  const header = card.locator('button[aria-expanded]').first();

  if ((await header.getAttribute('aria-expanded')) === 'false') {
    await header.click();
  }

  await expect(header).toHaveAttribute('aria-expanded', 'true');
};

  test('Console_FundraiserWithNoTeam_ReachesTheTeamsScreenForThatCampaign', async ({ page }) => {
    insertCaptainPageOnly(signedInUserId);

    await page.goto('/member/my-fundraising');
    await openConsoleSection(consoleCard(page));
    await consoleCard(page).getByRole('button', { name: 'Find a team' }).click();

    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignSlug}/teams$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Fundraising teams' })).toBeVisible();
  });

  test('Console_FundraiserInATeam_NamesTheTeamAndOpensItDirectly', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto('/member/my-fundraising');
    await openConsoleSection(consoleCard(page));
    await consoleCard(page).getByRole('button', { name: `View team ${TEAM_NAME}` }).click();

    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignSlug}/teams/${TEAM_SLUG}$`));
    await expect(page.getByRole('heading', { level: 1, name: TEAM_NAME })).toBeVisible();
  });

  test('Console_CampaignNotFormingTeams_OffersNoTeamControlAtAll', async ({ page }) => {
    insertCaptainPageOnly(signedInUserId);
    setTeamsAllowed(0);

    await page.goto('/member/my-fundraising');

    const card = consoleCard(page);

    await openConsoleSection(card);

    await expect(card.getByRole('button', { name: 'Edit my page' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Find a team' })).toHaveCount(0);
  });

  test('Console_TeamControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    insertCaptainPageOnly(signedInUserId);

    await page.goto('/member/my-fundraising');
    await openConsoleSection(consoleCard(page));

    const control = consoleCard(page).getByRole('button', { name: 'Find a team' });

    expect((await control.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test('PublicPage_FundraiserInATeam_TakesADonorToTheWiderEffort', async ({ page }) => {
    insertTeamWithTwoMembers(signedInUserId);

    await page.goto(`/campaigns/${campaignSlug}/${CAPTAIN_SLUG}`);
    await page.getByRole('link', { name: `Part of ${TEAM_NAME}` }).click();

    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignSlug}/teams/${TEAM_SLUG}$`));
    await expect(page.getByRole('heading', { level: 1, name: TEAM_NAME })).toBeVisible();
  });

  test('PublicPage_FundraiserInNoTeam_ShowsNoTeamLine', async ({ page }) => {
    insertCaptainPageOnly(signedInUserId);

    await page.goto(`/campaigns/${campaignSlug}/${CAPTAIN_SLUG}`);
    await expect(page.getByRole('heading', { level: 1, name: CAPTAIN_NAME })).toBeVisible();

    await expect(page.getByRole('link', { name: /^Part of / })).toHaveCount(0);
  });
});
