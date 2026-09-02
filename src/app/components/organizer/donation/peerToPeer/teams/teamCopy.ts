import { formatMoney } from '../page/money';

export const BROWSE_HEADING = 'Fundraising teams';
export const browseSubheading = (campaignName: string) =>
  `Teams raising money together for ${campaignName}.`;

export const BROWSE_LOAD_FAILED_HEADING = 'These teams cannot be shown right now';
export const RETRY_LABEL = 'Try again';

export const SEARCH_LABEL = 'Search teams';
export const SEARCH_PLACEHOLDER = 'Search by team name';
/** Named apart from the field itself, so the field and its busy indicator do not announce the same thing. */
export const SEARCHING_LABEL = 'Searching';
export const SEARCH_NO_MATCH_HEADING = 'No team matches that search';
export const SEARCH_NO_MATCH_GUIDANCE =
  'Try part of the team name, or clear the search to see every team on this campaign.';
export const SEARCH_CLEAR = 'Clear search';

export const EMPTY_HEADING = 'No teams yet';
export const EMPTY_GUIDANCE =
  'Teams let a group of fundraisers add up what they raise together. Be the first to start one.';
export const START_FIRST_TEAM = 'Start the first team';
export const START_A_TEAM = 'Start a team';

export const TEAMS_OFF_HEADING = 'This campaign is not using teams';
export const teamsOffGuidance = (organizerName: string) =>
  `${organizerName} has not switched fundraising teams on for this campaign, so no new team can be started and nobody new can join. Any team already here stays readable.`;

export const NOT_FUNDRAISER_HEADING = 'Set up your fundraising page first';
export const NOT_FUNDRAISER_GUIDANCE =
  'Teams are made up of fundraising pages. Set up your own page on this campaign, and you can start a team or join one.';

export const SET_UP_MY_PAGE = 'Set up my fundraising page';

export const ALREADY_IN_A_TEAM = 'You are already in a team on this campaign.';
export const ALREADY_IN_A_TEAM_GUIDANCE =
  'One fundraiser belongs to one team on a campaign. Leave the team you are in before starting another.';
export const GO_TO_MY_TEAM = 'Go to my team';

/**
 * Said on the team's own page, which is the address a captain shares to recruit. Each line answers the
 * one question the reader arrived with - can I be part of this - so nobody is sent back to the browse
 * screen to look for the team already in front of them.
 */
export const JOIN_INVITE = 'Fundraising for this campaign? Join this team and your total counts towards it too.';
export const JOIN_NOT_FUNDRAISER =
  'Set up your fundraising page for this campaign and you can join this team in the same step.';
export const joinBlockedByOtherTeam = (organizerName: string) =>
  `You are already in another team on this campaign. Open your team and leave it, and ${organizerName} will count your total towards this one instead.`;
export const JOIN_TEAMS_OFF =
  'This campaign is no longer taking new team members, so this team is closed to new joins.';

export const JOIN_LABEL = 'Join this team';
export const JOINING_LABEL = 'Joining...';
export const joinConfirmTitle = (teamName: string) => `Join ${teamName}?`;
export const JOIN_CONFIRM_BODY =
  'Your page keeps every donation it has already taken. Joining adds your total to this team from now on, and your donors are unaffected.';
export const JOIN_CONFIRM_ACTION = 'Yes, join';

export const LEAVE_LABEL = 'Leave this team';
export const LEAVING_LABEL = 'Leaving...';
export const leaveConfirmTitle = (teamName: string) => `Leave ${teamName}?`;
export const LEAVE_CONFIRM_BODY =
  'Your fundraising page and every donation on it stay exactly as they are. Only the team total changes, and the charity keeps the money already given.';
export const LEAVE_CONFIRM_ACTION = 'Yes, leave';
export const LEAVE_LAST_MEMBER_WARNING =
  'You are the last member, so leaving closes this team. Its address will stop working.';
export const LEAVE_CAPTAIN_WARNING =
  'You are the captain, so the longest-standing member takes over when you leave.';

export const CANCEL_LABEL = 'Cancel';

export const CREATE_HEADING = 'Start a team';
export const createSubheading = (campaignName: string) =>
  `Your team raises money together for ${campaignName}.`;
export const CREATE_ACTION = 'Start a team';
export const CREATING_LABEL = 'Creating...';
export const CREATE_NOTE =
  'You become the captain, and your own fundraising page joins the team straight away.';

export const EDIT_HEADING = 'Edit this team';
export const EDIT_ACTION = 'Save changes';
export const SAVING_LABEL = 'Saving...';
export const SAVED_MESSAGE = 'The team is updated.';

export const NAME_LABEL = 'Team name';
export const NAME_HELP = 'This is the name donors see on the team page.';
export const STORY_LABEL = 'Why this team is fundraising';
export const STORY_HELP = 'One or two paragraphs is plenty. Donors give more when they know why.';
export const GOAL_LABEL = 'Team goal';
export const GOAL_HELP = 'Leave it blank to show what the team has raised without a target.';
export const storyRemaining = (used: number, limit: number) =>
  `${Math.max(0, limit - used)} characters left`;

export const NAME_REQUIRED = 'Enter a name for your team.';
export const nameTooLong = (limit: number) => `The team name must be ${limit} characters or fewer.`;
export const GOAL_NOT_A_NUMBER = 'Enter a goal as a number, or leave it blank.';
export const GOAL_TOO_SMALL = 'Enter a goal greater than zero, or leave it blank.';
export const goalTooLarge = (limit: number) => `Enter a goal of ${limit.toLocaleString()} or less.`;
export const storyTooLong = (limit: number) =>
  `The team story must be ${limit} characters or fewer.`;

export const TEAM_NOT_FOUND_HEADING = 'This team is not here';
export const TEAM_NOT_FOUND_GUIDANCE =
  'The address may have been mistyped, or every member may have left and closed the team. Check the link you were sent.';

export const TEAM_STORY_HEADING = 'Why this team is fundraising';
export const MEMBERS_HEADING = 'Team members';

/**
 * A team may hold more fundraisers than fit above the fold on a phone, and the donate action sits below
 * the list. The list is cut to a readable length and the rest asked for, so the page a team shares
 * always reaches its own call to action.
 */
export const MEMBERS_VISIBLE_LIMIT = 8;
export const showAllMembers = (count: number) => `Show all ${count} fundraisers`;
export const SHOW_FEWER_MEMBERS = 'Show fewer';
export const MEMBERS_EMPTY =
  'Nobody is fundraising in this team yet. The team total starts as soon as somebody joins.';
export const membersCount = (count: number) =>
  count === 1 ? '1 fundraiser' : `${count} fundraisers`;
export const teamDonorSummary = (count: number) =>
  count === 1 ? '1 donor across the team' : `${count} donors across the team`;

/**
 * A donor count only works as encouragement once it reads as other people, plural. Below this it does
 * the opposite of what it is there for: it tells the reader almost nobody has given, which is the last
 * thing somebody deciding whether to give needs to be told. The team is described by the people
 * fundraising in it until the count is worth showing.
 */
export const DONOR_COUNT_VISIBLE_FROM = 3;

/**
 * The people and, once it helps, the donors behind the total. The figure itself is always shown; only
 * this supporting line changes, so nothing about what the team has raised is ever hidden.
 */
export const teamProgressSummary = (donorCount: number, memberCount: number) =>
  donorCount >= DONOR_COUNT_VISIBLE_FROM
    ? `${teamDonorSummary(donorCount)} · ${membersCount(memberCount)}`
    : membersCount(memberCount);
export const CAPTAIN_BADGE = 'Captain';

/** Mirrors the fundraiser page: the campaign leads the line, the charity is named under it. */
export const TEAM_FUNDRAISING_FOR = 'Fundraising together for';
export const raisedByMember = (amount: string) => `${amount} raised`;

/**
 * Said instead of a zero total. A public roster that prints nothing raised against a named person puts
 * them on display for it, and tells a donor to skip that row rather than pick it. This says the same
 * fact without the judgement, and points the next donation at somebody who still needs one.
 */
export const MEMBER_NOT_STARTED = 'Just getting started';

/** What one member's total says about them, written the same way everywhere a member is listed. */
export const memberRaisedNotice = (raisedAmount: number, currencySymbol: string) =>
  raisedAmount > 0 ? raisedByMember(formatMoney(raisedAmount, currencySymbol)) : MEMBER_NOT_STARTED;
export const VIEW_MEMBER_PAGE = 'View page';
export const VIEW_TEAM = 'View team';
export const viewTeamLabel = (teamName: string) => `View ${teamName}`;

/**
 * A team is not itself a payee: pressing this opens the list of the people in it. The label says that,
 * because a button that promises to take money and then asks a question instead has broken its word.
 */
export const DONATE_CTA = 'Donate to a team member';
export const DONATE_REASSURANCE = (organizerName: string) => `Goes straight to ${organizerName}`;
export const CHOOSE_MEMBER_TITLE = 'Choose who to support';
export const CHOOSE_MEMBER_BODY =
  'Every donation goes to one fundraiser and counts once towards the team. Pick the person you want to support.';
export const donateToMember = (displayName: string) => `Donate to ${displayName}`;
export const CHOOSE_MEMBER_SEARCH_LABEL = 'Search this team';
export const CHOOSE_MEMBER_SEARCH_PLACEHOLDER = 'Search by name';
export const CHOOSE_MEMBER_NO_MATCH =
  'Nobody in this team matches that search. Clear it to see everybody again.';

export const CAMPAIGN_CLOSED_NOTE =
  'This campaign has finished, so the team is no longer taking donations.';

export const shareHeading = (teamName: string) => `Share ${teamName}`;

/**
 * A team page is often the only address somebody was sent. Without this the campaign's other teams are
 * unreachable from it, and the browse screen is a place they have to be told about separately.
 */
export const ALL_TEAMS_LINK = 'See every team on this campaign';

/** Said on the team itself, not only beside the donate action, so the page never reads as still live. */
export const CAMPAIGN_FINISHED_BADGE = 'Campaign finished';

/** A bare figure with no target beside it says nothing about what it measures. */
export const RAISED_SO_FAR = 'Raised so far';

/**
 * The progress bar already shows how far along the team is, and its own label states the figure. The
 * sentence under it repeats that in words, which at a low percentage reads as a verdict on the team
 * rather than as progress, so it is written only once the number is worth reading twice.
 */
export const GOAL_PERCENT_VISIBLE_FROM = 10;

export const JOIN_FAILED = 'Could not join the team.';
export const LEAVE_FAILED = 'Could not leave the team.';

/**
 * Joining changes the page under the reader and leaving takes them off it altogether, so each says out
 * loud what just happened rather than leaving the reader to infer it from a screen that moved.
 */
export const joinedTeamMessage = (teamName: string) => `You are now fundraising with ${teamName}.`;
export const leftTeamMessage = (teamName: string) => `You have left ${teamName}.`;

export const MANAGE_TEAM = 'Manage team';
export const MANAGE_HEADING = 'Manage this team';
export const manageSubheading = (teamName: string) =>
  `You are the captain of ${teamName}. Only you can see this screen.`;
export const BACK_TO_TEAM = 'Back to the team page';

export const CAPTAIN_ONLY_HEADING = 'Only the team captain can open this';
export const CAPTAIN_ONLY_GUIDANCE =
  'Managing members is the captain job. You can still see the team page and keep fundraising.';

export const REMOVE_MEMBER = 'Remove';
export const removeConfirmTitle = (displayName: string) => `Remove ${displayName} from the team?`;
export const removeConfirmBody = (displayName: string) =>
  `${displayName} keeps their fundraising page and every donation on it. Only the team total changes, and the charity keeps the money already given.`;
export const REMOVE_CONFIRM_ACTION = 'Yes, remove';

export const HAND_OVER_CAPTAINCY = 'Make captain';
export const handOverConfirmTitle = (displayName: string) => `Make ${displayName} the captain?`;
export const handOverConfirmBody = (displayName: string) =>
  `${displayName} takes over managing the team, and you stay on as a member. You cannot undo this yourself.`;
export const HAND_OVER_CONFIRM_ACTION = 'Yes, hand over';

export const ONLY_MEMBER_NOTE =
  'You are the only member. Invite another fundraiser to join before you can hand over the captaincy.';
