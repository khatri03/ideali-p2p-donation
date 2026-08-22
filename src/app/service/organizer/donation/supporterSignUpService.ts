import HttpClient from '../../httpClient/HttpClient';
import {
  SupporterSignUpRequest,
  SupporterSignUpResponse,
} from 'app/interface/donationInter/supporterSignUpDto';

const signUpUrl = (campaignUniqueId: string) =>
  `/api/donation/campaign/${campaignUniqueId}/peer-to-peer/supporter-sign-up`;

/**
 * Creates a supporter account from a campaign and returns the sentence the API wants shown.
 *
 * That sentence is deliberately the same whether the address was free or already held an account, so
 * it is passed through rather than replaced with wording of our own.
 */
export const signUpAsSupporter = async (
  campaignUniqueId: string,
  request: SupporterSignUpRequest,
): Promise<string> => {
  const { data } = await HttpClient.post<SupporterSignUpResponse>(
    signUpUrl(campaignUniqueId),
    request,
  );

  if (!data?.success) {
    throw new Error(data?.message ?? 'Your account could not be created.');
  }

  return data.message ?? 'Your account is ready. Sign in to continue.';
};
