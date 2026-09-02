export type FundraiserStatus = 'PendingApproval' | 'Active' | 'Paused' | 'Rejected';

/**
 * Which rule stopped a caller from creating a page. Screens act on this rather than on the wording of
 * `blockedReason`, because two refusals that read alike are answered differently: an unconfirmed
 * address is a wait the caller can end themselves, and running the campaign is not.
 */
export type FundraiserJoinBlock =
  | 'None'
  | 'FundraisingClosed'
  | 'EmailNotConfirmed'
  | 'RunsThisCampaign';

/**
 * Whether a supporter wants a team, and which one. Asked while they set their page up rather than left
 * to be found afterwards, because a supporter who is never asked never joins one.
 */
export type FundraiserTeamChoiceKind = 'None' | 'JoinExisting' | 'CreateNew';

/** What a supporter may set on a team they are starting. Matches what the team screens send. */
export interface CampaignTeamSave {
  name: string;
  story: string | null;
  teamGoal: number | null;
}

/** The team half of what a supporter sends when they set their page up. */
export interface FundraiserTeamChoice {
  kind: FundraiserTeamChoiceKind;
  /** Address of the team being joined. Read only when `kind` is `JoinExisting`. */
  teamSlug: string | null;
  /** The team being started. Read only when `kind` is `CreateNew`. */
  newTeam: CampaignTeamSave | null;
}

/** What a supporter sends to create their fundraising page. */
export interface FundraiserJoinRequest {
  displayName: string;
  personalGoal: number | null;
  story: string | null;
  team: FundraiserTeamChoice;
}

/** What the join screen reads before it is filled in. */
export interface FundraiserJoinContext {
  campaignName: string;
  /** First segment of the public address of every page on this campaign. */
  campaignSlug: string | null;
  /** The campaign's suggested goal, used to prefill the field. Null when the organiser set none. */
  defaultPersonalGoal: number | null;
  requiresApproval: boolean;
  /** False when this campaign does not use teams, so the screen never asks a question with no answer. */
  areTeamsAllowed: boolean;
  /** False when nobody can join right now. The server checks the same conditions on submit. */
  canJoin: boolean;
  /** Sentence to show when canJoin is false. */
  blockedReason: string | null;
  /** Which rule stopped the caller. `None` when nothing did. */
  blockedKind: FundraiserJoinBlock;
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
  /** Address of the team the page belongs to, or null when the supporter fundraises alone. */
  teamSlug: string | null;
  /** The team's name, so the success screen can say which team without a second read. */
  teamName: string | null;
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
