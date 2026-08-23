import { APIRequestContext, expect, test } from '@playwright/test';
import {
  anonymousApi,
  authenticatedApi,
  joinUrl,
  settingsUrl,
  signIn,
} from './support/apiSession';
import { foreignCampaignUniqueId, liveCampaign } from './support/campaignFixtures';
import { querySingleValue } from './support/database';
import { clearFundraiserPages, restoreFundraiserPages } from './support/fundraiserPages';

/**
 * Joining is the only endpoint in this feature that writes a row for the caller, so its refusals
 * matter more than its happy path. Every page this suite creates is deleted afterwards, keyed on the
 * campaign and the signed-in user, so nothing is left behind on a shared database.
 */

let api: APIRequestContext;
let anonymous: APIRequestContext;
let campaignUniqueId: string;
let campaignName: string;
let originalSettings: Record<string, unknown>;

const applySettings = async (settings: Record<string, unknown>) => {
  const response = await api.post(settingsUrl(campaignUniqueId), { data: settings });
  expect(response.status()).toBe(200);
};

const enabledSettings = (overrides: Record<string, unknown> = {}) => ({
  isPeerToPeerEnabled: true,
  defaultPersonalGoal: 250,
  allowTeams: false,
  requiresApproval: false,
  leaderboardVisibility: 'Public',
  ...overrides,
});

const removeJoinedPages = (): void => clearFundraiserPages(campaignUniqueId);

const livePageCount = (): string =>
  querySingleValue(`
    SELECT CAST(COUNT(*) AS VARCHAR(10))
    FROM CampaignFundraiser fundraiser
    INNER JOIN DonationCampaign campaign ON campaign.Id = fundraiser.DonationCampaignId
    WHERE campaign.UniqueId = '${campaignUniqueId}' AND fundraiser.IsDeleted = 0;
  `);

test.beforeAll(async () => {
  api = await authenticatedApi(await signIn());
  anonymous = await anonymousApi();

  const campaign = liveCampaign();
  campaignUniqueId = campaign.uniqueId;
  campaignName = campaign.name;

  originalSettings = (await (await api.get(settingsUrl(campaignUniqueId))).json()).data;
});

test.beforeEach(async () => {
  removeJoinedPages();
  await applySettings(enabledSettings());
});

test.afterAll(async () => {
  restoreFundraiserPages();

  if (originalSettings) {
    await api.post(settingsUrl(campaignUniqueId), {
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

test.describe('Peer-to-peer join endpoint', () => {
  test('Join_NoBearerToken_IsRefusedAndWritesNothing', async () => {
    const response = await anonymous.post(joinUrl(campaignUniqueId), {
      data: { displayName: 'Anonymous Intruder' },
    });

    expect(response.status()).toBe(401);
    expect(livePageCount()).toBe('0');
  });

  test('JoinContext_NoBearerToken_IsRefused', async () => {
    const response = await anonymous.get(joinUrl(campaignUniqueId));

    expect(response.status()).toBe(401);
  });

  test('Join_MalformedBearerToken_IsRefused', async () => {
    const forged = await authenticatedApi('not.a.real.token');

    const response = await forged.post(joinUrl(campaignUniqueId), {
      data: { displayName: 'Forged Token' },
    });
    await forged.dispose();

    expect(response.status()).toBe(401);
  });

  test('JoinContext_CampaignWithFundraisingOn_ReturnsEveryFieldTheFrontendContractDeclares', async () => {
    const { data } = await (await api.get(joinUrl(campaignUniqueId))).json();

    expect(Object.keys(data).sort()).toEqual(
      [
        'alreadyJoined',
        'blockedReason',
        'campaignName',
        'campaignSlug',
        'canJoin',
        'currentStatus',
        'defaultPersonalGoal',
        'requiresApproval',
        'slug',
      ].sort(),
    );
    expect(data.campaignName).toBe(campaignName);
    expect(data.canJoin).toBe(true);
    expect(Number(data.defaultPersonalGoal)).toBe(250);
    expect(typeof data.campaignSlug).toBe('string');
  });

  test('Join_SignedInSupporter_CreatesOnePageWithASlugAndAnActiveStatus', async () => {
    const response = await api.post(joinUrl(campaignUniqueId), {
      data: { displayName: 'E2E Fundraiser', personalGoal: 320, story: 'Created by the e2e suite.' },
    });

    expect(response.status()).toBe(200);

    const { data } = await response.json();
    expect(data.alreadyJoined).toBe(false);
    expect(data.currentStatus).toBe('Active');
    expect(data.slug).toMatch(/^[a-z0-9-]+$/);
    expect(typeof data.campaignSlug).toBe('string');

    expect(livePageCount()).toBe('1');
  });

  test('Join_PersistedRow_HoldsExactlyWhatTheRequestSent', async () => {
    await api.post(joinUrl(campaignUniqueId), {
      data: { displayName: 'E2E Fundraiser', personalGoal: 320, story: 'Created by the e2e suite.' },
    });

    const stored = querySingleValue(`
      SELECT TOP 1 fundraiser.DisplayName + '|' + CAST(fundraiser.PersonalGoal AS VARCHAR(20))
        + '|' + fundraiser.Story + '|' + fundraiser.CurrentStatus
      FROM CampaignFundraiser fundraiser
      INNER JOIN DonationCampaign campaign ON campaign.Id = fundraiser.DonationCampaignId
      WHERE campaign.UniqueId = '${campaignUniqueId}' AND fundraiser.IsDeleted = 0;
    `);

    const [displayName, goal, story, status] = stored.split('|');
    expect(displayName).toBe('E2E Fundraiser');
    expect(Number(goal)).toBe(320);
    expect(story).toBe('Created by the e2e suite.');
    expect(status).toBe('Active');
  });

  test('Join_NoGoalSupplied_FallsBackToTheCampaignDefault', async () => {
    await api.post(joinUrl(campaignUniqueId), { data: { displayName: 'E2E Fundraiser' } });

    const goal = querySingleValue(`
      SELECT TOP 1 CAST(fundraiser.PersonalGoal AS VARCHAR(20))
      FROM CampaignFundraiser fundraiser
      INNER JOIN DonationCampaign campaign ON campaign.Id = fundraiser.DonationCampaignId
      WHERE campaign.UniqueId = '${campaignUniqueId}' AND fundraiser.IsDeleted = 0;
    `);

    expect(Number(goal)).toBe(250);
  });

  test('Join_SecondAttempt_ReturnsTheExistingPageAndCreatesNoDuplicate', async () => {
    const first = await api.post(joinUrl(campaignUniqueId), {
      data: { displayName: 'E2E Fundraiser' },
    });
    const second = await api.post(joinUrl(campaignUniqueId), {
      data: { displayName: 'A Completely Different Name' },
    });

    expect(second.status()).toBe(200);

    const firstBody = await first.json();
    const secondBody = await second.json();

    expect(secondBody.data.alreadyJoined).toBe(true);
    expect(secondBody.data.slug).toBe(firstBody.data.slug);
    expect(livePageCount()).toBe('1');
  });

  test('Join_CampaignRequiringApproval_CreatesAPendingPage', async () => {
    await applySettings(enabledSettings({ requiresApproval: true }));

    const { data } = await (
      await api.post(joinUrl(campaignUniqueId), { data: { displayName: 'E2E Fundraiser' } })
    ).json();

    expect(data.currentStatus).toBe('PendingApproval');

    const approved = querySingleValue(`
      SELECT TOP 1 CASE WHEN fundraiser.ApprovedOnUtc IS NULL THEN 'null' ELSE 'set' END
      FROM CampaignFundraiser fundraiser
      INNER JOIN DonationCampaign campaign ON campaign.Id = fundraiser.DonationCampaignId
      WHERE campaign.UniqueId = '${campaignUniqueId}' AND fundraiser.IsDeleted = 0;
    `);

    expect(approved).toBe('null');
  });

  test('Join_CampaignWithFundraisingOff_IsRefusedAndWritesNothing', async () => {
    await applySettings(enabledSettings({ isPeerToPeerEnabled: false }));

    const response = await api.post(joinUrl(campaignUniqueId), {
      data: { displayName: 'E2E Fundraiser' },
    });

    expect(response.status()).toBe(400);
    expect(livePageCount()).toBe('0');
  });

  test('JoinContext_CampaignWithFundraisingOff_SaysSoInsteadOfOfferingTheForm', async () => {
    await applySettings(enabledSettings({ isPeerToPeerEnabled: false }));

    const { data } = await (await api.get(joinUrl(campaignUniqueId))).json();

    expect(data.canJoin).toBe(false);
    expect(data.blockedReason).toBeTruthy();
  });

  test('Join_UnknownCampaign_IsRefusedWithoutRevealingWhetherItExists', async () => {
    const unknown = await api.post(joinUrl('00000000-0000-0000-0000-0000000000ff'), {
      data: { displayName: 'E2E Fundraiser' },
    });

    expect(unknown.status()).toBe(400);
    expect((await unknown.json()).message).toBe('Campaign not found.');
  });

  test('Join_AnotherOrganizersUnpublishedCampaign_GivesTheSameAnswerAsAnUnknownOne', async () => {
    const foreign = await api.post(joinUrl(foreignCampaignUniqueId()), {
      data: { displayName: 'E2E Fundraiser' },
    });
    const unknown = await api.post(joinUrl('00000000-0000-0000-0000-0000000000ff'), {
      data: { displayName: 'E2E Fundraiser' },
    });

    expect(foreign.status()).toBe(unknown.status());
  });

  test('Join_BlankDisplayName_IsRefusedAndWritesNothing', async () => {
    const response = await api.post(joinUrl(campaignUniqueId), { data: { displayName: '   ' } });

    expect(response.status()).toBe(400);
    expect(livePageCount()).toBe('0');
  });

  test('Join_DisplayNameLongerThanTheLimit_IsRefusedAndWritesNothing', async () => {
    const response = await api.post(joinUrl(campaignUniqueId), {
      data: { displayName: 'a'.repeat(81) },
    });

    expect(response.status()).toBe(400);
    expect(livePageCount()).toBe('0');
  });

  test('Join_GoalOfZero_IsRefusedAndWritesNothing', async () => {
    const response = await api.post(joinUrl(campaignUniqueId), {
      data: { displayName: 'E2E Fundraiser', personalGoal: 0 },
    });

    expect(response.status()).toBe(400);
    expect(livePageCount()).toBe('0');
  });

  test('Join_Refusal_CarriesNoStackTraceOrInternalDetail', async () => {
    const response = await api.post(joinUrl(campaignUniqueId), { data: { displayName: '' } });
    const body = JSON.stringify(await response.json()).toLowerCase();

    expect(body).not.toContain('exception');
    expect(body).not.toContain('stacktrace');
    expect(body).not.toContain('ideas.donation');
    expect(body).not.toContain('sql');
  });
});
