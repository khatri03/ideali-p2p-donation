import { PeerToPeerSettingsDetail } from 'app/interface/donationInter/peerToPeerDto';
import {
  FundraiserJoinContext,
  FundraiserJoinResult,
} from 'app/interface/donationInter/fundraiserJoinDto';
import { FundraiserPage } from 'app/interface/donationInter/fundraiserPageDto';

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

export const buildFundraiserPage = (
  overrides: Partial<FundraiserPage> = {},
): FundraiserPage => ({
  state: 'Available',
  displayName: 'Sarah Khan',
  story: 'My uncle walks four kilometres for water.',
  slug: 'sarah-khan',
  campaignSlug: 'winter-appeal',
  campaignName: 'Winter Appeal',
  organizerName: 'Hope Foundation',
  campaignUniqueId: '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881',
  fundraisingSinceUtc: '2026-03-04T00:00:00Z',
  currencySymbol: 'USD',
  goal: 500,
  raisedAmount: 310,
  donorCount: 22,
  campaignFundraiserCount: 86,
  recentSupporters: [
    { donorName: 'Ahmed K.', amount: 50, givenOnUtc: '2026-03-10T00:00:00Z' },
    { donorName: 'Anonymous', amount: 25, givenOnUtc: '2026-03-09T00:00:00Z' },
  ],
  ...overrides,
});
