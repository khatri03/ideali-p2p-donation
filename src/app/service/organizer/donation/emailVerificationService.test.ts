import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.fn();

vi.mock('../../httpClient/HttpClient', () => ({ default: { post: (...args: unknown[]) => post(...args) } }));

const { confirmEmailAddress, resendConfirmationEmail } = await import('./emailVerificationService');

const CAMPAIGN_ID = '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881';
const TOKEN = 'kA7-token_value';

describe('emailVerificationService', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it('Confirm_ValidToken_CallsTheCampaignEndpointAndReturnsWhatWasConfirmed', async () => {
    post.mockResolvedValue({
      data: { success: true, data: { campaignUniqueId: CAMPAIGN_ID, campaignName: 'Winter appeal' } },
    });

    const result = await confirmEmailAddress(CAMPAIGN_ID, TOKEN);

    expect(post).toHaveBeenCalledWith(
      `/api/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/verify-email`,
      { token: TOKEN },
    );
    expect(result.campaignName).toBe('Winter appeal');
  });

  /**
   * A token in a query string reaches request logs and referrer headers. It travels in the body so
   * that following the link is the only place it is ever visible.
   */
  it('Confirm_AnyToken_NeverPutsItInTheUrl', async () => {
    post.mockResolvedValue({ data: { success: true, data: { campaignUniqueId: CAMPAIGN_ID, campaignName: 'x' } } });

    await confirmEmailAddress(CAMPAIGN_ID, TOKEN);

    expect(post.mock.calls[0][0]).not.toContain(TOKEN);
  });

  it('Confirm_TokenRefused_RaisesTheServersOwnWording', async () => {
    post.mockResolvedValue({ data: { success: false, message: 'This confirmation link is no longer valid.' } });

    await expect(confirmEmailAddress(CAMPAIGN_ID, TOKEN)).rejects.toThrow(
      'This confirmation link is no longer valid.',
    );
  });

  it('Confirm_AcceptedWithoutAnyDetail_IsTreatedAsARefusal', async () => {
    post.mockResolvedValue({ data: { success: true } });

    await expect(confirmEmailAddress(CAMPAIGN_ID, TOKEN)).rejects.toThrow();
  });

  it('Resend_Requested_SendsTheAddressAndPassesTheAnswerThrough', async () => {
    post.mockResolvedValue({ data: { success: true, message: 'If that address needs confirming, we have sent a new link to it.' } });

    const message = await resendConfirmationEmail(CAMPAIGN_ID, 'sarah@example.com');

    expect(post).toHaveBeenCalledWith(
      `/api/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/resend-verification`,
      { emailAddress: 'sarah@example.com' },
    );
    expect(message).toBe('If that address needs confirming, we have sent a new link to it.');
  });

  it('Resend_Refused_RaisesRatherThanReportingSuccess', async () => {
    post.mockResolvedValue({ data: { success: false, message: 'Campaign not found.' } });

    await expect(resendConfirmationEmail(CAMPAIGN_ID, 'sarah@example.com')).rejects.toThrow(
      'Campaign not found.',
    );
  });
});
