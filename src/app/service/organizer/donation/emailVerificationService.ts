import HttpClient from '../../httpClient/HttpClient';
import {
  EmailVerificationResponse,
  EmailVerificationResult,
} from 'app/interface/donationInter/emailVerificationDto';

const peerToPeerUrl = (campaignUniqueId: string, action: string) =>
  `/api/donation/campaign/${campaignUniqueId}/peer-to-peer/${action}`;

/**
 * Spends the token from a confirmation email.
 *
 * The token travels in the body rather than the query string. It reaches this application in a link,
 * which is unavoidable, but from here on it stays out of request logs and referrer headers.
 */
export const confirmEmailAddress = async (
  campaignUniqueId: string,
  token: string,
): Promise<EmailVerificationResult> => {
  const { data } = await HttpClient.post<EmailVerificationResponse>(
    peerToPeerUrl(campaignUniqueId, 'verify-email'),
    { token },
  );

  if (!data?.success || !data.data) {
    throw new Error(data?.message ?? 'This confirmation link is no longer valid.');
  }

  return data.data;
};

/**
 * Asks for a fresh confirmation link and returns the sentence the API wants shown. That sentence is
 * the same whether an address needed confirming or not, so it is passed through rather than replaced.
 */
export const resendConfirmationEmail = async (
  campaignUniqueId: string,
  emailAddress: string,
): Promise<string> => {
  const { data } = await HttpClient.post<EmailVerificationResponse>(
    peerToPeerUrl(campaignUniqueId, 'resend-verification'),
    { emailAddress },
  );

  if (!data?.success) {
    throw new Error(data?.message ?? 'We could not send another link just now.');
  }

  return data.message ?? 'If that address needs confirming, we have sent a new link to it.';
};
