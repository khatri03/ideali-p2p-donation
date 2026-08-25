import {
  ModeratedFundraiser,
  ModeratedFundraiserDetail,
  ModeratedTeam,
  ModeratedTeamDetail,
  ModerationListResult,
  PeerToPeerCampaignTotals,
} from 'app/interface/donationInter/peerToPeerModerationDto';

export const CAMPAIGN_UNIQUE_ID = 'campaign-1';
export const FUNDRAISER_UNIQUE_ID = 'fundraiser-1';
export const TEAM_UNIQUE_ID = 'team-1';

export const buildTotals = (
  overrides: Partial<PeerToPeerCampaignTotals> = {},
): PeerToPeerCampaignTotals => ({
  campaignName: 'Winter Appeal',
  currencySymbol: 'CAD',
  raisedThroughFundraisers: 170,
  raisedInTotal: 670,
  fundraiserCount: 2,
  awaitingApprovalCount: 1,
  teamCount: 1,
  ...overrides,
});

export const buildFundraiser = (
  overrides: Partial<ModeratedFundraiser> = {},
): ModeratedFundraiser => ({
  uniqueId: FUNDRAISER_UNIQUE_ID,
  displayName: 'Sara Malik',
  slug: 'sara-malik',
  currentStatus: 'Active',
  raisedAmount: 170,
  donorCount: 2,
  goal: 500,
  teamName: null,
  startedOnUtc: '2026-01-01T00:00:00Z',
  approvedOnUtc: '2026-01-02T00:00:00Z',
  ...overrides,
});

export const buildFundraiserDetail = (
  overrides: Partial<ModeratedFundraiserDetail> = {},
): ModeratedFundraiserDetail => ({
  ...buildFundraiser(),
  campaignSlug: 'winter-appeal',
  campaignName: 'Winter Appeal',
  currencySymbol: 'CAD',
  story: 'Running the half marathon for the ward.',
  photoUniqueId: null,
  teamSlug: null,
  recentSupporters: [{ donorName: 'Ahmed K.', amount: 60, givenOnUtc: '2026-03-01T00:00:00Z' }],
  history: [],
  ...overrides,
});

export const buildTeam = (overrides: Partial<ModeratedTeam> = {}): ModeratedTeam => ({
  uniqueId: TEAM_UNIQUE_ID,
  name: 'Ward Runners',
  slug: 'ward-runners',
  captainName: 'Sara Malik',
  memberCount: 2,
  raisedAmount: 125,
  teamGoal: 1000,
  isHidden: false,
  startedOnUtc: '2026-01-05T00:00:00Z',
  ...overrides,
});

export const buildTeamDetail = (
  overrides: Partial<ModeratedTeamDetail> = {},
): ModeratedTeamDetail => ({
  ...buildTeam(),
  campaignSlug: 'winter-appeal',
  campaignName: 'Winter Appeal',
  currencySymbol: 'CAD',
  story: 'We run together.',
  members: [
    {
      fundraiserUniqueId: FUNDRAISER_UNIQUE_ID,
      displayName: 'Sara Malik',
      slug: 'sara-malik',
      isCaptain: true,
      raisedAmount: 100,
      joinedOnUtc: '2026-01-05T00:00:00Z',
    },
    {
      fundraiserUniqueId: 'fundraiser-2',
      displayName: 'Omar Shah',
      slug: 'omar-shah',
      isCaptain: false,
      raisedAmount: 25,
      joinedOnUtc: '2026-01-06T00:00:00Z',
    },
  ],
  history: [],
  ...overrides,
});

export const buildList = <T>(
  rows: T[],
  overrides: Partial<ModerationListResult<T>> = {},
): ModerationListResult<T> => ({
  totals: buildTotals(),
  page: {
    pageNo: 1,
    pageSize: 20,
    pageCount: 1,
    totalRecordsCount: rows.length,
    pageData: rows,
  },
  ...overrides,
});
