import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupporterSignUpRequest } from 'app/interface/donationInter/supporterSignUpDto';

const post = vi.fn();

vi.mock('app/service/httpClient/HttpClient', () => ({
  default: {
    post: (...args: unknown[]) => post(...args),
  },
}));

const { signUpAsSupporter } = await import('./supporterSignUpService');

const CAMPAIGN_ID = 'a7f3c2d1';
const SIGN_UP_URL = `/api/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/supporter-sign-up`;

const request: SupporterSignUpRequest = {
  firstName: 'Sarah',
  lastName: 'Khan',
  emailAddress: 'sarah.khan@example.com',
  password: 'Fundrais3!',
};

beforeEach(() => {
  post.mockReset();
});

describe('signUpAsSupporter', () => {
  it('SignUp_Accepted_PostsToTheCampaignAndReturnsTheMessageTheApiChose', async () => {
    post.mockResolvedValue({ data: { success: true, message: 'Sign in to continue.' } });

    const message = await signUpAsSupporter(CAMPAIGN_ID, request);

    expect(post).toHaveBeenCalledWith(SIGN_UP_URL, request);
    expect(message).toBe('Sign in to continue.');
  });

  it('SignUp_Refused_ThrowsWithTheReasonTheApiGave', async () => {
    post.mockResolvedValue({
      data: { success: false, message: 'This campaign is not accepting supporter fundraising pages.' },
    });

    await expect(signUpAsSupporter(CAMPAIGN_ID, request)).rejects.toThrow(
      'This campaign is not accepting supporter fundraising pages.',
    );
  });

  it('SignUp_RefusedWithNoReason_ThrowsSomethingAUserCanRead', async () => {
    post.mockResolvedValue({ data: { success: false } });

    await expect(signUpAsSupporter(CAMPAIGN_ID, request)).rejects.toThrow(
      'Your account could not be created.',
    );
  });

  it('SignUp_ResponseWithNoBody_IsTreatedAsAFailureRatherThanASilentSuccess', async () => {
    post.mockResolvedValue({});

    await expect(signUpAsSupporter(CAMPAIGN_ID, request)).rejects.toThrow(
      'Your account could not be created.',
    );
  });
});
