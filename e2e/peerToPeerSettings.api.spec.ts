import { APIRequestContext, expect, test } from '@playwright/test';
import { anonymousApi, authenticatedApi, settingsUrl, signIn } from './support/apiSession';
import { foreignCampaignUniqueId, liveCampaign } from './support/campaignFixtures';

const LEADERBOARD_VISIBILITIES = ['Hidden', 'Public', 'OrganizerOnly'];

let api: APIRequestContext;
let anonymous: APIRequestContext;
let campaignUniqueId: string;
let campaignName: string;
let originalSettings: Record<string, unknown>;

test.beforeAll(async () => {
  api = await authenticatedApi(await signIn());
  anonymous = await anonymousApi();

  const campaign = liveCampaign();
  campaignUniqueId = campaign.uniqueId;
  campaignName = campaign.name;

  const response = await api.get(settingsUrl(campaignUniqueId));
  originalSettings = (await response.json()).data;
});

test.afterAll(async () => {
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

test.describe('Peer-to-peer settings endpoint', () => {
  test('GetSettings_NoBearerToken_IsRefused', async () => {
    const response = await anonymous.get(settingsUrl(campaignUniqueId));

    expect(response.status()).toBe(401);
  });

  test('UpdateSettings_NoBearerToken_IsRefused', async () => {
    const response = await anonymous.post(settingsUrl(campaignUniqueId), {
      data: { isPeerToPeerEnabled: true },
    });

    expect(response.status()).toBe(401);
  });

  test('GetSettings_MalformedBearerToken_IsRefused', async () => {
    const forged = await authenticatedApi('not.a.real.token');

    const response = await forged.get(settingsUrl(campaignUniqueId));
    await forged.dispose();

    expect(response.status()).toBe(401);
  });

  test('GetSettings_OwnCampaign_ReturnsTheCampaignNameTheFormRendersInItsHeading', async () => {
    const response = await api.get(settingsUrl(campaignUniqueId));

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.campaignName).toBe(campaignName);
  });

  test('GetSettings_OwnCampaign_ReturnsEveryFieldTheFrontendContractDeclares', async () => {
    const { data } = await (await api.get(settingsUrl(campaignUniqueId))).json();

    expect(Object.keys(data).sort()).toEqual(
      [
        'allowTeams',
        'blockedReason',
        'campaignName',
        'canEnable',
        'defaultPersonalGoal',
        'isPeerToPeerEnabled',
        'leaderboardVisibility',
        'liveFundraiserCount',
        'peerToPeerSlug',
        'requiresApproval',
      ].sort(),
    );
    expect(typeof data.canEnable).toBe('boolean');
    expect(typeof data.liveFundraiserCount).toBe('number');
  });

  test('GetSettings_LeaderboardVisibility_IsSerialisedAsTextNotAnOrdinal', async () => {
    const { data } = await (await api.get(settingsUrl(campaignUniqueId))).json();

    expect(LEADERBOARD_VISIBILITIES).toContain(data.leaderboardVisibility);
  });

  test('GetSettings_AnotherOrganizersCampaign_IsRefusedWithoutConfirmingItExists', async () => {
    const response = await api.get(settingsUrl(foreignCampaignUniqueId()));

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Campaign not found.');
  });

  test('GetSettings_UnknownCampaign_GivesTheSameAnswerAsAnotherOrganizersCampaign', async () => {
    const unknown = await api.get(settingsUrl('00000000-0000-0000-0000-0000000000ff'));
    const foreign = await api.get(settingsUrl(foreignCampaignUniqueId()));

    expect(unknown.status()).toBe(foreign.status());
    expect((await unknown.json()).message).toBe((await foreign.json()).message);
  });

  test('UpdateSettings_ValidPayload_IsReadBackOnTheNextGet', async () => {
    const update = await api.post(settingsUrl(campaignUniqueId), {
      data: {
        isPeerToPeerEnabled: true,
        defaultPersonalGoal: 250,
        allowTeams: true,
        requiresApproval: true,
        leaderboardVisibility: 'Public',
      },
    });

    expect(update.status()).toBe(200);

    const { data } = await (await api.get(settingsUrl(campaignUniqueId))).json();

    expect(data.isPeerToPeerEnabled).toBe(true);
    expect(Number(data.defaultPersonalGoal)).toBe(250);
    expect(data.allowTeams).toBe(true);
    expect(data.requiresApproval).toBe(true);
    expect(data.leaderboardVisibility).toBe('Public');
  });

  test('UpdateSettings_UnknownLeaderboardVisibility_IsRejected', async () => {
    const response = await api.post(settingsUrl(campaignUniqueId), {
      data: {
        isPeerToPeerEnabled: true,
        defaultPersonalGoal: 100,
        allowTeams: false,
        requiresApproval: false,
        leaderboardVisibility: 'EveryoneIncludingRivals',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('UpdateSettings_AnotherOrganizersCampaign_ChangesNothing', async () => {
    const foreign = foreignCampaignUniqueId();

    const response = await api.post(settingsUrl(foreign), {
      data: {
        isPeerToPeerEnabled: true,
        defaultPersonalGoal: 999,
        allowTeams: true,
        requiresApproval: false,
        leaderboardVisibility: 'Public',
      },
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).message).toBe('Campaign not found.');
  });
});
