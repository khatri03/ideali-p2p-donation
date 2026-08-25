/** One supporter page in the standings. */
export interface LeaderboardFundraiser {
  /**
   * Competition ranking: equal amounts share a place, and the next distinct amount takes the position
   * it actually occupies. Sent by the API so the screen never has to work it out a second way.
   */
  rank: number;
  displayName: string;
  slug: string;
  raisedAmount: number;
  goal: number | null;
  donorCount: number;
  photoUniqueId: string | null;
  teamName: string | null;
}

/** One team in the standings, counted from the pages currently in it. */
export interface LeaderboardTeam {
  rank: number;
  name: string;
  slug: string;
  raisedAmount: number;
  teamGoal: number | null;
  memberCount: number;
}

/** One gift, not one donor. Donors who asked to stay anonymous never reach this list. */
export interface LeaderboardGift {
  rank: number;
  donorName: string;
  amount: number;
  givenOnUtc: string;
  fundraiserDisplayName: string | null;
}

export interface PeerToPeerLeaderboard {
  campaignName: string;
  campaignSlug: string;
  organizerName: string;
  campaignUniqueId: string;
  currencySymbol: string;
  isOrganizerOnly: boolean;
  areTeamsAllowed: boolean;
  isCampaignClosed: boolean;
  campaignRaisedAmount: number;
  fundraiserRaisedAmount: number;
  fundraiserCount: number;
  teamCount: number;
  fundraisers: LeaderboardFundraiser[];
  teams: LeaderboardTeam[];
  topGifts: LeaderboardGift[];
}

export interface PeerToPeerLeaderboardResponse {
  data: PeerToPeerLeaderboard;
  success: boolean;
  message: string | null;
}
