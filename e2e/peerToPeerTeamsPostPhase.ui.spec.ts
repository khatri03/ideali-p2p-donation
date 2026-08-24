import { Page, expect, test } from '@playwright/test';
import { endedCampaign, liveCampaign, secondLiveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';
import { e2eEnv } from './support/e2eEnv';

/**
 * The team screens a person would otherwise check by hand at the end of phase 5. What the sibling
 * suite already covers is not repeated: this one takes the surfaces that need a fundraiser signed in,
 * a team that belongs to somebody else, money on a page, a campaign that has finished, or a second
 * campaign running alongside.
 *
 * Everything is inserted directly and removed afterwards, and the campaign settings this suite changes
 * are put back, because the same campaigns are used by other suites.
 */

const campaign = liveCampaign();
const otherCampaign = secondLiveCampaign();
const finishedCampaign = endedCampaign();

const PROBE_TAG = 'e2e-team-post';
const TEAM_SLUG = 'e2e-post-team';
const TEAM_NAME = 'E2E Post Team';
const OTHER_TEAM_SLUG = 'e2e-post-other-team';
const OTHER_TEAM_NAME = 'E2E Post Other Team';
const MINE_SLUG = 'e2e-post-mine';
const MINE_NAME = 'E2E Post Fundraiser';
const THEIRS_SLUG = 'e2e-post-theirs';
const THEIRS_NAME = 'E2E Post Teammate';
const CREATED_TEAM_NAME = 'E2E Post Created Team';

let campaignSlug: string;
let otherCampaignSlug: string;
let finishedCampaignSlug: string;
let signedInUserId: string;

const browsePath = (slug = campaignSlug) => `/campaigns/${slug}/teams`;
const createPath = (slug = campaignSlug) => `${browsePath(slug)}/new`;
const teamPath = (teamSlug = TEAM_SLUG, slug = campaignSlug) => `${browsePath(slug)}/${teamSlug}`;
const managePath = (teamSlug = TEAM_SLUG) => `${teamPath(teamSlug)}/members`;

const campaignIdOf = (uniqueId: string) =>
  `(SELECT Id FROM DonationCampaign WHERE UniqueId = '${uniqueId}')`;

/**
 * Rows this suite made, whoever the server recorded as their author: a team started through the form
 * carries the signed-in user rather than the probe tag, so it is found by its name as well.
 */
const removeProbeData = (): void =>
  execute(`
    DECLARE @teams TABLE (Id INT);
    INSERT INTO @teams (Id)
    SELECT Id FROM CampaignTeam
    WHERE CreatedBy = '${PROBE_TAG}' OR Name LIKE 'E2E Post%';

    DECLARE @fundraisers TABLE (Id INT);
    INSERT INTO @fundraisers (Id)
    SELECT Id FROM CampaignFundraiser WHERE CreatedBy = '${PROBE_TAG}';

    DELETE FROM CampaignTeamMember
    WHERE CampaignTeamId IN (SELECT Id FROM @teams)
       OR CampaignFundraiserId IN (SELECT Id FROM @fundraisers);

    DELETE FROM CampaignTeam WHERE Id IN (SELECT Id FROM @teams);

    DELETE FROM DonationCampaignInvoice
    WHERE InvoiceId IN (SELECT Id FROM Invoice WHERE CreatedBy = '${PROBE_TAG}');
    DELETE FROM InvoiceItem
    WHERE InvoiceId IN (SELECT Id FROM Invoice WHERE CreatedBy = '${PROBE_TAG}');
    DELETE FROM Invoice WHERE CreatedBy = '${PROBE_TAG}';

    DELETE FROM CampaignFundraiser WHERE Id IN (SELECT Id FROM @fundraisers);
  `);

const setPeerToPeer = (uniqueId: string, isEnabled: 0 | 1, allowTeams: 0 | 1): void =>
  execute(`
    UPDATE DonationCampaign
    SET IsPeerToPeerEnabled = ${isEnabled},
        PeerToPeerAllowTeams = ${allowTeams},
        PeerToPeerSlug = ISNULL(PeerToPeerSlug, 'e2e-campaign-' + CAST(Id AS VARCHAR(10)))
    WHERE UniqueId = '${uniqueId}';
  `);

const slugOf = (uniqueId: string) =>
  querySingleValue(`SELECT PeerToPeerSlug FROM DonationCampaign WHERE UniqueId = '${uniqueId}';`);

interface FundraiserSeed {
  slug: string;
  displayName: string;
  /** The signed-in account, or the other one, so a team can belong to somebody else. */
  isMine: boolean;
  campaignUniqueId?: string;
}

const insertFundraiser = ({
  slug,
  displayName,
  isMine,
  campaignUniqueId = campaign.uniqueId,
}: FundraiserSeed): void =>
  execute(`
    DECLARE @campaignId INT = ${campaignIdOf(campaignUniqueId)};
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);
    DECLARE @userId INT = ${
      isMine ? signedInUserId : `(SELECT MIN(Id) FROM [User] WHERE Id <> ${signedInUserId})`
    };

    INSERT INTO CampaignFundraiser
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, UserId, Slug, DisplayName, Story,
       PersonalGoal, CurrentStatus, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId, @userId, '${slug}', '${displayName}', NULL, 500,
       'Active', 0, '${PROBE_TAG}', SYSUTCDATETIME());
  `);

interface TeamSeed {
  slug?: string;
  name?: string;
  goal?: number | null;
  captainIsMine: boolean;
  memberSlugs: string[];
  campaignUniqueId?: string;
}

const insertTeam = ({
  slug = TEAM_SLUG,
  name = TEAM_NAME,
  goal = 1000,
  captainIsMine,
  memberSlugs,
  campaignUniqueId = campaign.uniqueId,
}: TeamSeed): void =>
  execute(`
    DECLARE @campaignId INT = ${campaignIdOf(campaignUniqueId)};
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);
    DECLARE @captainId INT = ${
      captainIsMine ? signedInUserId : `(SELECT MIN(Id) FROM [User] WHERE Id <> ${signedInUserId})`
    };

    INSERT INTO CampaignTeam
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, CaptainUserId, Slug, Name, Story,
       TeamGoal, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId, @captainId, '${slug}', '${name}',
       'Raising together.', ${goal === null ? 'NULL' : goal}, 0, '${PROBE_TAG}', SYSUTCDATETIME());

    DECLARE @teamId INT = (
      SELECT Id FROM CampaignTeam WHERE DonationCampaignId = @campaignId AND Slug = '${slug}'
    );

    INSERT INTO CampaignTeamMember
      (UniqueId, CampaignTeamId, CampaignFundraiserId, JoinedOnUtc, IsDeleted, CreatedBy, CreatedOnUtc)
    SELECT NEWID(), @teamId, fundraiser.Id, SYSUTCDATETIME(), 0, '${PROBE_TAG}', SYSUTCDATETIME()
    FROM CampaignFundraiser fundraiser
    WHERE fundraiser.DonationCampaignId = @campaignId
      AND fundraiser.Slug IN (${memberSlugs.length ? memberSlugs.map((each) => `'${each}'`).join(', ') : "''"});
  `);

/** One paid gift on one fundraiser's page, so a team total has something real to add up. */
const insertGift = (fundraiserSlug: string, amount: number): void =>
  execute(`
    DECLARE @campaignId INT = ${campaignIdOf(campaign.uniqueId)};
    DECLARE @fundraiserId INT = (
      SELECT Id FROM CampaignFundraiser
      WHERE DonationCampaignId = @campaignId AND Slug = '${fundraiserSlug}'
    );

    INSERT INTO Invoice (UniqueId, RowVersion, Module, InvoiceType, TotalAmount, InvoiceStatus,
                         IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES (NEWID(), 0, 'Donation', 'Regular', ${amount}, 'Paid', 0, '${PROBE_TAG}',
            SYSUTCDATETIME());

    DECLARE @invoiceId INT = SCOPE_IDENTITY();

    INSERT INTO InvoiceItem (UniqueId, InvoiceId, Description, InvoiceItemStatus, Quantity, UnitPrice,
                             LineTotal, ItemType, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES (NEWID(), @invoiceId, 'Donation', 'Pending', 1, ${amount}, ${amount}, 'Regular', 0,
            '${PROBE_TAG}', SYSUTCDATETIME());

    INSERT INTO DonationCampaignInvoice (UniqueId, DonationCampaignId, InvoiceId, CampaignFundraiserId)
    VALUES (NEWID(), @campaignId, @invoiceId, @fundraiserId);
  `);

const membershipCount = (): number =>
  Number(
    querySingleValue(`
      SELECT CAST(COUNT(*) AS VARCHAR(20)) FROM CampaignTeamMember member
      INNER JOIN CampaignTeam team ON team.Id = member.CampaignTeamId
      WHERE team.Slug = '${TEAM_SLUG}' AND member.IsDeleted = 0;
    `),
  );

/** What the campaign has taken, whoever it was attributed to - removing somebody must not move it. */
const campaignGiftTotal = (): string =>
  querySingleValue(`
    SELECT CAST(ISNULL(SUM(item.LineTotal), 0) AS VARCHAR(30))
    FROM DonationCampaignInvoice campaignInvoice
    INNER JOIN InvoiceItem item ON item.InvoiceId = campaignInvoice.InvoiceId
    WHERE campaignInvoice.DonationCampaignId = ${campaignIdOf(campaign.uniqueId)}
      AND item.IsDeleted = 0;
  `);

const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const cursorOf = (page: Page, name: string) =>
  page.getByRole('button', { name }).evaluate((node) => getComputedStyle(node).cursor);

/** Holds the answer back long enough that the screen's in-flight state can be looked at. */
const delayOnce = async (page: Page, urlPattern: string, milliseconds: number) => {
  await page.route(urlPattern, async (route) => {
    await new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
    await route.continue();
  });
};

/**
 * The payment methods a donor is offered, read off the existing donation screen. Nothing is paid: the
 * flow is walked as far as the choice of method and no further.
 */
const paymentMethodsOffered = async (page: Page, path: string): Promise<string[]> => {
  await page.goto(path);
  await page.getByPlaceholder('Enter amount').fill('25');
  await page.getByRole('button', { name: /Continue to Payment/i }).click();

  await expect(page.getByText('Select Payment Method')).toBeVisible();

  const labels = await page.getByText('Select Payment Method').locator('..').innerText();

  return labels
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== 'Select Payment Method')
    .sort();
};

test.beforeAll(() => {
  signedInUserId = querySingleValue(`
    SELECT CAST(Id AS VARCHAR(20)) FROM [User]
    WHERE UserName = '${e2eEnv.organizerUsername.replace(/'/g, "''")}';
  `);

  setPeerToPeer(campaign.uniqueId, 1, 1);
  setPeerToPeer(finishedCampaign.uniqueId, 1, 1);

  campaignSlug = slugOf(campaign.uniqueId);
  otherCampaignSlug = slugOf(otherCampaign.uniqueId);
  finishedCampaignSlug = slugOf(finishedCampaign.uniqueId);

  removeProbeData();
});

test.afterEach(() => {
  removeProbeData();
  setPeerToPeer(campaign.uniqueId, 1, 1);
});

/** The two campaigns this suite borrowed are put back the way they were found. */
test.afterAll(() => {
  removeProbeData();
  setPeerToPeer(campaign.uniqueId, 1, 1);
  setPeerToPeer(finishedCampaign.uniqueId, 0, 0);
  setPeerToPeer(otherCampaign.uniqueId, 0, 0);
});

test.describe('Browsing teams as somebody who could join one', () => {
  test('Browse_FundraisingAndInNoTeam_OffersStartingATeamAndJoiningEachOne', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG] });

    await page.goto(browsePath());

    await expect(page.getByRole('button', { name: 'Start a team' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join this team' })).toBeVisible();
  });

  test('Browse_AlreadyInATeam_ReplacesJoiningWithTheWayToTheirOwnTeam', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG] });

    await page.goto(browsePath());

    await expect(page.getByRole('button', { name: 'Go to my team' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join this team' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Start a team' })).toHaveCount(0);
  });

  test('Browse_SignedInButNotFundraising_SaysToSetUpAPageFirstAndOffersTheWay', async ({ page }) => {
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG] });

    await page.goto(browsePath());

    await expect(page.getByText(/Set up your own page on this campaign/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join this team' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Set up my fundraising page' }).click();

    await expect(page).toHaveURL(/\/peer-to-peer\/join$/);
  });

  test('Browse_SearchTyped_NarrowsTheListToTheMatch', async ({ page }) => {
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG] });
    insertTeam({
      slug: OTHER_TEAM_SLUG,
      name: OTHER_TEAM_NAME,
      captainIsMine: false,
      memberSlugs: [],
    });

    await page.goto(browsePath());
    await expect(page.getByRole('heading', { level: 3, name: TEAM_NAME, exact: true })).toBeVisible();

    await page.getByLabel('Search teams').fill('Other Team');

    await expect(page.getByRole('heading', { level: 3, name: OTHER_TEAM_NAME })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: TEAM_NAME, exact: true }),
    ).toHaveCount(0);
  });

  test('Browse_SearchCleared_BringsTheWholeListBack', async ({ page }) => {
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG] });

    await page.goto(browsePath());
    await page.getByLabel('Search teams').fill('nothing matches this');
    await expect(page.getByRole('heading', { name: 'No team matches that search' })).toBeVisible();

    await page.getByRole('button', { name: 'Clear search' }).click();

    await expect(page.getByRole('heading', { level: 3, name: TEAM_NAME, exact: true })).toBeVisible();
  });

  test('Browse_TeamWithOneMember_ReadsOneFundraiserRatherThanOneFundraisers', async ({ page }) => {
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG] });

    await page.goto(browsePath());

    await expect(page.getByText('1 fundraiser', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('1 fundraisers')).toHaveCount(0);
  });

  test('Browse_StillLoading_ShowsACardSkeletonRatherThanABlankArea', async ({ page }) => {
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG] });

    await delayOnce(page, '**/api/campaigns/*/teams*', 1500);
    await page.goto(browsePath());

    await expect(page.locator('.chakra-skeleton').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: TEAM_NAME, exact: true })).toBeVisible();
  });

  test('Join_Pressed_NamesTheTeamAndPromisesEveryDonationAlreadyTakenIsKept', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG] });

    await page.goto(browsePath());
    await page.getByRole('button', { name: 'Join this team' }).click();

    await expect(page.getByText(`Join ${TEAM_NAME}?`)).toBeVisible();
    await expect(page.getByText(/keeps every donation it has already taken/i)).toBeVisible();
  });

  test('Join_Cancelled_SendsNothing', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG] });

    await page.goto(browsePath());
    await page.getByRole('button', { name: 'Join this team' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByText(`Join ${TEAM_NAME}?`)).toHaveCount(0);
    expect(membershipCount()).toBe(1);
  });

  test('Join_Confirmed_LandsOnTheTeamPageWithTheirOwnNameOnIt', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG] });

    await page.goto(browsePath());
    await page.getByRole('button', { name: 'Join this team' }).click();
    await page.getByRole('button', { name: 'Yes, join' }).click();

    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignSlug}/teams/${TEAM_SLUG}$`));
    await expect(page.getByText(MINE_NAME).first()).toBeVisible();
    expect(membershipCount()).toBe(2);
  });
});

test.describe('Starting a team', () => {
  const seedFundraiser = () =>
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });

  test('Create_Opened_NamesTheCampaignTheTeamWillRaiseFor', async ({ page }) => {
    seedFundraiser();

    await page.goto(createPath());

    await expect(page.getByRole('heading', { level: 1, name: 'Start a team' })).toBeVisible();
    await expect(page.getByText(campaign.name, { exact: false }).first()).toBeVisible();
  });

  test('Create_NameLeftBlank_ExplainsOnTheFieldAndSendsNothing', async ({ page }) => {
    seedFundraiser();

    await page.goto(createPath());
    await page.getByRole('button', { name: 'Create team' }).click();

    await expect(page.getByText('Enter a name for your team.')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignSlug}/teams/new$`));
  });

  test('Create_GoalTyped_KeepsOnlyAMoneyAmount', async ({ page }) => {
    seedFundraiser();

    await page.goto(createPath());
    const goal = page.getByLabel('Team goal');

    await goal.fill('12ab34');
    await expect(goal).toHaveValue('1234');

    await goal.fill('12.34.56');
    await expect(goal).toHaveValue('12.34');

    await goal.fill('12.345');
    await expect(goal).toHaveValue('12.34');
  });

  test('Create_GoalOfZero_IsRefusedOnTheScreenWithASentence', async ({ page }) => {
    seedFundraiser();

    await page.goto(createPath());
    await page.getByLabel('Team name').fill(CREATED_TEAM_NAME);
    await page.getByLabel('Team goal').fill('0');
    await page.getByRole('button', { name: 'Create team' }).click();

    await expect(page.getByText('Enter a goal greater than zero, or leave it blank.')).toBeVisible();
  });

  test('Create_StoryTyped_CountsDownAndStopsAtTheLimit', async ({ page }) => {
    seedFundraiser();

    await page.goto(createPath());
    const story = page.getByLabel('Why this team is fundraising');

    await story.fill('a'.repeat(1900));
    await expect(page.getByText('100 characters left')).toBeVisible();

    await story.fill('a'.repeat(2100));
    await expect(story).toHaveValue('a'.repeat(2000));
    await expect(page.getByText('0 characters left')).toBeVisible();
  });

  test('Create_Submitted_MakesThemCaptainWithTheirOwnPageAlreadyInTheTeam', async ({ page }) => {
    seedFundraiser();

    await page.goto(createPath());
    await page.getByLabel('Team name').fill(CREATED_TEAM_NAME);
    await page.getByRole('button', { name: 'Create team' }).click();

    await expect(page.getByRole('heading', { level: 1, name: CREATED_TEAM_NAME })).toBeVisible();
    await expect(page.getByText(MINE_NAME).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manage team' })).toBeVisible();
  });

  test('Create_SecondTeamOnTheSameCampaign_OffersTheirOwnTeamInsteadOfTheForm', async ({ page }) => {
    seedFundraiser();
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG] });

    await page.goto(createPath());

    await expect(page.getByText('You are already in a team on this campaign.')).toBeVisible();
    await expect(page.getByLabel('Team name')).toHaveCount(0);

    await page.getByRole('button', { name: 'Go to my team' }).click();

    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignSlug}/teams/${TEAM_SLUG}$`));
  });

  test('Create_TeamsSwitchedOff_ShowsADesignedRefusalRatherThanTheForm', async ({ page }) => {
    seedFundraiser();
    setPeerToPeer(campaign.uniqueId, 1, 0);

    await page.goto(createPath());

    await expect(
      page.getByRole('heading', { name: 'This campaign is not using teams' }),
    ).toBeVisible();
    await expect(page.getByLabel('Team name')).toHaveCount(0);
  });

  test('Create_Cancelled_ReturnsToTheListWithoutSaving', async ({ page }) => {
    seedFundraiser();

    await page.goto(createPath());
    await page.getByLabel('Team name').fill(CREATED_TEAM_NAME);
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignSlug}/teams$`));
    await expect(page.getByRole('heading', { level: 3, name: CREATED_TEAM_NAME })).toHaveCount(0);
  });

  test('Create_InFlight_NamesWhatItIsDoingAndDisablesEveryField', async ({ page }) => {
    seedFundraiser();

    await page.goto(createPath());
    await page.getByLabel('Team name').fill(CREATED_TEAM_NAME);

    await delayOnce(page, '**/api/campaigns/*/teams', 2500);
    await page.getByRole('button', { name: 'Create team' }).click();

    await expect(page.getByText('Creating...')).toBeVisible();
    await expect(page.getByLabel('Team name')).toBeDisabled();
    await expect(page.getByLabel('Team goal')).toBeDisabled();
    expect(await cursorOf(page, 'Cancel')).toBe('not-allowed');
  });

  test('Create_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    seedFundraiser();

    await page.goto(createPath());
    await expect(page.getByLabel('Team name')).toBeVisible();

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});

test.describe('The public team page, as the people in it see it', () => {
  test('TeamPage_TeamWithNoGoal_ShowsTheTotalWithoutAProgressBar', async ({ page }) => {
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG], goal: null });

    await page.goto(teamPath());

    await expect(page.getByRole('heading', { level: 1, name: TEAM_NAME })).toBeVisible();
    await expect(page.getByText('% there')).toHaveCount(0);
    await expect(page.getByRole('progressbar')).toHaveCount(0);
  });

  test('TeamPage_MemberFigures_AddUpToTheTeamTotalToThePenny', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG, THEIRS_SLUG] });
    insertGift(MINE_SLUG, 100.25);
    insertGift(THEIRS_SLUG, 50.8);

    await page.goto(teamPath());

    await expect(page.getByText(/100\.25 raised/)).toBeVisible();
    await expect(page.getByText(/50\.80 raised/)).toBeVisible();
    await expect(page.getByText(/151\.05/).first()).toBeVisible();
  });

  test('TeamPage_MemberChosen_OpensTheirDonateScreenAtItsUsualAddress', async ({ page }) => {
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG] });

    await page.goto(teamPath());
    await page.getByRole('button', { name: 'Donate to this team' }).click();
    await page.getByRole('button', { name: `Donate to ${THEIRS_NAME}` }).click();

    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignSlug}/${THEIRS_SLUG}/donate$`));
    await expect(page.getByText(THEIRS_NAME).first()).toBeVisible();
  });

  /** The one rule this whole feature must not break: giving through a page pays the same ways. */
  test('Donate_ThroughAFundraiserPage_OffersExactlyThePaymentMethodsTheCampaignAlreadyOffered', async ({
    page,
  }) => {
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG] });

    const throughTheCampaign = await paymentMethodsOffered(page, `/donate/${campaign.uniqueId}`);
    const throughTheFundraiser = await paymentMethodsOffered(
      page,
      `/campaigns/${campaignSlug}/${THEIRS_SLUG}/donate`,
    );

    expect(throughTheFundraiser.length).toBeGreaterThan(0);
    expect(throughTheFundraiser).toEqual(throughTheCampaign);
  });

  test('TeamPage_CampaignThatHasFinished_SaysItIsNoLongerTakingDonations', async ({ page }) => {
    insertFundraiser({
      slug: THEIRS_SLUG,
      displayName: THEIRS_NAME,
      isMine: false,
      campaignUniqueId: finishedCampaign.uniqueId,
    });
    insertTeam({
      captainIsMine: false,
      memberSlugs: [THEIRS_SLUG],
      campaignUniqueId: finishedCampaign.uniqueId,
    });

    await page.goto(teamPath(TEAM_SLUG, finishedCampaignSlug));

    await expect(page.getByText(/no longer taking donations/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Donate to this team' })).toHaveCount(0);
  });

  test('TeamPage_SharePanel_ShowsTheAddressInFullAndConfirmsTheCopy', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG] });

    await page.goto(teamPath());

    await expect(
      page.getByText(`/campaigns/${campaignSlug}/teams/${TEAM_SLUG}`, { exact: false }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Copy link' }).click();

    await expect(page.getByRole('button', { name: 'Link copied' })).toBeVisible();
  });

  test('TeamPage_PlainMember_IsOfferedLeavingButNotManagement', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [MINE_SLUG, THEIRS_SLUG] });

    await page.goto(teamPath());

    await expect(page.getByRole('button', { name: 'Leave this team' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manage team' })).toHaveCount(0);
  });

  test('TeamPage_Captain_IsOfferedBothManagingAndLeaving', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG, THEIRS_SLUG] });

    await page.goto(teamPath());

    await expect(page.getByRole('button', { name: 'Manage team' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Leave this team' })).toBeVisible();
  });

  test('Leave_PressedByACaptainWithOthersBehindThem_WarnsTheLongestStandingMemberTakesOver', async ({
    page,
  }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG, THEIRS_SLUG] });

    await page.goto(teamPath());
    await page.getByRole('button', { name: 'Leave this team' }).click();

    await expect(page.getByText(`Leave ${TEAM_NAME}?`)).toBeVisible();
    await expect(
      page.getByText(/page and every donation on it stay exactly as they are/i),
    ).toBeVisible();
    await expect(page.getByText(/longest-standing member takes over/i)).toBeVisible();
  });

  test('Leave_PressedByTheLastMember_WarnsTheTeamClosesAndTheAddressStopsWorking', async ({
    page,
  }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG] });

    await page.goto(teamPath());
    await page.getByRole('button', { name: 'Leave this team' }).click();

    await expect(page.getByText(/leaving closes this team/i)).toBeVisible();

    await page.getByRole('button', { name: 'Yes, leave' }).click();
    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignSlug}/teams$`));

    await page.goto(teamPath());
    await expect(page.getByRole('heading', { name: 'This team is not here' })).toBeVisible();
  });

  test('TeamPage_MistypedAddress_ShowsTheSameNoticeWithoutConfirmingAnythingEverExisted', async ({
    page,
  }) => {
    await page.goto(teamPath('a-team-that-was-never-here'));

    await expect(page.getByRole('heading', { name: 'This team is not here' })).toBeVisible();
    expect(await page.content()).not.toContain('CampaignTeam');
  });
});

test.describe('The captain managing the team', () => {
  test('Manage_OnlyMemberInTheTeam_SaysWhyThereIsNobodyToHandOverTo', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG] });

    await page.goto(managePath());

    await expect(page.getByText(/only member/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Make captain/ })).toHaveCount(0);
  });

  test('Manage_NothingChangedYet_LeavesSavingUnavailable', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG] });

    await page.goto(managePath());

    const save = page.getByRole('button', { name: 'Save changes' });
    await expect(save).toBeDisabled();
    expect(await cursorOf(page, 'Save changes')).toBe('not-allowed');

    await page.getByLabel('Team name').fill('E2E Post Renamed');
    await expect(save).toBeEnabled();
  });

  test('Remove_Cancelled_SendsNothing', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG, THEIRS_SLUG] });

    await page.goto(managePath());
    await page.getByRole('button', { name: `Remove: ${THEIRS_NAME}` }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('button', { name: `Remove: ${THEIRS_NAME}` })).toBeVisible();
    expect(membershipCount()).toBe(2);
  });

  test('Remove_Confirmed_DropsTheTeamTotalAndLeavesTheCampaignTotalAlone', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG, THEIRS_SLUG] });
    insertGift(MINE_SLUG, 100.25);
    insertGift(THEIRS_SLUG, 50.8);

    const campaignTotalBefore = campaignGiftTotal();

    await page.goto(teamPath());
    await expect(page.getByText(/151\.05/).first()).toBeVisible();

    await page.goto(managePath());
    await page.getByRole('button', { name: `Remove: ${THEIRS_NAME}` }).click();
    await page.getByRole('button', { name: 'Yes, remove' }).click();
    await expect(page.getByRole('button', { name: `Remove: ${THEIRS_NAME}` })).toHaveCount(0);
    expect(membershipCount()).toBe(1);

    await page.goto(teamPath());
    await expect(page.getByText('1 fundraiser', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/100\.25/).first()).toBeVisible();
    await expect(page.getByText(/151\.05/)).toHaveCount(0);
    expect(campaignGiftTotal()).toBe(campaignTotalBefore);
  });

  test('Remove_Confirmed_LeavesTheirOwnPageAndItsMoneyIntact', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG, THEIRS_SLUG] });
    insertGift(THEIRS_SLUG, 50.8);

    await page.goto(managePath());
    await page.getByRole('button', { name: `Remove: ${THEIRS_NAME}` }).click();
    await page.getByRole('button', { name: 'Yes, remove' }).click();
    await expect(page.getByRole('button', { name: `Remove: ${THEIRS_NAME}` })).toHaveCount(0);
    expect(membershipCount()).toBe(1);

    await page.goto(`/campaigns/${campaignSlug}/${THEIRS_SLUG}`);

    await expect(page.getByRole('heading', { level: 1, name: THEIRS_NAME })).toBeVisible();
    await expect(page.getByText(/50\.80/).first()).toBeVisible();
    await expect(page.getByRole('link', { name: `Part of ${TEAM_NAME}` })).toHaveCount(0);
  });

  test('HandOver_Confirmed_ReturnsThemToTheTeamAsAPlainMember', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG, THEIRS_SLUG] });

    await page.goto(managePath());
    await page.getByRole('button', { name: `Make captain: ${THEIRS_NAME}` }).click();

    await expect(page.getByText(/You cannot undo this yourself/i)).toBeVisible();

    await page.getByRole('button', { name: 'Yes, hand over' }).click();

    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignSlug}/teams/${TEAM_SLUG}$`));
    await expect(page.getByRole('button', { name: 'Leave this team' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manage team' })).toHaveCount(0);
  });

  test('Remove_InFlight_DisablesBothDialogButtonsWithNotAllowed', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG, THEIRS_SLUG] });

    await page.goto(managePath());
    await page.getByRole('button', { name: `Remove: ${THEIRS_NAME}` }).click();

    await delayOnce(page, '**/api/campaigns/*/teams/*/members/*', 2500);
    await page.getByRole('button', { name: 'Yes, remove' }).click();

    await expect(page.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(await cursorOf(page, 'Cancel')).toBe('not-allowed');
  });

  test('Confirmation_AtEveryViewport_IsFullScreenOnMobileAndCentredAbove', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG, THEIRS_SLUG] });

    await page.goto(managePath());
    await page.getByRole('button', { name: `Remove: ${THEIRS_NAME}` }).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();

    const width = (await dialog.boundingBox())?.width ?? 0;
    const visibleWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // The only thing between a full-screen dialog and the viewport edge is its own scrollbar.
    const SCROLLBAR_ALLOWANCE = 16;

    if ((page.viewportSize()?.width ?? 0) <= 375) {
      expect(width).toBeGreaterThanOrEqual(visibleWidth - SCROLLBAR_ALLOWANCE);
    } else {
      expect(width).toBeLessThan(visibleWidth * 0.8);
    }
  });
});

/** A donor following a shared link holds no account, so the way to the wider effort is proven there. */
test.describe('The team link a stranger follows', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('PublicPage_SignedOut_ShowsTheTeamLineAndOpensTheTeamPage', async ({ page }) => {
    insertFundraiser({ slug: THEIRS_SLUG, displayName: THEIRS_NAME, isMine: false });
    insertTeam({ captainIsMine: false, memberSlugs: [THEIRS_SLUG] });

    await page.goto(`/campaigns/${campaignSlug}/${THEIRS_SLUG}`);

    const teamLink = page.getByRole('link', { name: `Part of ${TEAM_NAME}` });

    await expect(teamLink).toBeVisible();
    expect(await teamLink.evaluate((node) => getComputedStyle(node).cursor)).toBe('pointer');
    expect((await teamLink.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);

    await teamLink.click();

    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignSlug}/teams/${TEAM_SLUG}$`));
  });
});

test.describe('One fundraiser, more than one campaign', () => {
  test('Console_InATeamAfterTeamsWereSwitchedOff_StillReachesTheirOwnTeam', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG] });
    setPeerToPeer(campaign.uniqueId, 1, 0);

    await page.goto('/member/my-fundraising');

    const card = page.getByRole('region', { name: `${MINE_NAME} fundraising for ${campaign.name}` });

    await expect(card.getByRole('button', { name: `My team: ${TEAM_NAME}` })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Find a team' })).toHaveCount(0);
  });

  test('Console_InATeam_ShowsAPointerCursorOnTheOneTeamControl', async ({ page }) => {
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG] });

    await page.goto('/member/my-fundraising');

    expect(await cursorOf(page, `My team: ${TEAM_NAME}`)).toBe('pointer');
  });

  test('Teams_JoinedOnOneCampaign_LeaveFundraisingOnAnotherAlone', async ({ page }) => {
    setPeerToPeer(otherCampaign.uniqueId, 1, 1);
    insertFundraiser({ slug: MINE_SLUG, displayName: MINE_NAME, isMine: true });
    insertTeam({ captainIsMine: true, memberSlugs: [MINE_SLUG] });
    insertFundraiser({
      slug: THEIRS_SLUG,
      displayName: MINE_NAME,
      isMine: true,
      campaignUniqueId: otherCampaign.uniqueId,
    });

    await page.goto(browsePath(otherCampaignSlug));

    await expect(page.getByRole('button', { name: 'Start a team' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go to my team' })).toHaveCount(0);

    await page.goto(teamPath());
    await expect(page.getByRole('heading', { level: 1, name: TEAM_NAME })).toBeVisible();
  });
});
