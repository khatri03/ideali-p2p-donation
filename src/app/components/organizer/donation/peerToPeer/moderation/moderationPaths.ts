/** The organiser-facing oversight addresses, mirroring the backend routes minus /api. */
const base = (campaignUniqueId: string) =>
  `/organizer/donation/campaign/${campaignUniqueId}/peer-to-peer`;

export const peerToPeerSettingsPath = base;

export const moderatedFundraisersPath = (campaignUniqueId: string) =>
  `${base(campaignUniqueId)}/fundraisers`;

export const moderatedFundraiserPath = (campaignUniqueId: string, fundraiserUniqueId: string) =>
  `${moderatedFundraisersPath(campaignUniqueId)}/${fundraiserUniqueId}`;

/**
 * The fundraising pages already narrowed to the ones waiting on a decision. Somebody following a
 * warning about pending approvals wants the approve and reject buttons, not the whole list to filter
 * again by hand.
 */
export const pendingFundraisersPath = (campaignUniqueId: string) =>
  `${moderatedFundraisersPath(campaignUniqueId)}?status=PendingApproval`;

export const moderatedTeamsPath = (campaignUniqueId: string) => `${base(campaignUniqueId)}/teams`;

export const moderatedTeamPath = (campaignUniqueId: string, teamUniqueId: string) =>
  `${moderatedTeamsPath(campaignUniqueId)}/${teamUniqueId}`;

export const invitationsPath = (campaignUniqueId: string) =>
  `${base(campaignUniqueId)}/invitations`;

export const emailTemplatesPath = (campaignUniqueId: string) =>
  `${base(campaignUniqueId)}/email-templates`;
