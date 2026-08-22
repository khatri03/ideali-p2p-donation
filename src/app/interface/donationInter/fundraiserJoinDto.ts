export type FundraiserStatus = 'PendingApproval' | 'Active' | 'Paused' | 'Rejected';

/** What a supporter sends to create their fundraising page. */
export interface FundraiserJoinRequest {
  displayName: string;
  personalGoal: number | null;
  story: string | null;
}

/** What the join screen reads before it is filled in. */
export interface FundraiserJoinContext {
  campaignName: string;
  /** First segment of the public address of every page on this campaign. */
  campaignSlug: string | null;
  /** The campaign's suggested goal, used to prefill the field. Null when the organiser set none. */
  defaultPersonalGoal: number | null;
  requiresApproval: boolean;
  /** False when nobody can join right now. The server checks the same conditions on submit. */
  canJoin: boolean;
  /** Sentence to show when canJoin is false. */
  blockedReason: string | null;
  /** True when this supporter already has a page here, so the screen offers it instead of a second. */
  alreadyJoined: boolean;
  slug: string | null;
  currentStatus: FundraiserStatus | null;
}

export interface FundraiserJoinResult {
  slug: string;
  campaignSlug: string | null;
  currentStatus: FundraiserStatus;
  alreadyJoined: boolean;
}

export interface FundraiserJoinContextResponse {
  data: FundraiserJoinContext;
  success: boolean;
  message: string | null;
}

export interface FundraiserJoinResultResponse {
  data: FundraiserJoinResult;
  success: boolean;
  message: string | null;
}
