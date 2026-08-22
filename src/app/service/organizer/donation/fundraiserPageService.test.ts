import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();

vi.mock('../../httpClient/HttpClient', () => ({ default: { get: (...args: unknown[]) => get(...args) } }));

const { getFundraiserPage } = await import('./fundraiserPageService');

const page = {
  state: 'Available',
  displayName: 'Sarah Khan',
  slug: 'sarah-khan',
  campaignSlug: 'winter-appeal',
};

describe('fundraiserPageService', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('Read_LivePage_CallsTheAddressTheDonorSeesMinusTheApiPrefix', async () => {
    get.mockResolvedValue({ data: { success: true, data: page } });

    const result = await getFundraiserPage('winter-appeal', 'sarah-khan');

    expect(get).toHaveBeenCalledWith('/api/campaigns/winter-appeal/sarah-khan');
    expect(result.displayName).toBe('Sarah Khan');
  });

  /** A slug arrives from the URL bar, so it is caller input and never interpolated raw. */
  it('Read_SlugWithPathCharacters_IsEncodedRatherThanChangingTheRequestedPath', async () => {
    get.mockResolvedValue({ data: { success: true, data: page } });

    await getFundraiserPage('winter-appeal', '../../admin/users');

    expect(get).toHaveBeenCalledWith('/api/campaigns/winter-appeal/..%2F..%2Fadmin%2Fusers');
  });

  it('Read_ApiRefusesThePage_ThrowsTheMessageTheApiChoseRatherThanInventingOne', async () => {
    get.mockResolvedValue({ data: { success: false, message: 'Fundraising page not found.', data: null } });

    await expect(getFundraiserPage('winter-appeal', 'nobody')).rejects.toThrow(
      'Fundraising page not found.',
    );
  });

  it('Read_ApiAnswersWithoutABody_StillFailsWithASentenceSafeToShow', async () => {
    get.mockResolvedValue({ data: null });

    await expect(getFundraiserPage('winter-appeal', 'sarah-khan')).rejects.toThrow(
      'Fundraising page not found.',
    );
  });
});
