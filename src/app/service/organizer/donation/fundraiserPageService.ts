import HttpClient from '../../httpClient/HttpClient';
import {
  FundraiserPage,
  FundraiserPageResponse,
} from 'app/interface/donationInter/fundraiserPageDto';

/**
 * Mirrors the public address a donor sees, minus the /api prefix.
 * Both segments are encoded: a slug reaches this function from the URL bar, so it is caller input.
 */
const fundraiserPageUrl = (campaignSlug: string, fundraiserSlug: string) =>
  `/api/campaigns/${encodeURIComponent(campaignSlug)}/${encodeURIComponent(fundraiserSlug)}`;

/**
 * Reads a supporter's public fundraising page. Anonymous — a donor never has to hold an account to
 * give — so nothing here sends or expects credentials.
 *
 * The API answers "not found" identically for an unknown campaign, an unknown page and a deleted one,
 * and that single sentence is passed through unchanged rather than being expanded into a guess.
 */
export const getFundraiserPage = async (
  campaignSlug: string,
  fundraiserSlug: string,
): Promise<FundraiserPage> => {
  const { data } = await HttpClient.get<FundraiserPageResponse>(
    fundraiserPageUrl(campaignSlug, fundraiserSlug),
  );

  if (!data?.success || !data.data) {
    throw new Error(data?.message ?? 'Fundraising page not found.');
  }

  return data.data;
};
