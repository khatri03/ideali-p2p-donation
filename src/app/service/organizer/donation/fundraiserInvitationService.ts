import HttpClient from '../../httpClient/HttpClient';
import {
  InvitationAcceptRequest,
  InvitationAcceptResult,
  InvitationLanding,
  InvitationListResult,
  InvitationPreview,
  InvitationQuery,
  InvitationResponse,
  InvitationSendRequest,
  InvitationSendResult,
  SupporterCandidate,
} from 'app/interface/donationInter/fundraiserInvitationDto';

const LIST_FAILED = 'The invitations on this campaign could not be read.';
const SUPPORTERS_FAILED = 'The supporters on this campaign could not be read.';
const PREVIEW_FAILED = 'The invitation email could not be prepared.';
const SEND_FAILED = 'Those invitations could not be sent.';
const LANDING_FAILED = 'This invitation could not be read.';
const ACCEPT_FAILED = 'This invitation could not be accepted.';
const UNSUBSCRIBE_FAILED = 'That request could not be completed.';

/**
 * The campaign identifier comes from the address bar, so it is caller input and is encoded. Whether
 * the campaign belongs to the signed-in charity is decided by the server, never here.
 */
const invitationsUrl = (campaignUniqueId: string) =>
  `/api/donation/campaign/${encodeURIComponent(campaignUniqueId)}/peer-to-peer/invitations`;

const invitationUrl = (campaignUniqueId: string) =>
  `/api/donation/campaign/${encodeURIComponent(campaignUniqueId)}/peer-to-peer/invitation`;

const unwrap = <T>(data: InvitationResponse<T> | undefined, failureMessage: string): T => {
  if (!data?.success || data.data === undefined || data.data === null) {
    throw new Error(data?.message ?? failureMessage);
  }

  return data.data;
};

export const getInvitations = async (
  campaignUniqueId: string,
  query: InvitationQuery,
): Promise<InvitationListResult> => {
  const { data } = await HttpClient.get<InvitationResponse<InvitationListResult>>(
    invitationsUrl(campaignUniqueId),
    {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search || undefined,
        status: query.status || undefined,
      },
    },
  );

  const result = unwrap(data, LIST_FAILED);

  if (!result.page || !Array.isArray(result.page.pageData)) {
    throw new Error(LIST_FAILED);
  }

  return result;
};

export const getSupporterCandidates = async (
  campaignUniqueId: string,
  search?: string,
): Promise<SupporterCandidate[]> => {
  const { data } = await HttpClient.get<InvitationResponse<SupporterCandidate[]>>(
    `${invitationsUrl(campaignUniqueId)}/supporters`,
    { params: { search: search || undefined } },
  );

  const result = unwrap(data, SUPPORTERS_FAILED);

  return Array.isArray(result) ? result : [];
};

export const previewInvitation = async (
  campaignUniqueId: string,
  personalMessage?: string,
): Promise<InvitationPreview> => {
  const { data } = await HttpClient.post<InvitationResponse<InvitationPreview>>(
    `${invitationsUrl(campaignUniqueId)}/preview`,
    { emailAddresses: [], personalMessage },
  );

  return unwrap(data, PREVIEW_FAILED);
};

export const sendInvitations = async (
  campaignUniqueId: string,
  request: InvitationSendRequest,
): Promise<InvitationSendResult> => {
  const { data } = await HttpClient.post<InvitationResponse<InvitationSendResult>>(
    invitationsUrl(campaignUniqueId),
    request,
  );

  return unwrap(data, SEND_FAILED);
};

export const openInvitation = async (
  campaignUniqueId: string,
  token: string,
): Promise<InvitationLanding> => {
  const { data } = await HttpClient.get<InvitationResponse<InvitationLanding>>(
    invitationUrl(campaignUniqueId),
    { params: { token } },
  );

  return unwrap(data, LANDING_FAILED);
};

export const acceptInvitation = async (
  campaignUniqueId: string,
  request: InvitationAcceptRequest,
): Promise<InvitationAcceptResult> => {
  const { data } = await HttpClient.post<InvitationResponse<InvitationAcceptResult>>(
    `${invitationUrl(campaignUniqueId)}/accept`,
    request,
  );

  return unwrap(data, ACCEPT_FAILED);
};

export const unsubscribeFromInvitations = async (
  campaignUniqueId: string,
  token: string,
): Promise<string> => {
  const { data } = await HttpClient.post<InvitationResponse<unknown>>(
    `${invitationUrl(campaignUniqueId)}/unsubscribe`,
    null,
    { params: { token } },
  );

  if (!data?.success) {
    throw new Error(data?.message ?? UNSUBSCRIBE_FAILED);
  }

  return data.message ?? 'You will not receive any more of these emails.';
};
