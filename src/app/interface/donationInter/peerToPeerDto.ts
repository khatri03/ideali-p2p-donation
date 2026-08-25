export type LeaderboardVisibility = 'Hidden' | 'Public' | 'OrganizerOnly';

export interface PeerToPeerSettings {
  isPeerToPeerEnabled: boolean;
  defaultPersonalGoal: number | null;
  allowTeams: boolean;
  requiresApproval: boolean;
  leaderboardVisibility: LeaderboardVisibility;
}

export interface PeerToPeerSettingsDetail extends PeerToPeerSettings {
  /** Name of the campaign these settings belong to, so a screen reached from a menu can name it. */
  campaignName: string;
  /** First segment of every public fundraiser address on this campaign. Null until it is switched on. */
  peerToPeerSlug: string | null;
  /** False when the campaign cannot support supporter pages at all. Presentation only — the server checks the same conditions. */
  canEnable: boolean;
  /** Sentence to show the organiser when canEnable is false. */
  blockedReason: string | null;
  /** Supporter pages that exist today. Drives the wording of the switch-off confirmation. */
  liveFundraiserCount: number;
}

export interface PeerToPeerSettingsResponse {
  data: PeerToPeerSettingsDetail;
  success: boolean;
  message: string | null;
}

export interface PeerToPeerUpdateResponse {
  success: boolean;
  message: string | null;
}
