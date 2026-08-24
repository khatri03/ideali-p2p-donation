import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
const remove = vi.fn();

vi.mock('../../httpClient/HttpClient', () => ({
  default: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    put: (...args: unknown[]) => put(...args),
    delete: (...args: unknown[]) => remove(...args),
  },
}));

const {
  createCampaignTeam,
  getCampaignTeamPage,
  getCampaignTeams,
  handOverCampaignTeamCaptaincy,
  joinCampaignTeam,
  leaveCampaignTeam,
  removeCampaignTeamMember,
  updateCampaignTeam,
} = await import('./campaignTeamService');

const browse = {
  campaignSlug: 'winter-appeal',
  teams: [] as unknown[],
  areTeamsAllowed: true,
};
const team = { slug: 'the-early-risers', name: 'The Early Risers' };

describe('campaignTeamService', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
    remove.mockReset();
  });

  it('Browse_NoSearch_CallsTheAddressASupporterSeesMinusTheApiPrefix', async () => {
    get.mockResolvedValue({ data: { success: true, data: browse } });

    await getCampaignTeams('winter-appeal');

    expect(get).toHaveBeenCalledWith('/api/campaigns/winter-appeal/teams', { params: undefined });
  });

  it('Browse_SearchTyped_IsSentAsAQueryParameterRatherThanBuiltIntoThePath', async () => {
    get.mockResolvedValue({ data: { success: true, data: browse } });

    await getCampaignTeams('winter-appeal', '  risers  ');

    expect(get).toHaveBeenCalledWith('/api/campaigns/winter-appeal/teams', {
      params: { search: 'risers' },
    });
  });

  it('Browse_SearchIsOnlySpaces_IsOmittedRatherThanSentAsAnEmptyFilter', async () => {
    get.mockResolvedValue({ data: { success: true, data: browse } });

    await getCampaignTeams('winter-appeal', '   ');

    expect(get).toHaveBeenCalledWith('/api/campaigns/winter-appeal/teams', { params: undefined });
  });

  it('Browse_ApiRefuses_ThrowsTheMessageTheApiChoseRatherThanInventingOne', async () => {
    get.mockResolvedValue({ data: { success: false, message: 'Campaign not found.', data: null } });

    await expect(getCampaignTeams('nobody')).rejects.toThrow('Campaign not found.');
  });

  /** Slugs arrive from the URL bar, so they are caller input and never interpolated raw. */
  it('TeamPage_SlugWithPathCharacters_IsEncodedRatherThanChangingTheRequestedPath', async () => {
    get.mockResolvedValue({ data: { success: true, data: team } });

    await getCampaignTeamPage('winter-appeal', '../../admin/users');

    expect(get).toHaveBeenCalledWith('/api/campaigns/winter-appeal/teams/..%2F..%2Fadmin%2Fusers');
  });

  it('TeamPage_TeamThatIsClosed_ThrowsTheNotFoundSentenceTheApiSent', async () => {
    get.mockResolvedValue({ data: { success: false, message: 'Team not found.', data: null } });

    await expect(getCampaignTeamPage('winter-appeal', 'gone')).rejects.toThrow('Team not found.');
  });

  it('Create_ValidTeam_PostsToTheTeamsCollectionAndReturnsTheNewPage', async () => {
    post.mockResolvedValue({ data: { success: true, data: team } });

    const created = await createCampaignTeam('winter-appeal', {
      name: 'The Early Risers',
      story: null,
      teamGoal: 1000,
    });

    expect(post).toHaveBeenCalledWith('/api/campaigns/winter-appeal/teams', {
      name: 'The Early Risers',
      story: null,
      teamGoal: 1000,
    });
    expect(created.slug).toBe('the-early-risers');
  });

  it('Create_ApiRefusesBecauseTeamsAreOff_ThrowsThatSentence', async () => {
    post.mockResolvedValue({
      data: { success: false, message: 'This campaign is not using fundraising teams.', data: null },
    });

    await expect(
      createCampaignTeam('winter-appeal', { name: 'Anything', story: null, teamGoal: null }),
    ).rejects.toThrow('This campaign is not using fundraising teams.');
  });

  it('Update_ExistingTeam_PutsToThatTeamsOwnAddress', async () => {
    put.mockResolvedValue({ data: { success: true, data: team } });

    await updateCampaignTeam('winter-appeal', 'the-early-risers', {
      name: 'The Risers',
      story: 'Updated',
      teamGoal: null,
    });

    expect(put).toHaveBeenCalledWith('/api/campaigns/winter-appeal/teams/the-early-risers', {
      name: 'The Risers',
      story: 'Updated',
      teamGoal: null,
    });
  });

  it('Join_Team_PostsToTheMembersCollectionOfThatTeam', async () => {
    post.mockResolvedValue({ data: { success: true, data: team } });

    await joinCampaignTeam('winter-appeal', 'the-early-risers');

    expect(post).toHaveBeenCalledWith(
      '/api/campaigns/winter-appeal/teams/the-early-risers/members',
      {},
    );
  });

  it('Join_ApiRefusesBecauseThePageIsPending_ThrowsThatSentence', async () => {
    post.mockResolvedValue({
      data: {
        success: false,
        message: 'Your fundraising page is waiting to be approved. You can join a team once it is live.',
        data: null,
      },
    });

    await expect(joinCampaignTeam('winter-appeal', 'the-early-risers')).rejects.toThrow(
      'Your fundraising page is waiting to be approved. You can join a team once it is live.',
    );
  });

  /** Leaving is addressed as "me" so nobody can leave on somebody else's behalf by naming their row. */
  it('Leave_Team_AddressesTheCallersOwnMembershipRatherThanAnIdentifier', async () => {
    remove.mockResolvedValue({ data: { success: true, data: true } });

    await leaveCampaignTeam('winter-appeal', 'the-early-risers');

    expect(remove).toHaveBeenCalledWith(
      '/api/campaigns/winter-appeal/teams/the-early-risers/members/me',
    );
  });

  it('Leave_ApiRefuses_ThrowsThatSentenceRatherThanResolvingQuietly', async () => {
    remove.mockResolvedValue({ data: { success: false, message: 'Team not found.', data: false } });

    await expect(leaveCampaignTeam('winter-appeal', 'gone')).rejects.toThrow('Team not found.');
  });

  it('RemoveMember_Captain_AddressesThatOneMembershipByItsIdentifier', async () => {
    remove.mockResolvedValue({ data: { success: true, data: team } });

    await removeCampaignTeamMember('winter-appeal', 'the-early-risers', 'member-id');

    expect(remove).toHaveBeenCalledWith(
      '/api/campaigns/winter-appeal/teams/the-early-risers/members/member-id',
    );
  });

  it('RemoveMember_PlainMemberCalls_ThrowsTheCaptainOnlyRefusalTheServerSent', async () => {
    remove.mockResolvedValue({
      data: { success: false, message: 'Only the team captain can do that.', data: null },
    });

    await expect(
      removeCampaignTeamMember('winter-appeal', 'the-early-risers', 'member-id'),
    ).rejects.toThrow('Only the team captain can do that.');
  });

  it('HandOver_Captain_PostsToTheCaptainAddressOfThatMembership', async () => {
    post.mockResolvedValue({ data: { success: true, data: team } });

    await handOverCampaignTeamCaptaincy('winter-appeal', 'the-early-risers', 'member-id');

    expect(post).toHaveBeenCalledWith(
      '/api/campaigns/winter-appeal/teams/the-early-risers/captain/member-id',
      {},
    );
  });

  it('HandOver_PlainMemberCalls_ThrowsTheCaptainOnlyRefusalTheServerSent', async () => {
    post.mockResolvedValue({
      data: { success: false, message: 'Only the team captain can do that.', data: null },
    });

    await expect(
      handOverCampaignTeamCaptaincy('winter-appeal', 'the-early-risers', 'member-id'),
    ).rejects.toThrow('Only the team captain can do that.');
  });
});
