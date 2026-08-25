import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ModeratedFundraiser,
  ModerationListResult,
  ModerationQuery,
} from 'app/interface/donationInter/peerToPeerModerationDto';

const get = vi.fn();
const post = vi.fn();

vi.mock('app/service/httpClient/HttpClient', () => ({
  default: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

const {
  getModeratedFundraiser,
  getModeratedFundraisers,
  getModeratedTeam,
  getModeratedTeams,
  moderateFundraiser,
  moderateTeam,
} = await import('./peerToPeerModerationService');

const CAMPAIGN_ID = 'a7f3c2d1';
const FUNDRAISER_ID = '9c2b71e4';
const TEAM_ID = '4d81aa02';
const BASE = `/api/donation/campaign/${CAMPAIGN_ID}/peer-to-peer`;

const query: ModerationQuery = { page: 2, pageSize: 20, sortBy: 'RaisedDescending' };

const row: ModeratedFundraiser = {
  uniqueId: FUNDRAISER_ID,
  displayName: 'Sara Malik',
  slug: 'sara-malik',
  currentStatus: 'Active',
  raisedAmount: 170,
  donorCount: 2,
  goal: 500,
  teamName: null,
  startedOnUtc: '2026-01-01T00:00:00Z',
  approvedOnUtc: '2026-01-02T00:00:00Z',
};

const listResult: ModerationListResult<ModeratedFundraiser> = {
  totals: {
    campaignName: 'Winter Appeal',
    currencySymbol: 'CAD',
    raisedThroughFundraisers: 170,
    raisedInTotal: 670,
    fundraiserCount: 1,
    awaitingApprovalCount: 0,
    teamCount: 0,
  },
  page: { pageNo: 2, pageSize: 20, pageCount: 2, totalRecordsCount: 21, pageData: [row] },
};

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});

describe('getModeratedFundraisers', () => {
  it('List_ValidResponse_ReturnsTotalsAndPageTogether', async () => {
    get.mockResolvedValue({ data: { data: listResult, success: true, message: null } });

    await expect(getModeratedFundraisers(CAMPAIGN_ID, query)).resolves.toEqual(listResult);
    expect(get).toHaveBeenCalledWith(`${BASE}/fundraisers`, {
      params: {
        page: 2,
        pageSize: 20,
        search: undefined,
        status: undefined,
        isHidden: undefined,
        sortBy: 'RaisedDescending',
      },
    });
  });

  it('List_FiltersChosen_SendsThemAsQueryParameters', async () => {
    get.mockResolvedValue({ data: { data: listResult, success: true, message: null } });

    await getModeratedFundraisers(CAMPAIGN_ID, {
      ...query,
      search: 'sara',
      status: 'PendingApproval',
    });

    expect(get.mock.calls[0][1].params).toMatchObject({
      search: 'sara',
      status: 'PendingApproval',
    });
  });

  it('List_CampaignIdentifierFromTheAddressBar_IsEncoded', async () => {
    get.mockResolvedValue({ data: { data: listResult, success: true, message: null } });

    await getModeratedFundraisers('a/b?c', query);

    expect(get.mock.calls[0][0]).toBe('/api/donation/campaign/a%2Fb%3Fc/peer-to-peer/fundraisers');
  });

  it('List_ServerRefused_ThrowsWhatTheServerSaid', async () => {
    get.mockResolvedValue({ data: { data: null, success: false, message: 'Campaign not found.' } });

    await expect(getModeratedFundraisers(CAMPAIGN_ID, query)).rejects.toThrow(
      'Campaign not found.',
    );
  });

  it('List_EnvelopeWithoutRows_ThrowsRatherThanRenderingNothing', async () => {
    get.mockResolvedValue({
      data: { data: { totals: listResult.totals, page: null }, success: true, message: null },
    });

    await expect(getModeratedFundraisers(CAMPAIGN_ID, query)).rejects.toThrow(
      'The fundraising pages on this campaign could not be read.',
    );
  });
});

describe('getModeratedFundraiser', () => {
  it('Detail_ValidResponse_ReturnsTheUnwrappedPage', async () => {
    get.mockResolvedValue({ data: { data: row, success: true, message: null } });

    await expect(getModeratedFundraiser(CAMPAIGN_ID, FUNDRAISER_ID)).resolves.toEqual(row);
    expect(get).toHaveBeenCalledWith(`${BASE}/fundraisers/${FUNDRAISER_ID}`);
  });

  it('Detail_ServerRefused_ThrowsWhatTheServerSaid', async () => {
    get.mockResolvedValue({
      data: { data: null, success: false, message: 'Fundraising page not found.' },
    });

    await expect(getModeratedFundraiser(CAMPAIGN_ID, FUNDRAISER_ID)).rejects.toThrow(
      'Fundraising page not found.',
    );
  });
});

describe('moderateFundraiser', () => {
  it('Moderate_ActionAndReason_ArePostedToTheAuditedEndpoint', async () => {
    post.mockResolvedValue({ data: { success: true, message: null } });

    await moderateFundraiser(CAMPAIGN_ID, FUNDRAISER_ID, { action: 'Hide', reason: 'Wrong photo' });

    expect(post).toHaveBeenCalledWith(`${BASE}/fundraisers/${FUNDRAISER_ID}/moderate`, {
      action: 'Hide',
      reason: 'Wrong photo',
    });
  });

  it('Moderate_ServerRefused_ThrowsWhatTheServerSaid', async () => {
    post.mockResolvedValue({ data: { success: false, message: 'This page is already hidden.' } });

    await expect(
      moderateFundraiser(CAMPAIGN_ID, FUNDRAISER_ID, { action: 'Hide' }),
    ).rejects.toThrow('This page is already hidden.');
  });

  it('Moderate_ServerAnsweredWithNothing_ThrowsRatherThanReportingSuccess', async () => {
    post.mockResolvedValue({ data: null });

    await expect(
      moderateFundraiser(CAMPAIGN_ID, FUNDRAISER_ID, { action: 'Approve' }),
    ).rejects.toThrow('That change could not be saved.');
  });
});

describe('teams', () => {
  it('TeamList_ValidResponse_ReadsTheTeamsEndpoint', async () => {
    get.mockResolvedValue({
      data: {
        data: { totals: listResult.totals, page: { ...listResult.page, pageData: [] } },
        success: true,
        message: null,
      },
    });

    await getModeratedTeams(CAMPAIGN_ID, query);

    expect(get.mock.calls[0][0]).toBe(`${BASE}/teams`);
  });

  it('TeamDetail_ValidResponse_ReadsOneTeam', async () => {
    get.mockResolvedValue({ data: { data: { uniqueId: TEAM_ID }, success: true, message: null } });

    await getModeratedTeam(CAMPAIGN_ID, TEAM_ID);

    expect(get).toHaveBeenCalledWith(`${BASE}/teams/${TEAM_ID}`);
  });

  it('ModerateTeam_Unhide_IsPostedToTheTeamEndpoint', async () => {
    post.mockResolvedValue({ data: { success: true, message: null } });

    await moderateTeam(CAMPAIGN_ID, TEAM_ID, { action: 'Unhide' });

    expect(post).toHaveBeenCalledWith(`${BASE}/teams/${TEAM_ID}/moderate`, { action: 'Unhide' });
  });

  it('ModerateTeam_ApprovalAskedFor_SurfacesTheServersRefusal', async () => {
    post.mockResolvedValue({
      data: {
        success: false,
        message: 'Teams do not go through approval. A team can be hidden or brought back.',
      },
    });

    await expect(moderateTeam(CAMPAIGN_ID, TEAM_ID, { action: 'Approve' })).rejects.toThrow(
      'Teams do not go through approval. A team can be hidden or brought back.',
    );
  });
});
