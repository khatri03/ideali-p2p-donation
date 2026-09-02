import { FundraiserStatus } from 'app/interface/donationInter/fundraiserConsoleDto';

export const CONSOLE_HEADING = 'My fundraising';
export const CONSOLE_SUBHEADING =
  'Your pages, what they have raised, and the link to share.';

export const LOAD_FAILED_MESSAGE = 'Could not load your fundraising pages.';
export const RETRY_LABEL = 'Try again';

export const EMPTY_HEADING = 'You are not fundraising yet';
export const EMPTY_GUIDANCE =
  'Open a campaign you care about and choose "Fundraise for this" to set up your own page.';
export const EMPTY_ACTION = 'Find a campaign';

export const ALL_FINISHED_HEADING = 'Your campaigns have all finished';
export const ALL_FINISHED_GUIDANCE =
  'Your pages below stay as a record of what you raised. To fundraise again, pick a campaign that is still taking supporter pages.';

export const VIEW_PUBLIC_PAGE = 'View my page';
export const OPENS_IN_A_NEW_TAB = '(opens in a new tab)';
export const EDIT_PAGE = 'Edit my page';
export const FIND_A_TEAM = 'Join a team';
export const fundraisingCardLabel = (displayName: string, campaignName: string) =>
  `${displayName} fundraising for ${campaignName}`;

/**
 * Being in a team is a fact, so it is labelled as one and the button beside it says what it does. The
 * spoken name carries the team as well, because a console listing several campaigns would otherwise
 * offer a row of buttons all called the same thing.
 */
export const YOUR_TEAM_LABEL = 'Your team';
export const VIEW_TEAM = 'View team';
export const viewTeamLabel = (teamName: string) => `${VIEW_TEAM} ${teamName}`;

/** Said out loud rather than left as a gap, so nobody hunts for a teams screen this campaign has not opened. */
export const TEAMS_NOT_RUNNING = 'This campaign is not running teams.';
export const BACK_TO_CONSOLE = 'Back to my fundraising';

/**
 * A section is named after the campaign it groups, so the supporter's own page is named beneath it -
 * and named as a page rather than with a possessive, because a page called after the cause would read
 * as broken English the moment one was written.
 */
export const FUNDRAISING_PAGE_PREFIX = 'Your page:';

export const EXPAND_ALL = 'Expand all';
export const COLLAPSE_ALL = 'Collapse all';

export const SUMMARY_HEADING = 'Everything you have raised';
export const SUMMARY_RAISED = 'Raised in total';
export const SUMMARY_PAGES = 'Fundraising pages';
export const SUMMARY_DONORS = 'Donors';
export const SUMMARY_MIXED_CURRENCY =
  'Your pages raise in different currencies, so each total is shown on the page it belongs to.';

export const CAMPAIGN_CLOSED_NOTE =
  'This campaign has finished, so the page is no longer taking donations.';

export const STATUS_LABELS: Record<FundraiserStatus, string> = {
  Active: 'Live',
  PendingApproval: 'Waiting for approval',
  Paused: 'Paused by the charity',
  Rejected: 'Turned down by the charity',
};

export const STATUS_NOTES: Partial<Record<FundraiserStatus, string>> = {
  PendingApproval:
    'The charity reviews new pages before they go live. Your link works once they approve it.',
  Paused: 'The charity has paused this page. Contact them if you think that is a mistake.',
  Rejected:
    'The charity has turned this page down, so it is not taking donations. Contact them if you think that is a mistake.',
};

export const EDIT_HEADING = 'Edit my fundraising page';
export const EDIT_SUBHEADING = (campaignName: string) => `Your page for ${campaignName}.`;
export const NO_PUBLIC_ADDRESS_NOTE =
  'This campaign has no public address yet, so there is nothing to open or share until the charity publishes it.';

export const NAME_LABEL = 'Name on your page';
export const NAME_HELP = 'This is the name donors see. Your account name does not change.';
export const GOAL_LABEL = 'Your goal';
export const GOAL_HELP = 'Leave it blank to show what you have raised without a target.';
export const STORY_LABEL = 'Why you are doing this';
export const STORY_HELP = 'Donors give more when they know why it matters to you.';
export const storyRemaining = (used: number, limit: number) =>
  `${Math.max(0, limit - used)} characters left`;

export const PHOTO_LABEL = 'Your photo';
export const PHOTO_HELP = 'A JPG, PNG or WEBP of 5 MB or less.';
export const PHOTO_CHOOSE = 'Upload a photo';
export const PHOTO_REPLACE = 'Change photo';
export const PHOTO_REMOVE = 'Remove photo';
export const PHOTO_EDIT_TITLE = 'Position your photo';
export const PHOTO_REJECTED = 'Choose a JPG, PNG or WEBP image of 5 MB or less.';

export const SAVE_LABEL = 'Save changes';
export const SAVING_LABEL = 'Saving...';
export const SAVED_MESSAGE = 'Your page is updated.';
export const UNSAVED_WARNING = 'You have unsaved changes. Leave this page and lose them?';

export const NAME_REQUIRED = 'Enter the name to show on your fundraising page.';
export const nameTooLong = (limit: number) =>
  `The name on your page must be ${limit} characters or fewer.`;
export const GOAL_NOT_A_NUMBER = 'Enter a goal as a number, or leave it blank.';
export const GOAL_TOO_SMALL = 'Enter a goal greater than zero, or leave it blank.';
export const goalTooLarge = (limit: number) => `Enter a goal of ${limit.toLocaleString()} or less.`;
export const storyTooLong = (limit: number) =>
  `Your story must be ${limit} characters or fewer.`;

export const NOT_FOUND_HEADING = 'This fundraising page is not here';
export const NOT_FOUND_GUIDANCE =
  'It may have been removed, or it may belong to somebody else. Go back and pick one of your own pages.';
