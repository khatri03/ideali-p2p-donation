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

export const VIEW_PUBLIC_PAGE = 'View my page';
export const EDIT_PAGE = 'Edit my page';
export const BACK_TO_CONSOLE = 'Back to my fundraising';

export const SUPPORTERS_HEADING = 'Recent donations';
export const SUPPORTERS_EMPTY = 'No donations yet. Share your link to get the first one.';

export const CAMPAIGN_CLOSED_NOTE =
  'This campaign has finished, so the page is no longer taking donations.';

export const STATUS_LABELS: Record<FundraiserStatus, string> = {
  Active: 'Live',
  PendingApproval: 'Waiting for approval',
  Paused: 'Paused by the charity',
  Removed: 'Removed',
};

export const STATUS_NOTES: Partial<Record<FundraiserStatus, string>> = {
  PendingApproval:
    'The charity reviews new pages before they go live. Your link works once they approve it.',
  Paused: 'The charity has paused this page. Contact them if you think that is a mistake.',
  Removed: 'This page has been removed by the charity.',
};

export const EDIT_HEADING = 'Edit my fundraising page';
export const EDIT_SUBHEADING = (campaignName: string) => `Your page for ${campaignName}.`;

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
