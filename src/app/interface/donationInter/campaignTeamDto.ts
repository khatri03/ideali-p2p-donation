/**
 * What the caller may do on a team. Decided by the server against the team row and sent as data, so the
 * screen never has to work it out from a role claim. Hiding a control is presentation only: every
 * captain action is authorised again on the way in.
 */
import { FundraiserPageSupporter } from './fundraiserPageDto';

export type CampaignTeamViewerRole = 'Visitor' | 'Member' | 'Captain';

/** What a fundraiser may set on a team, creating it or editing it later. */
export interface CampaignTeamSave {
  name: string;
  story: string | null;
  teamGoal: number | null;
}

export interface CampaignTeamSummary {
  uniqueId: string;
  slug: string;
  name: string;
  story: string | null;
  teamGoal: number | null;
  raisedAmount: number;
  memberCount: number;
  captainDisplayName: string;
}

export interface CampaignTeamBrowse {
  campaignName: string;
  campaignSlug: string;
  campaignUniqueId: string;
  organizerName: string;
  currencySymbol: string;
  /** False stops new teams and new joins, and leaves the teams that already exist readable. */
  areTeamsAllowed: boolean;
  /** True when the caller holds a fundraising page on this campaign, whatever state it is in. */
  isFundraiser: boolean;
  /** True only when the charity publishes the standings to everyone, so no public surface offers a dead link. */
  isLeaderboardPublished: boolean;
  /** The team the caller is already in, so the screen offers the way to it rather than a second join. */
  myTeamSlug: string | null;
  teams: CampaignTeamSummary[];
}

export interface CampaignTeamMember {
  /** Identifies the membership, not the person: it stops meaning anything the moment they leave. */
  uniqueId: string;
  fundraiserSlug: string;
  displayName: string;
  photoUniqueId: string | null;
  raisedAmount: number;
  isCaptain: boolean;
  joinedOnUtc: string;
}

export interface CampaignTeamPage {
  uniqueId: string;
  slug: string;
  name: string;
  story: string | null;
  teamGoal: number | null;
  /** Derived from the member pages every time it is read, never stored as a second credit. */
  raisedAmount: number;
  donorCount: number;
  campaignName: string;
  campaignSlug: string;
  campaignUniqueId: string;
  organizerName: string;
  currencySymbol: string;
  isCampaignOpen: boolean;
  areTeamsAllowed: boolean;
  /** True only when the charity publishes the standings to everyone, so no public surface offers a dead link. */
  isLeaderboardPublished: boolean;
  viewerRole: CampaignTeamViewerRole;
  /** True when the caller holds a fundraising page on this campaign, whatever state it is in. */
  isFundraiser: boolean;
  /** The team the caller is already in, so the page never offers a second join. Null when in none. */
  myTeamSlug: string | null;
  members: CampaignTeamMember[];
  /** The team's most recent gifts, across every member page, newest first. Same shape and same
   * anonymity rules as the ones a fundraiser page publishes. */
  recentSupporters: FundraiserPageSupporter[];
}

export interface CampaignTeamBrowseResponse {
  data: CampaignTeamBrowse;
  success: boolean;
  message: string | null;
}

export interface CampaignTeamPageResponse {
  data: CampaignTeamPage;
  success: boolean;
  message: string | null;
}

export interface CampaignTeamLeaveResponse {
  data: boolean;
  success: boolean;
  message: string | null;
}
