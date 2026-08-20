import { PeerToPeerSettingsDetail } from 'app/interface/donationInter/peerToPeerDto';

/** Shared starting point so each test states only the field it is about. */
export const buildSettings = (
  overrides: Partial<PeerToPeerSettingsDetail> = {},
): PeerToPeerSettingsDetail => ({
  campaignName: 'Winter Appeal',
  canEnable: true,
  blockedReason: null,
  liveFundraiserCount: 0,
  isPeerToPeerEnabled: false,
  defaultPersonalGoal: null,
  allowTeams: false,
  requiresApproval: false,
  leaderboardVisibility: 'Hidden',
  ...overrides,
});
