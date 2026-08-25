import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PeerToPeerSettings,
  PeerToPeerSettingsDetail,
} from 'app/interface/donationInter/peerToPeerDto';

const get = vi.fn();
const post = vi.fn();

vi.mock('app/service/httpClient/HttpClient', () => ({
  default: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

const { getPeerToPeerSettings, updatePeerToPeerSettings } = await import('./peerToPeerService');

const CAMPAIGN_ID = 'a7f3c2d1';
const SETTINGS_URL = `/api/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/settings`;

const detail: PeerToPeerSettingsDetail = {
  campaignName: 'Winter Appeal',
  peerToPeerSlug: 'winter-appeal',
  canEnable: true,
  blockedReason: null,
  liveFundraiserCount: 2,
  isPeerToPeerEnabled: true,
  defaultPersonalGoal: 250,
  allowTeams: false,
  requiresApproval: true,
  leaderboardVisibility: 'Public',
};

const values: PeerToPeerSettings = {
  isPeerToPeerEnabled: true,
  defaultPersonalGoal: 250,
  allowTeams: false,
  requiresApproval: true,
  leaderboardVisibility: 'Public',
};

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});

describe('getPeerToPeerSettings', () => {
  it('GetSettings_ValidResponse_ReturnsUnwrappedDetail', async () => {
    get.mockResolvedValue({ data: { data: detail, success: true, message: null } });

    await expect(getPeerToPeerSettings(CAMPAIGN_ID)).resolves.toEqual(detail);
    expect(get).toHaveBeenCalledWith(SETTINGS_URL);
  });

  it('GetSettings_EnvelopeWithoutData_Throws', async () => {
    get.mockResolvedValue({ data: { data: null, success: true, message: null } });

    await expect(getPeerToPeerSettings(CAMPAIGN_ID)).rejects.toThrow(
      'The campaign settings could not be read.',
    );
  });

  it('GetSettings_EmptyBody_Throws', async () => {
    get.mockResolvedValue({ data: undefined });

    await expect(getPeerToPeerSettings(CAMPAIGN_ID)).rejects.toThrow(
      'The campaign settings could not be read.',
    );
  });

  it('GetSettings_TransportFails_PropagatesError', async () => {
    get.mockRejectedValue(new Error('Network Error'));

    await expect(getPeerToPeerSettings(CAMPAIGN_ID)).rejects.toThrow('Network Error');
  });
});

describe('updatePeerToPeerSettings', () => {
  it('UpdateSettings_ServerAccepts_PostsValuesToCampaignUrl', async () => {
    post.mockResolvedValue({ data: { success: true, message: null } });

    await expect(updatePeerToPeerSettings(CAMPAIGN_ID, values)).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith(SETTINGS_URL, values);
  });

  it('UpdateSettings_ServerRejects_ThrowsServerMessage', async () => {
    post.mockResolvedValue({ data: { success: false, message: 'This campaign has ended.' } });

    await expect(updatePeerToPeerSettings(CAMPAIGN_ID, values)).rejects.toThrow(
      'This campaign has ended.',
    );
  });

  it('UpdateSettings_ServerRejectsWithoutMessage_ThrowsGenericSentence', async () => {
    post.mockResolvedValue({ data: { success: false, message: null } });

    await expect(updatePeerToPeerSettings(CAMPAIGN_ID, values)).rejects.toThrow(
      'The settings could not be saved.',
    );
  });

  it('UpdateSettings_EmptyBody_Throws', async () => {
    post.mockResolvedValue({ data: undefined });

    await expect(updatePeerToPeerSettings(CAMPAIGN_ID, values)).rejects.toThrow(
      'The settings could not be saved.',
    );
  });
});
