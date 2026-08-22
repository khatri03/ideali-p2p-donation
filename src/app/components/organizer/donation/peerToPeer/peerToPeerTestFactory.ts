import { PeerToPeerSettingsDetail } from 'app/interface/donationInter/peerToPeerDto';
import {
  FundraiserJoinContext,
  FundraiserJoinResult,
} from 'app/interface/donationInter/fundraiserJoinDto';

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

export const buildJoinContext = (
  overrides: Partial<FundraiserJoinContext> = {},
): FundraiserJoinContext => ({
  campaignName: 'Winter Appeal',
  campaignSlug: 'winter-appeal',
  defaultPersonalGoal: null,
  requiresApproval: false,
  canJoin: true,
  blockedReason: null,
  alreadyJoined: false,
  slug: null,
  currentStatus: null,
  ...overrides,
});

export const buildJoinResult = (
  overrides: Partial<FundraiserJoinResult> = {},
): FundraiserJoinResult => ({
  slug: 'sarah-khan',
  campaignSlug: 'winter-appeal',
  currentStatus: 'Active',
  alreadyJoined: false,
  ...overrides,
});
