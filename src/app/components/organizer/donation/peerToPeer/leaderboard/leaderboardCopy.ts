/** Every user-facing sentence on the leaderboard, so wording is changed in one place. */

export const LEADERBOARD_HEADING = 'Leaderboard';

export const NOT_FOUND_HEADING = 'This leaderboard is not here';
export const NOT_FOUND_MESSAGE = 'Leaderboard not found.';
export const NOT_FOUND_GUIDANCE =
  'The address may have been mistyped, or the charity may not be publishing standings for this campaign.';

export const RETRY_LABEL = 'Try again';

export const ORGANIZER_ONLY_NOTICE =
  'Only your charity can see this leaderboard. Supporters and donors are not shown it.';

export const CAMPAIGN_CLOSED_NOTICE =
  'This campaign has finished. These are the final standings.';

export const RAISED_BY_SUPPORTERS = 'Raised by supporters';
export const RAISED_IN_TOTAL = 'Raised in total';
export const FUNDRAISER_COUNT_LABEL = 'Fundraising pages';
export const TEAM_COUNT_LABEL = 'Teams';

export const FUNDRAISERS_TAB = 'Fundraisers';
export const TEAMS_TAB = 'Teams';
export const GIFTS_TAB = 'Biggest gifts';

export const RANK_COLUMN = 'Place';
export const NAME_COLUMN = 'Name';
export const RAISED_COLUMN = 'Raised';
export const GOAL_COLUMN = 'Goal';
export const DONORS_COLUMN = 'Donors';
export const MEMBERS_COLUMN = 'Members';
export const TEAM_COLUMN = 'Team';
export const DONOR_COLUMN = 'Donor';
export const AMOUNT_COLUMN = 'Amount';
export const GIVEN_COLUMN = 'Given';
export const THROUGH_COLUMN = 'Through';

export const NO_GOAL = 'No goal set';
export const NO_TEAM = 'On their own';
export const STRAIGHT_TO_CAMPAIGN = 'The campaign';

export const FUNDRAISERS_EMPTY_HEADING = 'Nobody is fundraising yet';
export const FUNDRAISERS_EMPTY_GUIDANCE =
  'As soon as the first supporter sets up a page and the charity approves it, they appear here.';

export const TEAMS_EMPTY_HEADING = 'No teams yet';
export const TEAMS_EMPTY_GUIDANCE =
  'Supporters can fundraise together as a team, and the team standings appear here once the first one is formed.';

export const TEAMS_OFF_HEADING = 'This campaign is not using teams';
export const TEAMS_OFF_GUIDANCE =
  'The charity has supporters fundraising individually, so there are no team standings to show.';

export const GIFTS_EMPTY_HEADING = 'No donations yet';
export const GIFTS_EMPTY_GUIDANCE =
  'The largest gifts appear here once donations start arriving. Donors who choose to stay anonymous are never listed.';

export const VIEW_PAGE_LABEL = 'View page';
export const VIEW_TEAM_LABEL = 'View team';

export const CAPPED_NOTICE = (shown: number, total: number) =>
  `Showing the top ${shown} of ${total}.`;

export const leaderboardSubtitle = (campaignName: string, organizerName: string) =>
  organizerName ? `${campaignName} · ${organizerName}` : campaignName;

export const HIDDEN_HEADING = 'The leaderboard is switched off';
export const HIDDEN_GUIDANCE =
  'Nobody sees standings for this campaign while the leaderboard is hidden, your charity included. Turn it on under Settings to start ranking your supporters.';
export const HIDDEN_ACTION_LABEL = 'Go to settings';
export const VIEW_PUBLIC_BOARD_LABEL = 'Open the public board';
