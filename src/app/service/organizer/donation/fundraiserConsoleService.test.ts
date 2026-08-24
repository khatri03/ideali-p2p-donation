import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const put = vi.fn();
const post = vi.fn();
const remove = vi.fn();

vi.mock('../../httpClient/HttpClient', () => ({
  default: {
    get: (...args: unknown[]) => get(...args),
    put: (...args: unknown[]) => put(...args),
    post: (...args: unknown[]) => post(...args),
    delete: (...args: unknown[]) => remove(...args),
  },
}));

const {
  fundraiserPhotoUrl,
  getMyFundraisingPage,
  getMyFundraisingPages,
  removeMyFundraisingPhoto,
  setMyFundraisingPhoto,
  updateMyFundraisingPage,
} = await import('./fundraiserConsoleService');

const PAGE_ID = '9a3c1f76-2c47-4b2c-9c0e-3f8d51f2b7aa';

const page = { uniqueId: PAGE_ID, displayName: 'Sarah Khan', slug: 'sarah-khan' };

describe('fundraiserConsoleService', () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    post.mockReset();
    remove.mockReset();
  });

  it('List_SignedInSupporter_ReadsTheAddressTheBrowserShowsMinusTheApiPrefix', async () => {
    get.mockResolvedValue({ data: { success: true, data: [page] } });

    const result = await getMyFundraisingPages();

    expect(get).toHaveBeenCalledWith('/api/member/my-fundraising');
    expect(result).toHaveLength(1);
  });

  it('List_ApiAnswersWithoutAList_FailsRatherThanRenderingSomethingElse', async () => {
    get.mockResolvedValue({ data: { success: true, data: null } });

    await expect(getMyFundraisingPages()).rejects.toThrow('Could not load your fundraising pages.');
  });

  it('List_ApiRefuses_ThrowsTheMessageTheApiChoseRatherThanInventingOne', async () => {
    get.mockResolvedValue({ data: { success: false, message: 'Session has expired.', data: null } });

    await expect(getMyFundraisingPages()).rejects.toThrow('Session has expired.');
  });

  /** The identifier reaches this function from the URL bar, so it is caller input and never raw. */
  it('Read_IdentifierWithPathCharacters_IsEncodedRatherThanChangingTheRequestedPath', async () => {
    get.mockResolvedValue({ data: { success: true, data: page } });

    await getMyFundraisingPage('../../admin/users');

    expect(get).toHaveBeenCalledWith('/api/member/my-fundraising/..%2F..%2Fadmin%2Fusers');
  });

  it('Read_PageThatIsNotTheirs_ThrowsTheSameSentenceTheApiUsesForAMissingPage', async () => {
    get.mockResolvedValue({
      data: { success: false, message: 'Fundraising page not found.', data: null },
    });

    await expect(getMyFundraisingPage(PAGE_ID)).rejects.toThrow('Fundraising page not found.');
  });

  it('Update_ValidChanges_ArePutToThatPageAndNothingElse', async () => {
    put.mockResolvedValue({ data: { success: true, data: page } });

    await updateMyFundraisingPage(PAGE_ID, {
      displayName: 'Sarah K',
      personalGoal: 750,
      story: null,
    });

    expect(put).toHaveBeenCalledWith(`/api/member/my-fundraising/${PAGE_ID}`, {
      displayName: 'Sarah K',
      personalGoal: 750,
      story: null,
    });
  });

  it('Update_ApiRefusesTheChange_ThrowsTheApiSentenceRatherThanClaimingSuccess', async () => {
    put.mockResolvedValue({
      data: { success: false, message: 'Enter a goal greater than zero, or leave it blank.', data: null },
    });

    await expect(
      updateMyFundraisingPage(PAGE_ID, { displayName: 'Sarah', personalGoal: 0, story: null }),
    ).rejects.toThrow('Enter a goal greater than zero, or leave it blank.');
  });

  it('Photo_ChosenImage_IsSentAsAMultipartFormAgainstThatPage', async () => {
    post.mockResolvedValue({ data: { success: true, data: 'photo-unique-id' } });

    const photo = new File(['binary'], 'portrait.jpg', { type: 'image/jpeg' });
    const result = await setMyFundraisingPhoto(PAGE_ID, photo);

    const [url, body, config] = post.mock.calls[0];

    expect(url).toBe(`/api/member/my-fundraising/${PAGE_ID}/photo`);
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('photo')).toBe(photo);
    expect((config as { headers: Record<string, string> }).headers['Content-Type']).toBe(
      'multipart/form-data',
    );
    expect(result).toBe('photo-unique-id');
  });

  it('Photo_ApiRefusesTheFile_ThrowsTheApiSentence', async () => {
    post.mockResolvedValue({
      data: { success: false, message: 'Choose a JPG, PNG or WEBP image of 5 MB or less.', data: null },
    });

    const photo = new File(['binary'], 'cv.pdf', { type: 'application/pdf' });

    await expect(setMyFundraisingPhoto(PAGE_ID, photo)).rejects.toThrow(
      'Choose a JPG, PNG or WEBP image of 5 MB or less.',
    );
  });

  it('Photo_Removed_DeletesAgainstThatPage', async () => {
    remove.mockResolvedValue({ data: { success: true, data: null } });

    await removeMyFundraisingPhoto(PAGE_ID);

    expect(remove).toHaveBeenCalledWith(`/api/member/my-fundraising/${PAGE_ID}/photo`);
  });

  it('Photo_RemovalRefused_ThrowsRatherThanLeavingTheScreenClaimingItWorked', async () => {
    remove.mockResolvedValue({ data: { success: false, message: 'Fundraising page not found.' } });

    await expect(removeMyFundraisingPhoto(PAGE_ID)).rejects.toThrow('Fundraising page not found.');
  });

  it('PhotoAddress_StoredPhoto_IsServedFromTheApiRatherThanWhoeverServesTheApp', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');

    expect(fundraiserPhotoUrl('abc-123')).toBe('https://api.example.test/api/images/abc-123.png');
  });

  it('PhotoAddress_ApiAddressWithATrailingSlash_DoesNotDoubleTheSeparator', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/');

    expect(fundraiserPhotoUrl('abc-123')).toBe('https://api.example.test/api/images/abc-123.png');
  });

  it('PhotoAddress_NoApiAddressConfigured_FallsBackToTheSameOrigin', () => {
    vi.stubEnv('VITE_API_BASE_URL', '');

    expect(fundraiserPhotoUrl('abc-123')).toBe('/api/images/abc-123.png');
  });

  it('PhotoAddress_IdentifierWithReservedCharacters_IsEscaped', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');

    expect(fundraiserPhotoUrl('a b/c')).toBe('https://api.example.test/api/images/a%20b%2Fc.png');
  });
});
