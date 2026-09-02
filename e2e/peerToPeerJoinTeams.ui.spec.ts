import { APIRequestContext, expect, test } from '@playwright/test';
import { authenticatedApi, settingsUrl, signIn } from './support/apiSession';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';
import { SUPPORTER_STORAGE_STATE_PATH } from './support/e2eEnv';
import { clearFundraiserPages, restoreFundraiserPages } from './support/fundraiserPages';

/**
 * The team question where it now lives: inside the screen that creates the fundraising page.
 *
 * The rule this suite protects is the one the change exists for. A supporter answers the team question
 * once, while setting their page up, and the page and the team reach the database together. Everything
 * that used to make somebody go and find the teams afterwards is a regression here, not a nicety.
 *
 * Walked as a supporter rather than as the charity: whoever runs a campaign is refused a fundraising
 * page on it, so the organiser's session would prove the refusal and never reach the journey.
 */

test.use({ storageState: SUPPORTER_STORAGE_STATE_PATH });

const campaign = liveCampaign();
const joinPath = `/donation/campaign/${campaign.uniqueId}/peer-to-peer/join`;

const PROBE_TAG = 'e2e-join-team';
const EXISTING_TEAM_SLUG = 'e2e-join-existing-team';
const EXISTING_TEAM_NAME = 'E2E Join Existing Team';
const STARTED_TEAM_NAME = 'E2E Join Started Team';

const displayNameField = '#fundraiser-display-name';
const teamNameField = '#fundraiser-team-name';
const teamPicker = '#fundraiser-team-slug';

let api: APIRequestContext;
let originalSettings: Record<string, unknown>;
let campaignSlug: string;

const campaignId = `(SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}')`;

/**
 * Every row this suite can be responsible for, however it was written. A team started through the form
 * is recorded against the signed-in supporter rather than the probe tag, so it is found by its name as
 * well as by the tag.
 */
const removeProbeData = (): void => {
  execute(`
    DECLARE @teams TABLE (Id INT);
    INSERT INTO @teams (Id)
    SELECT Id FROM CampaignTeam
    WHERE DonationCampaignId = ${campaignId}
      AND (CreatedBy = '${PROBE_TAG}' OR Name LIKE 'E2E Join%');

    DELETE FROM CampaignTeamMember WHERE CampaignTeamId IN (SELECT Id FROM @teams);
    DELETE FROM CampaignTeam WHERE Id IN (SELECT Id FROM @teams);
  `);

  clearFundraiserPages(campaign.uniqueId);
};

/** A team that already exists on the campaign, captained by somebody who is not the supporter. */
const insertExistingTeam = (): void =>
  execute(`
    DECLARE @campaignId INT = ${campaignId};
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);

    INSERT INTO CampaignTeam
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, CaptainUserId, Slug, Name, Story,
       TeamGoal, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId, (SELECT MIN(Id) FROM [User]),
       '${EXISTING_TEAM_SLUG}', '${EXISTING_TEAM_NAME}', 'Raising together.', 1000, 0,
       '${PROBE_TAG}', SYSUTCDATETIME());
  `);

const membershipCountFor = (teamName: string): string =>
  querySingleValue(`
    SELECT CAST(COUNT(*) AS VARCHAR(20))
    FROM CampaignTeamMember member
    INNER JOIN CampaignTeam team ON team.Id = member.CampaignTeamId
    WHERE team.DonationCampaignId = ${campaignId}
      AND team.Name = '${teamName}'
      AND member.IsDeleted = 0;
  `);

const applySettings = async (allowTeams: boolean, requiresApproval = false) => {
  const response = await api.post(settingsUrl(campaign.uniqueId), {
    data: {
      isPeerToPeerEnabled: true,
      defaultPersonalGoal: 250,
      allowTeams,
      requiresApproval,
      leaderboardVisibility: 'Public',
    },
  });

  expect(response.status()).toBe(200);
};

test.beforeAll(async () => {
  api = await authenticatedApi(await signIn());
  originalSettings = (await (await api.get(settingsUrl(campaign.uniqueId))).json()).data;
  campaignSlug = querySingleValue(
    `SELECT PeerToPeerSlug FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}';`,
  );
});

test.beforeEach(async () => {
  removeProbeData();
  await applySettings(true);
});

test.afterAll(async () => {
  removeProbeData();
  restoreFundraiserPages();

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
});

test.describe('The team question on the join screen', () => {
  /** A campaign that uses teams asks about them where the page is created, not somewhere afterwards. */
  test('JoinScreen_CampaignUsesTeams_AsksTheTeamQuestionBeforeAnythingIsCreated', async ({
    page,
  }) => {
    await page.goto(joinPath);

    await expect(page.getByRole('radio', { name: /On my own/ })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Join a team/ })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Start a team/ })).toBeVisible();
  });

  /** A campaign with teams switched off must not be asked a question it has no answer to. */
  test('JoinScreen_CampaignDoesNotUseTeams_DoesNotAskTheTeamQuestion', async ({ page }) => {
    await applySettings(false);

    await page.goto(joinPath);
    await expect(page.locator(displayNameField)).toBeVisible();

    await expect(page.getByRole('radio', { name: /Join a team/ })).toHaveCount(0);
  });

  /**
   * The whole point of the change: one submit, and the page and the team exist together. Anything less
   * leaves the supporter in a console screen working out whether the team half happened.
   */
  test('JoinScreen_TeamStarted_CreatesThePageAndTheTeamInOneStep', async ({ page }) => {
    await page.goto(joinPath);

    await page.locator(displayNameField).fill('E2E Join Supporter');
    await page.getByRole('radio', { name: /Start a team/ }).click();
    await page.locator(teamNameField).fill(STARTED_TEAM_NAME);
    await page.getByRole('button', { name: 'Create my page' }).click();

    await expect(page.getByText(`Your page is in ${STARTED_TEAM_NAME}`)).toBeVisible();
    expect(membershipCountFor(STARTED_TEAM_NAME)).toBe('1');
  });

  /** Somebody who picked an existing team is put in it, not left beside it. */
  test('JoinScreen_ExistingTeamPicked_PutsTheNewPageInThatTeam', async ({ page }) => {
    insertExistingTeam();

    await page.goto(joinPath);

    await page.locator(displayNameField).fill('E2E Join Supporter');
    await page.getByRole('radio', { name: /Join a team/ }).click();
    await page.locator(teamPicker).selectOption(EXISTING_TEAM_SLUG);
    await page.getByRole('button', { name: 'Create my page' }).click();

    await expect(page.getByText(`Your page is in ${EXISTING_TEAM_NAME}`)).toBeVisible();
    expect(membershipCountFor(EXISTING_TEAM_NAME)).toBe('1');
  });

  /**
   * The dead end this change exists to close. A captain shares their team's address; the reader has no
   * page yet; the way in must carry the team rather than dropping it and leaving them to find it.
   */
  test('TeamPage_ReaderWithNoPage_CarriesTheTeamIntoTheJoinScreenAndBackOutAgain', async ({
    page,
  }) => {
    insertExistingTeam();

    await page.goto(`/campaigns/${campaignSlug}/teams/${EXISTING_TEAM_SLUG}`);
    await page.getByRole('button', { name: 'Set up my fundraising page' }).click();

    await expect(page).toHaveURL(new RegExp(`peer-to-peer/join\\?team=${EXISTING_TEAM_SLUG}$`));
    await expect(page.getByRole('radio', { name: /Join a team/ })).toBeChecked();
    await expect(page.locator(teamPicker)).toHaveValue(EXISTING_TEAM_SLUG);
  });

  /**
   * A campaign that reviews its pages still takes the team answer now. Waiting for the charity is not
   * a reason to make somebody decide again later.
   */
  test('JoinScreen_CampaignReviewsPages_StillRecordsTheTeamTheSupporterChose', async ({ page }) => {
    await applySettings(true, true);
    insertExistingTeam();

    await page.goto(joinPath);

    await page.locator(displayNameField).fill('E2E Join Supporter');
    await page.getByRole('radio', { name: /Join a team/ }).click();
    await page.locator(teamPicker).selectOption(EXISTING_TEAM_SLUG);
    await page.getByRole('button', { name: 'Create my page' }).click();

    await expect(page.getByText('Your page has been sent for review')).toBeVisible();
    expect(membershipCountFor(EXISTING_TEAM_NAME)).toBe('1');
  });

  /**
   * The charity decides when a page is published. A roster listing a page still awaiting that decision
   * would publish it through the side door.
   */
  test('TeamPage_MemberStillAwaitingApproval_IsAbsentFromThePublicRoster', async ({ page }) => {
    await applySettings(true, true);
    insertExistingTeam();

    await page.goto(joinPath);
    await page.locator(displayNameField).fill('E2E Join Supporter');
    await page.getByRole('radio', { name: /Join a team/ }).click();
    await page.locator(teamPicker).selectOption(EXISTING_TEAM_SLUG);
    await page.getByRole('button', { name: 'Create my page' }).click();
    await expect(page.getByText('Your page has been sent for review')).toBeVisible();

    await page.goto(`/campaigns/${campaignSlug}/teams/${EXISTING_TEAM_SLUG}`);

    await expect(page.getByText('E2E Join Supporter')).toHaveCount(0);
  });

  /** Wide content scrolls inside its own container; the page itself never scrolls sideways. */
  test('JoinScreen_AtEveryWidth_HasNoHorizontalPageScroll', async ({ page }) => {
    await page.goto(joinPath);
    await expect(page.getByRole('radio', { name: /Start a team/ })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  /** Every answer has to be reachable by thumb, not only by mouse. */
  test('JoinScreen_AtEveryWidth_KeepsEveryTeamAnswerAtLeast44pxTall', async ({ page }) => {
    await page.goto(joinPath);
    const choices = page.getByRole('radio');

    await expect(choices.first()).toBeVisible();

    for (const choice of await choices.all()) {
      const box = await choice.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
});
