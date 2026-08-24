import { FundraiserPageSupporter, FundraiserTeam } from './fundraiserPageDto';

/** Where a page stands with the charity. Only Active pages take money. */
export type FundraiserStatus = 'Active' | 'PendingApproval' | 'Paused' | 'Removed';

/**
 * One of the signed-in supporter's own pages. Served only to the person who owns it, so it carries the
 * private half the public page never sees: the identifier every write is addressed by, and the status.
 */
export interface MyFundraisingPage {
  uniqueId: string;
  displayName: string;
  story: string | null;
  slug: string;
  campaignSlug: string | null;
  campaignName: string;
  organizerName: string;
  campaignUniqueId: string;
  currentStatus: FundraiserStatus;
  /** False once the campaign has ended, been cancelled, or stopped accepting supporter pages. */
  isCampaignOpen: boolean;
  fundraisingSinceUtc: string;
  currencySymbol: string;
  goal: number | null;
  raisedAmount: number;
  donorCount: number;
  /** Addresses the stored photo. Null while the supporter has not uploaded one. */
  photoUniqueId: string | null;
  /** False both when the charity never switched teams on and once the campaign closes. */
  areTeamsAllowed: boolean;
  /** The team this page is already counted towards, so the console offers the way to it. */
  myTeam: FundraiserTeam | null;
  recentSupporters: FundraiserPageSupporter[];
}

/** What a supporter may change. Address, status and campaign are absent because they are not theirs. */
export interface FundraiserPageUpdate {
  displayName: string;
  personalGoal: number | null;
  story: string | null;
}

export interface MyFundraisingListResponse {
  data: MyFundraisingPage[];
  success: boolean;
  message: string | null;
}

export interface MyFundraisingPageResponse {
  data: MyFundraisingPage;
  success: boolean;
  message: string | null;
}

export interface FundraiserPhotoResponse {
  data: string;
  success: boolean;
  message: string | null;
}
