import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvitationListResult } from 'app/interface/donationInter/fundraiserInvitationDto';

const get = vi.fn();
const post = vi.fn();

vi.mock('app/service/httpClient/HttpClient', () => ({
  default: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

const {
  acceptInvitation,
  getInvitations,
  getSupporterCandidates,
  openInvitation,
  previewInvitation,
  sendInvitations,
  unsubscribeFromInvitations,
} = await import('./fundraiserInvitationService');

const CAMPAIGN_ID = 'a7f3c2d1';
const BASE = `/api/donation/campaign/${CAMPAIGN_ID}/peer-to-peer`;

const listResult: InvitationListResult = {
  campaignName: 'Winter appeal',
  summary: { sent: 1, opened: 0, accepted: 0, expired: 0, suppressed: 0 },
  page: { pageNo: 1, pageSize: 20, pageCount: 1, totalRecordsCount: 1, pageData: [] },
};

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});

describe('getInvitations', () => {
  it('List_Read_AsksTheCampaignsInvitationAddressWithThePageAndFilters', async () => {
    get.mockResolvedValue({ data: { success: true, data: listResult } });

    await getInvitations(CAMPAIGN_ID, { page: 2, pageSize: 20, search: 'sara', status: 'Sent' });

    expect(get).toHaveBeenCalledWith(`${BASE}/invitations`, {
      params: { page: 2, pageSize: 20, search: 'sara', status: 'Sent' },
    });
  });

  it('List_EmptyFilters_AreLeftOffTheRequestRatherThanSentBlank', async () => {
    get.mockResolvedValue({ data: { success: true, data: listResult } });

    await getInvitations(CAMPAIGN_ID, { page: 1, pageSize: 20, search: '' });

    expect(get.mock.calls[0][1].params.search).toBeUndefined();
    expect(get.mock.calls[0][1].params.status).toBeUndefined();
  });

  it('List_ServerRefuses_RaisesTheServersOwnSentence', async () => {
    get.mockResolvedValue({ data: { success: false, message: 'Campaign not found.' } });

    await expect(getInvitations(CAMPAIGN_ID, { page: 1, pageSize: 20 })).rejects.toThrow(
      'Campaign not found.',
    );
  });

  it('List_ResponseWithoutAPage_IsRefusedRatherThanRendered', async () => {
    get.mockResolvedValue({ data: { success: true, data: { campaignName: 'Winter appeal' } } });

    await expect(getInvitations(CAMPAIGN_ID, { page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it('List_CampaignIdentifier_IsEncodedBeforeItReachesTheUrl', async () => {
    get.mockResolvedValue({ data: { success: true, data: listResult } });

    await getInvitations('a/../b', { page: 1, pageSize: 20 });

    expect(get.mock.calls[0][0]).toContain('a%2F..%2Fb');
  });
});

describe('sendInvitations', () => {
  it('Send_Addresses_PostsThemToTheCampaignsInvitationAddress', async () => {
    post.mockResolvedValue({
      data: { success: true, data: { accepted: 2, skipped: 0, message: '2 invitations sent.' } },
    });

    const result = await sendInvitations(CAMPAIGN_ID, {
      emailAddresses: ['one@a.test', 'two@b.test'],
    });

    expect(post).toHaveBeenCalledWith(`${BASE}/invitations`, {
      emailAddresses: ['one@a.test', 'two@b.test'],
    });
    expect(result.accepted).toBe(2);
  });

  it('Send_Refused_RaisesTheServersOwnSentence', async () => {
    post.mockResolvedValue({ data: { success: false, message: 'Invite up to 50 people at a time.' } });

    await expect(
      sendInvitations(CAMPAIGN_ID, { emailAddresses: ['one@a.test'] }),
    ).rejects.toThrow('Invite up to 50 people at a time.');
  });
});

describe('previewInvitation', () => {
  it('Preview_PersonalMessage_IsSentWithNoAddressesSoNothingCanBeMailed', async () => {
    post.mockResolvedValue({
      data: { success: true, data: { subject: 'Will you fundraise?', bodyHtml: '<p>Hi</p>' } },
    });

    await previewInvitation(CAMPAIGN_ID, 'Please help');

    expect(post).toHaveBeenCalledWith(`${BASE}/invitations/preview`, {
      emailAddresses: [],
      personalMessage: 'Please help',
    });
  });
});

describe('getSupporterCandidates', () => {
  it('Candidates_Read_PassesTheSearchTermThrough', async () => {
    get.mockResolvedValue({ data: { success: true, data: [] } });

    await getSupporterCandidates(CAMPAIGN_ID, 'sara');

    expect(get).toHaveBeenCalledWith(`${BASE}/invitations/supporters`, {
      params: { search: 'sara' },
    });
  });

  it('Candidates_ResponseThatIsNotAList_BecomesAnEmptyListRatherThanACrash', async () => {
    get.mockResolvedValue({ data: { success: true, data: { nope: true } } });

    expect(await getSupporterCandidates(CAMPAIGN_ID)).toEqual([]);
  });
});

describe('openInvitation', () => {
  it('Open_Token_IsSentAsAQueryParameterRatherThanInThePath', async () => {
    get.mockResolvedValue({
      data: { success: true, data: { campaignName: 'Winter appeal' } },
    });

    await openInvitation(CAMPAIGN_ID, 'live-token');

    expect(get).toHaveBeenCalledWith(`${BASE}/invitation`, { params: { token: 'live-token' } });
  });

  it('Open_Refused_RaisesTheServersOwnSentence', async () => {
    get.mockResolvedValue({
      data: { success: false, message: 'This invitation is no longer valid.' },
    });

    await expect(openInvitation(CAMPAIGN_ID, 'stale')).rejects.toThrow(
      'This invitation is no longer valid.',
    );
  });
});

describe('acceptInvitation', () => {
  it('Accept_Request_PostsTheTokenAndTheChosenPageDetails', async () => {
    post.mockResolvedValue({
      data: {
        success: true,
        data: {
          fundraiserUniqueId: 'f1',
          slug: 'sara',
          campaignSlug: 'winter',
          isAwaitingApproval: false,
        },
      },
    });

    await acceptInvitation(CAMPAIGN_ID, { token: 'live', displayName: 'Sara' });

    expect(post).toHaveBeenCalledWith(`${BASE}/invitation/accept`, {
      token: 'live',
      displayName: 'Sara',
    });
  });
});

describe('unsubscribeFromInvitations', () => {
  it('Unsubscribe_Token_IsSentAsAQueryParameterAndTheAnswerIsReturned', async () => {
    post.mockResolvedValue({
      data: { success: true, message: 'You will not receive any more of these emails.' },
    });

    const message = await unsubscribeFromInvitations(CAMPAIGN_ID, 'leave-me');

    expect(post).toHaveBeenCalledWith(`${BASE}/invitation/unsubscribe`, null, {
      params: { token: 'leave-me' },
    });
    expect(message).toBe('You will not receive any more of these emails.');
  });

  it('Unsubscribe_Refused_RaisesRatherThanClaimingItWorked', async () => {
    post.mockResolvedValue({ data: { success: false } });

    await expect(unsubscribeFromInvitations(CAMPAIGN_ID, 'leave-me')).rejects.toThrow();
  });
});
