import HttpClient from '../../httpClient/HttpClient';
import {
  ModeratedFundraiser,
  ModeratedFundraiserDetail,
  ModeratedTeam,
  ModeratedTeamDetail,
  ModerationActionResponse,
  ModerationDetailResponse,
  ModerationListResponse,
  ModerationListResult,
  ModerationQuery,
  ModerationRequest,
} from 'app/interface/donationInter/peerToPeerModerationDto';

const LIST_FAILED = 'The fundraising pages on this campaign could not be read.';
const TEAM_LIST_FAILED = 'The teams on this campaign could not be read.';
const PAGE_FAILED = 'That fundraising page could not be read.';
const TEAM_FAILED = 'That team could not be read.';
const ACTION_FAILED = 'That change could not be saved.';

/**
 * Both identifiers come from the address bar, so both are caller input and both are encoded. Whether
 * the campaign belongs to the signed-in charity is decided by the server, never here.
 */
const moderationUrl = (campaignUniqueId: string) =>
  `/api/donation/campaign/${encodeURIComponent(campaignUniqueId)}/peer-to-peer`;

const toParams = (query: ModerationQuery) => ({
  page: query.page,
  pageSize: query.pageSize,
  search: query.search || undefined,
  status: query.status || undefined,
  isHidden: query.isHidden === undefined ? undefined : query.isHidden,
  sortBy: query.sortBy,
});

const readList = async <T>(
  url: string,
  query: ModerationQuery,
  failureMessage: string,
): Promise<ModerationListResult<T>> => {
  const { data } = await HttpClient.get<ModerationListResponse<T>>(url, { params: toParams(query) });

  if (!data?.success || !data.data?.page || !Array.isArray(data.data.page.pageData)) {
    throw new Error(data?.message ?? failureMessage);
  }

  return data.data;
};

const readDetail = async <T>(url: string, failureMessage: string): Promise<T> => {
  const { data } = await HttpClient.get<ModerationDetailResponse<T>>(url);

  if (!data?.success || !data.data) {
    throw new Error(data?.message ?? failureMessage);
  }

  return data.data;
};

const sendAction = async (url: string, request: ModerationRequest): Promise<void> => {
  const { data } = await HttpClient.post<ModerationActionResponse>(url, request);

  if (!data?.success) {
    throw new Error(data?.message ?? ACTION_FAILED);
  }
};

export const getModeratedFundraisers = (campaignUniqueId: string, query: ModerationQuery) =>
  readList<ModeratedFundraiser>(`${moderationUrl(campaignUniqueId)}/fundraisers`, query, LIST_FAILED);

export const getModeratedFundraiser = (campaignUniqueId: string, fundraiserUniqueId: string) =>
  readDetail<ModeratedFundraiserDetail>(
    `${moderationUrl(campaignUniqueId)}/fundraisers/${encodeURIComponent(fundraiserUniqueId)}`,
    PAGE_FAILED,
  );

export const moderateFundraiser = (
  campaignUniqueId: string,
  fundraiserUniqueId: string,
  request: ModerationRequest,
) =>
  sendAction(
    `${moderationUrl(campaignUniqueId)}/fundraisers/${encodeURIComponent(fundraiserUniqueId)}/moderate`,
    request,
  );

export const getModeratedTeams = (campaignUniqueId: string, query: ModerationQuery) =>
  readList<ModeratedTeam>(`${moderationUrl(campaignUniqueId)}/teams`, query, TEAM_LIST_FAILED);

export const getModeratedTeam = (campaignUniqueId: string, teamUniqueId: string) =>
  readDetail<ModeratedTeamDetail>(
    `${moderationUrl(campaignUniqueId)}/teams/${encodeURIComponent(teamUniqueId)}`,
    TEAM_FAILED,
  );

export const moderateTeam = (
  campaignUniqueId: string,
  teamUniqueId: string,
  request: ModerationRequest,
) =>
  sendAction(
    `${moderationUrl(campaignUniqueId)}/teams/${encodeURIComponent(teamUniqueId)}/moderate`,
    request,
  );
