import { PeerToPeerSettingsDetail } from 'app/interface/donationInter/peerToPeerDto';
import {
  FundraiserJoinContext,
  FundraiserJoinResult,
} from 'app/interface/donationInter/fundraiserJoinDto';
import { FundraiserPage } from 'app/interface/donationInter/fundraiserPageDto';
import { MyFundraisingPage } from 'app/interface/donationInter/fundraiserConsoleDto';
import {
  CampaignTeamBrowse,
  CampaignTeamMember,
  CampaignTeamPage,
  CampaignTeamSummary,
} from 'app/interface/donationInter/campaignTeamDto';

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
  photoUniqueId: null,
  currencySymbol: 'USD',
  goal: 500,
  raisedAmount: 310,
  donorCount: 22,
  campaignFundraiserCount: 86,
  team: null,
  recentSupporters: [
    { donorName: 'Ahmed K.', amount: 50, givenOnUtc: '2026-03-10T00:00:00Z' },
    { donorName: 'Anonymous', amount: 25, givenOnUtc: '2026-03-09T00:00:00Z' },
  ],
  ...overrides,
});

export const buildMyFundraisingPage = (
  overrides: Partial<MyFundraisingPage> = {},
): MyFundraisingPage => ({
  uniqueId: '9a3c1f76-2c47-4b2c-9c0e-3f8d51f2b7aa',
  displayName: 'Sarah Khan',
  story: 'My uncle walks four kilometres for water.',
  slug: 'sarah-khan',
  campaignSlug: 'winter-appeal',
  campaignName: 'Winter Appeal',
  organizerName: 'Hope Foundation',
  campaignUniqueId: '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881',
  currentStatus: 'Active',
  isCampaignOpen: true,
  fundraisingSinceUtc: '2026-03-04T00:00:00Z',
  currencySymbol: 'USD',
  goal: 500,
  raisedAmount: 310,
  donorCount: 22,
  photoUniqueId: null,
  areTeamsAllowed: true,
  myTeam: null,
  recentSupporters: [],
  ...overrides,
});

export const buildTeamSummary = (
  overrides: Partial<CampaignTeamSummary> = {},
): CampaignTeamSummary => ({
  uniqueId: '8b1d5c2e-7a41-4f0b-9e33-1c6a2f4d9b70',
  slug: 'the-early-risers',
  name: 'The Early Risers',
  story: 'We run before work and raise as we go.',
  teamGoal: 1000,
  raisedAmount: 400,
  memberCount: 2,
  captainDisplayName: 'Sarah Khan',
  ...overrides,
});

export const buildTeamBrowse = (
  overrides: Partial<CampaignTeamBrowse> = {},
): CampaignTeamBrowse => ({
  campaignName: 'Winter Appeal',
  campaignSlug: 'winter-appeal',
  campaignUniqueId: '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881',
  organizerName: 'Hope Foundation',
  currencySymbol: 'USD',
  areTeamsAllowed: true,
  isFundraiser: true,
  myTeamSlug: null,
  teams: [buildTeamSummary()],
  ...overrides,
});

export const buildTeamMember = (
  overrides: Partial<CampaignTeamMember> = {},
): CampaignTeamMember => ({
  uniqueId: 'c4f0a1b2-9d63-4a58-8f21-6b0e7c3d5a94',
  fundraiserSlug: 'sarah-khan',
  displayName: 'Sarah Khan',
  photoUniqueId: null,
  raisedAmount: 240,
  isCaptain: true,
  joinedOnUtc: '2026-03-04T00:00:00Z',
  ...overrides,
});

export const buildTeamPage = (overrides: Partial<CampaignTeamPage> = {}): CampaignTeamPage => ({
  uniqueId: '8b1d5c2e-7a41-4f0b-9e33-1c6a2f4d9b70',
  slug: 'the-early-risers',
  name: 'The Early Risers',
  story: 'We run before work and raise as we go.',
  teamGoal: 1000,
  raisedAmount: 400,
  donorCount: 31,
  campaignName: 'Winter Appeal',
  campaignSlug: 'winter-appeal',
  campaignUniqueId: '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881',
  organizerName: 'Hope Foundation',
  currencySymbol: 'USD',
  isCampaignOpen: true,
  areTeamsAllowed: true,
  viewerRole: 'Visitor',
  members: [
    buildTeamMember(),
    buildTeamMember({
      uniqueId: 'd7e2b8c1-4a95-4c37-b0f6-2e91d4a7c605',
      fundraiserSlug: 'ahmed-khalid',
      displayName: 'Ahmed Khalid',
      raisedAmount: 160,
      isCaptain: false,
      joinedOnUtc: '2026-03-06T00:00:00Z',
    }),
  ],
  ...overrides,
});
