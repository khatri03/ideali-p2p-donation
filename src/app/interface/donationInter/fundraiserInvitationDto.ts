/** Invitations to fundraise, as the API describes them. */

export type InvitationStatus = 'Sent' | 'Opened' | 'Accepted' | 'Expired' | 'Not sent';

export interface InvitationQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
}

export interface Invitation {
  uniqueId: string;
  emailAddress: string;
  status: InvitationStatus;
  invitedByName: string;
  createdOnUtc: string;
  expiresOnUtc: string;
  openedOnUtc?: string | null;
  acceptedOnUtc?: string | null;
  /** Why a send was held back, when it was. Absent for every invitation that did go out. */
  suppressionReason?: string | null;
}

export interface InvitationSummary {
  sent: number;
  opened: number;
  accepted: number;
  expired: number;
  suppressed: number;
}

export interface InvitationPage {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: Invitation[];
}

export interface InvitationListResult {
  campaignName: string;
  summary: InvitationSummary;
  page: InvitationPage;
}

export interface InvitationSendRequest {
  emailAddresses: string[];
  personalMessage?: string;
}

/** Counts only. The API never says which address fell into which bucket, and neither does this. */
export interface InvitationSendResult {
  accepted: number;
  skipped: number;
  message: string;
}

export interface InvitationPreview {
  subject: string;
  bodyHtml: string;
}

export interface SupporterCandidate {
  emailAddress: string;
  displayName: string;
  isAlreadyFundraising: boolean;
  isAlreadyInvited: boolean;
}

export interface InvitationLanding {
  campaignUniqueId: string;
  campaignName: string;
  organizerName: string;
  invitedByName: string;
  personalMessage?: string | null;
  emailAddress: string;
}

export interface InvitationAcceptRequest {
  token: string;
  displayName: string;
  story?: string;
  personalGoal?: number;
}

export interface InvitationAcceptResult {
  fundraiserUniqueId: string;
  slug: string;
  campaignSlug: string;
  isAwaitingApproval: boolean;
}

export interface InvitationResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
