import { FundraiserStatus } from './fundraiserConsoleDto';
import { FundraiserPageSupporter } from './fundraiserPageDto';

/** The four decisions a charity can take. Teams accept only Hide and Unhide. */
export type ModerationAction = 'Approve' | 'Reject' | 'Hide' | 'Unhide';

export type ModerationSubject = 'Fundraiser' | 'Team';

export type ModerationSort =
  | 'Newest'
  | 'Oldest'
  | 'NameAscending'
  | 'RaisedDescending'
  | 'RaisedAscending';

export interface ModerationQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: FundraiserStatus;
  isHidden?: boolean;
  sortBy: ModerationSort;
}

/**
 * The two numbers, kept apart on purpose. `raisedThroughFundraisers` is the slice of the campaign total
 * that arrived through a supporter's page; `raisedInTotal` is every settled gift on the campaign.
 * Neither includes tips, and the first can never exceed the second.
 */
export interface PeerToPeerCampaignTotals {
  campaignName: string;
  currencySymbol: string;
  raisedThroughFundraisers: number;
  raisedInTotal: number;
  fundraiserCount: number;
  awaitingApprovalCount: number;
  teamCount: number;
}

/** The repo's paged envelope. Field names come from the API and are not renamed on the way in. */
export interface ModerationPage<T> {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: T[];
}

export interface ModerationHistoryEntry {
  uniqueId: string;
  action: ModerationAction;
  subject: ModerationSubject;
  subjectName: string;
  actedByName: string;
  actedOnUtc: string;
  reason: string | null;
}

export interface ModeratedFundraiser {
  uniqueId: string;
  displayName: string;
  slug: string;
  currentStatus: FundraiserStatus;
  raisedAmount: number;
  donorCount: number;
  goal: number | null;
  teamName: string | null;
  startedOnUtc: string;
  approvedOnUtc: string | null;
}

export interface ModeratedFundraiserDetail extends ModeratedFundraiser {
  campaignSlug: string | null;
  campaignName: string;
  currencySymbol: string;
  story: string | null;
  photoUniqueId: string | null;
  teamSlug: string | null;
  recentSupporters: FundraiserPageSupporter[];
  history: ModerationHistoryEntry[];
}

export interface ModeratedTeam {
  uniqueId: string;
  name: string;
  slug: string;
  captainName: string;
  memberCount: number;
  raisedAmount: number;
  teamGoal: number | null;
  isHidden: boolean;
  startedOnUtc: string;
}

export interface ModeratedTeamMember {
  fundraiserUniqueId: string;
  displayName: string;
  slug: string;
  isCaptain: boolean;
  raisedAmount: number;
  joinedOnUtc: string;
}

export interface ModeratedTeamDetail extends ModeratedTeam {
  campaignSlug: string | null;
  campaignName: string;
  currencySymbol: string;
  story: string | null;
  members: ModeratedTeamMember[];
  history: ModerationHistoryEntry[];
}

export interface ModerationListResult<T> {
  totals: PeerToPeerCampaignTotals;
  page: ModerationPage<T>;
}

export interface ModerationRequest {
  action: ModerationAction;
  reason?: string;
}

export interface ModerationListResponse<T> {
  data: ModerationListResult<T>;
  success: boolean;
  message: string | null;
}

export interface ModerationDetailResponse<T> {
  data: T;
  success: boolean;
  message: string | null;
}

export interface ModerationActionResponse {
  success: boolean;
  message: string | null;
}
