import HttpClient from '../../httpClient/HttpClient';
import {
  FundraiserJoinContext,
  FundraiserJoinContextResponse,
  FundraiserJoinRequest,
  FundraiserJoinResult,
  FundraiserJoinResultResponse,
} from 'app/interface/donationInter/fundraiserJoinDto';

const joinUrl = (campaignUniqueId: string) =>
  `/api/donation/campaign/${campaignUniqueId}/peer-to-peer/join`;

export const getFundraiserJoinContext = async (
  campaignUniqueId: string,
): Promise<FundraiserJoinContext> => {
  const { data } = await HttpClient.get<FundraiserJoinContextResponse>(joinUrl(campaignUniqueId));

  if (!data?.data) {
    throw new Error('This campaign could not be read.');
  }

  return data.data;
};

export const joinCampaignAsFundraiser = async (
  campaignUniqueId: string,
  request: FundraiserJoinRequest,
): Promise<FundraiserJoinResult> => {
  const { data } = await HttpClient.post<FundraiserJoinResultResponse>(
    joinUrl(campaignUniqueId),
    request,
  );

  if (!data?.success || !data.data) {
    throw new Error(data?.message ?? 'Your fundraising page could not be created.');
  }

  return data.data;
};
