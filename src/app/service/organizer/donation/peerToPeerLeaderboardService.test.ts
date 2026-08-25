import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PeerToPeerLeaderboard } from 'app/interface/donationInter/peerToPeerLeaderboardDto';

const get = vi.fn();

vi.mock('../../httpClient/HttpClient', () => ({ default: { get: (...args: unknown[]) => get(...args) } }));

const { getLeaderboard } = await import('./peerToPeerLeaderboardService');

const board: Partial<PeerToPeerLeaderboard> = {
  campaignName: 'Winter appeal',
  campaignSlug: 'winter-appeal',
  fundraisers: [],
  teams: [],
  topGifts: [],
};

describe('peerToPeerLeaderboardService', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('Read_PublishedBoard_CallsTheAddressTheReaderSeesMinusTheApiPrefix', async () => {
    get.mockResolvedValue({ data: { success: true, data: board } });

    const result = await getLeaderboard('winter-appeal');

    expect(get).toHaveBeenCalledWith('/api/campaigns/winter-appeal/leaderboard');
    expect(result.campaignName).toBe('Winter appeal');
  });

  /** A slug arrives from the URL bar, so it is caller input and never interpolated raw. */
  it('Read_SlugWithPathCharacters_IsEncodedRatherThanChangingTheRequestedPath', async () => {
    get.mockResolvedValue({ data: { success: true, data: board } });

    await getLeaderboard('../../admin/users');

    expect(get).toHaveBeenCalledWith('/api/campaigns/..%2F..%2Fadmin%2Fusers/leaderboard');
  });

  it('Read_ApiRefusesTheBoard_ThrowsTheMessageTheApiChoseRatherThanInventingOne', async () => {
    get.mockResolvedValue({ data: { success: false, message: 'Leaderboard not found.', data: null } });

    await expect(getLeaderboard('winter-appeal')).rejects.toThrow('Leaderboard not found.');
  });

  it('Read_ApiAnswersWithoutABody_StillFailsWithASentenceSafeToShow', async () => {
    get.mockResolvedValue({ data: null });

    await expect(getLeaderboard('winter-appeal')).rejects.toThrow('Leaderboard not found.');
  });
});
