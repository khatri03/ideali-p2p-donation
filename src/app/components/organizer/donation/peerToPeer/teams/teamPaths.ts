/** The public addresses of the team surfaces, mirroring the backend routes minus /api. */
export const browseTeamsPath = (campaignSlug: string) => `/campaigns/${campaignSlug}/teams`;

export const createTeamPath = (campaignSlug: string) => `${browseTeamsPath(campaignSlug)}/new`;

export const teamPagePath = (campaignSlug: string, teamSlug: string) =>
  `${browseTeamsPath(campaignSlug)}/${teamSlug}`;

export const teamMembersPath = (campaignSlug: string, teamSlug: string) =>
  `${teamPagePath(campaignSlug, teamSlug)}/members`;
