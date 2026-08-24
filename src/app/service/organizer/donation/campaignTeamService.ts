import HttpClient from '../../httpClient/HttpClient';
import {
  CampaignTeamBrowse,
  CampaignTeamBrowseResponse,
  CampaignTeamLeaveResponse,
  CampaignTeamPage,
  CampaignTeamPageResponse,
  CampaignTeamSave,
} from 'app/interface/donationInter/campaignTeamDto';

const BROWSE_FAILED = 'Could not load the teams on this campaign.';
const TEAM_NOT_FOUND = 'Team not found.';

/**
 * Mirrors the address a supporter sees, minus the /api prefix. Every segment is encoded: slugs reach
 * these functions from the URL bar, so they are caller input.
 */
const teamsUrl = (campaignSlug: string) =>
  `/api/campaigns/${encodeURIComponent(campaignSlug)}/teams`;

const teamUrl = (campaignSlug: string, teamSlug: string) =>
  `${teamsUrl(campaignSlug)}/${encodeURIComponent(teamSlug)}`;

const membersUrl = (campaignSlug: string, teamSlug: string) =>
  `${teamUrl(campaignSlug, teamSlug)}/members`;

const unwrapPage = (body: CampaignTeamPageResponse | undefined, fallback: string) => {
  if (!body?.success || !body.data) {
    throw new Error(body?.message ?? fallback);
  }

  return body.data;
};

/**
 * Lists the teams on a campaign. Anonymous, because a team page is something supporters share with
 * donors; what the caller may do next arrives on the same response rather than being guessed here.
 */
export const getCampaignTeams = async (
  campaignSlug: string,
  search?: string,
): Promise<CampaignTeamBrowse> => {
  const { data } = await HttpClient.get<CampaignTeamBrowseResponse>(teamsUrl(campaignSlug), {
    params: search?.trim() ? { search: search.trim() } : undefined,
  });

  if (!data?.success || !data.data) {
    throw new Error(data?.message ?? BROWSE_FAILED);
  }

  return data.data;
};

export const getCampaignTeamPage = async (
  campaignSlug: string,
  teamSlug: string,
): Promise<CampaignTeamPage> => {
  const { data } = await HttpClient.get<CampaignTeamPageResponse>(teamUrl(campaignSlug, teamSlug));

  return unwrapPage(data, TEAM_NOT_FOUND);
};

export const createCampaignTeam = async (
  campaignSlug: string,
  team: CampaignTeamSave,
): Promise<CampaignTeamPage> => {
  const { data } = await HttpClient.post<CampaignTeamPageResponse>(teamsUrl(campaignSlug), team);

  return unwrapPage(data, 'Could not create the team.');
};

export const updateCampaignTeam = async (
  campaignSlug: string,
  teamSlug: string,
  team: CampaignTeamSave,
): Promise<CampaignTeamPage> => {
  const { data } = await HttpClient.put<CampaignTeamPageResponse>(
    teamUrl(campaignSlug, teamSlug),
    team,
  );

  return unwrapPage(data, 'Could not save the team.');
};

export const joinCampaignTeam = async (
  campaignSlug: string,
  teamSlug: string,
): Promise<CampaignTeamPage> => {
  const { data } = await HttpClient.post<CampaignTeamPageResponse>(
    membersUrl(campaignSlug, teamSlug),
    {},
  );

  return unwrapPage(data, 'Could not join the team.');
};

/**
 * Addressed as "me" rather than by membership identifier, so nobody can leave on somebody else's
 * behalf by naming their row.
 */
export const leaveCampaignTeam = async (campaignSlug: string, teamSlug: string): Promise<void> => {
  const { data } = await HttpClient.delete<CampaignTeamLeaveResponse>(
    `${membersUrl(campaignSlug, teamSlug)}/me`,
  );

  if (!data?.success) {
    throw new Error(data?.message ?? 'Could not leave the team.');
  }
};

export const removeCampaignTeamMember = async (
  campaignSlug: string,
  teamSlug: string,
  memberUniqueId: string,
): Promise<CampaignTeamPage> => {
  const { data } = await HttpClient.delete<CampaignTeamPageResponse>(
    `${membersUrl(campaignSlug, teamSlug)}/${encodeURIComponent(memberUniqueId)}`,
  );

  return unwrapPage(data, 'Could not remove that member.');
};

export const handOverCampaignTeamCaptaincy = async (
  campaignSlug: string,
  teamSlug: string,
  memberUniqueId: string,
): Promise<CampaignTeamPage> => {
  const { data } = await HttpClient.post<CampaignTeamPageResponse>(
    `${teamUrl(campaignSlug, teamSlug)}/captain/${encodeURIComponent(memberUniqueId)}`,
    {},
  );

  return unwrapPage(data, 'Could not hand over the captaincy.');
};
