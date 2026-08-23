/**
 * Why a fundraiser page is, or is not, taking money. The screen shows a different designed surface for
 * each one, so the reason arrives as data rather than as a sentence the frontend has to parse.
 */
export type FundraiserPageState =
  | 'Available'
  | 'AwaitingApproval'
  | 'Closed'
  | 'CampaignEnded';

export interface FundraiserPageSupporter {
  /** A first name and a last initial, or "Anonymous". Never a full surname. */
  donorName: string;
  amount: number;
  givenOnUtc: string;
}

export interface FundraiserPage {
  state: FundraiserPageState;
  displayName: string;
  story: string | null;
  slug: string;
  campaignSlug: string;
  campaignName: string;
  organizerName: string;
  /** The campaign the donation flow needs. Already public on the campaign page. */
  campaignUniqueId: string;
  fundraisingSinceUtc: string;
  currencySymbol: string;
  /** The fundraiser's goal, or the campaign default. Null when neither is set. */
  /** The supporter's own photo. Null until they upload one, in which case initials stand in. */
  photoUniqueId: string | null;
  goal: number | null;
  raisedAmount: number;
  donorCount: number;
  campaignFundraiserCount: number;
  recentSupporters: FundraiserPageSupporter[];
}

export interface FundraiserPageResponse {
  data: FundraiserPage;
  success: boolean;
  message: string | null;
}
