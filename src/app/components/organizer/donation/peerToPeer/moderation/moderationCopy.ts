import { FundraiserStatus } from 'app/interface/donationInter/fundraiserConsoleDto';
import {
  ModerationAction,
  ModerationSort,
} from 'app/interface/donationInter/peerToPeerModerationDto';

export const OVERSIGHT_HEADING = 'Supporter fundraising';
export const SETTINGS_TAB = 'Settings';
export const FUNDRAISERS_TAB = 'Fundraising pages';
export const TEAMS_TAB = 'Teams';
export const INVITATIONS_TAB = 'Invitations';
export const EMAILS_TAB = 'Emails';
export const BACK_LABEL = 'Back';

/**
 * The two totals and the sentence under each. Confusing these two costs more trust than any bug in this
 * product, so the definition travels with the number rather than living in a help article.
 */
export const RAISED_THROUGH_FUNDRAISERS_LABEL = 'Raised through fundraisers';
export const RAISED_THROUGH_FUNDRAISERS_NOTE =
  "Settled gifts that came in through a supporter's own page. Tips excluded, refunds deducted.";
export const RAISED_IN_TOTAL_LABEL = 'Raised in total';
export const RAISED_IN_TOTAL_NOTE =
  'Every settled gift on this campaign, whether a supporter was involved or not. Tips excluded, refunds deducted.';
export const FUNDRAISER_COUNT_LABEL = 'Fundraising pages';
export const TEAM_COUNT_LABEL = 'Teams';
export const AWAITING_APPROVAL_LABEL = 'Waiting for you';

export const SEARCH_PAGES_LABEL = 'Search fundraising pages';
export const SEARCH_TEAMS_LABEL = 'Search teams';
export const SEARCH_PLACEHOLDER = 'Search by name';
export const STATUS_FILTER_LABEL = 'Status';
export const VISIBILITY_FILTER_LABEL = 'Visibility';
export const SORT_LABEL = 'Sort by';
export const EXPORT_LABEL = 'Export as CSV';

export const ALL_STATUSES_OPTION = 'Every status';
export const ALL_VISIBILITY_OPTION = 'Everything';
export const VISIBLE_ONLY_OPTION = 'Showing publicly';
export const HIDDEN_ONLY_OPTION = 'Hidden by us';

export const STATUS_LABELS: Record<FundraiserStatus, string> = {
  Active: 'Live',
  PendingApproval: 'Waiting for approval',
  Paused: 'Hidden',
  Rejected: 'Turned down',
};

export const SORT_LABELS: Record<ModerationSort, string> = {
  Newest: 'Newest first',
  Oldest: 'Oldest first',
  NameAscending: 'Name, A to Z',
  RaisedDescending: 'Raised, most first',
  RaisedAscending: 'Raised, least first',
};

export const PAGES_EMPTY_HEADING = 'Nobody is fundraising yet';
export const PAGES_EMPTY_BODY =
  'Once a supporter sets up a page for this campaign it appears here, with what it has raised.';
export const PAGES_FILTERED_EMPTY_HEADING = 'Nothing matches that';
export const PAGES_FILTERED_EMPTY_BODY = 'Try a different name, status or sort order.';

export const TEAMS_EMPTY_HEADING = 'No teams yet';
export const TEAMS_EMPTY_BODY =
  'Supporters can group their pages into a team. The teams they start appear here.';
export const TEAMS_FILTERED_EMPTY_HEADING = 'Nothing matches that';
export const TEAMS_FILTERED_EMPTY_BODY = 'Try a different name or visibility filter.';

export const CLEAR_FILTERS_LABEL = 'Clear filters';

export const RAISED_COLUMN = 'Raised';
export const DONORS_COLUMN = 'Donors';
export const GOAL_COLUMN = 'Goal';
export const TEAM_COLUMN = 'Team';
export const STARTED_COLUMN = 'Started';
export const NAME_COLUMN = 'Name';
export const STATUS_COLUMN = 'Status';
export const CAPTAIN_COLUMN = 'Captain';
export const MEMBERS_COLUMN = 'Members';
export const VISIBILITY_COLUMN = 'Visibility';
export const NO_GOAL = 'No goal';
export const NO_TEAM = 'On their own';
export const HIDDEN_LABEL = 'Hidden';
export const SHOWING_LABEL = 'Showing publicly';

export const REVIEW_LABEL = 'Review';
export const OPEN_PUBLIC_PAGE = 'Open the public page';
export const OPEN_TEAM_PAGE = 'Open the team page';
export const NO_PUBLIC_ADDRESS =
  'This campaign has no public address yet, so there is nothing to open.';

export const STORY_HEADING = 'What they wrote';
export const NO_STORY = 'This page has no story on it.';
export const DONORS_HEADING = 'Recent donations';
export const DONORS_EMPTY = 'No donations through this page yet.';
export const MEMBERS_HEADING = 'Members';
export const MEMBERS_EMPTY = 'Nobody has joined this team yet.';
export const CAPTAIN_TAG = 'Captain';
export const HISTORY_HEADING = 'What has been done';
export const HISTORY_EMPTY = 'Nothing has been changed on this yet.';

export const ACTION_LABELS: Record<ModerationAction, string> = {
  Approve: 'Approve',
  Reject: 'Turn down',
  Hide: 'Hide',
  Unhide: 'Bring back',
};

export const HISTORY_ACTION_LABELS: Record<ModerationAction, string> = {
  Approve: 'Approved',
  Reject: 'Turned down',
  Hide: 'Hidden',
  Unhide: 'Brought back',
};

export const REASON_LABEL = 'Reason (optional)';
export const REASON_HELP =
  'Kept for your own records. The supporter is not shown what you write here.';
export const REASON_LIMIT = 500;
export const reasonRemaining = (used: number) =>
  `${Math.max(0, REASON_LIMIT - used)} characters left`;
export const REASON_TOO_LONG = `Keep the reason to ${REASON_LIMIT} characters or fewer.`;

export const CANCEL_LABEL = 'Cancel';

interface ActionCopy {
  title: string;
  body: string;
  confirmLabel: string;
  busyLabel: string;
  isDestructive: boolean;
}

export const fundraiserActionCopy = (
  action: ModerationAction,
  displayName: string,
): ActionCopy => {
  switch (action) {
    case 'Approve':
      return {
        title: `Approve ${displayName}?`,
        body: 'Their page goes live, its address starts working, and it can take donations from now on. They are emailed that you approved it.',
        confirmLabel: 'Approve this page',
        busyLabel: 'Approving...',
        isDestructive: false,
      };
    case 'Reject':
      return {
        title: `Turn down ${displayName}?`,
        body: 'Their page stops being reachable and cannot take donations. They are emailed that it was not approved, without the reason you write below. Money already raised stays with the campaign, and you can approve the page later if they put it right.',
        confirmLabel: 'Turn this page down',
        busyLabel: 'Turning down...',
        isDestructive: true,
      };
    case 'Hide':
      return {
        title: `Hide ${displayName}?`,
        body: 'The page comes off the public site within one reload and stops taking donations. Nothing is deleted, the money it raised stays counted, and you can bring it back at any time.',
        confirmLabel: 'Hide this page',
        busyLabel: 'Hiding...',
        isDestructive: true,
      };
    default:
      return {
        title: `Bring ${displayName} back?`,
        body: 'The page returns to the public site with everything it raised still on it, and can take donations again.',
        confirmLabel: 'Bring this page back',
        busyLabel: 'Bringing back...',
        isDestructive: false,
      };
  }
};

export const teamActionCopy = (action: ModerationAction, name: string): ActionCopy =>
  action === 'Hide'
    ? {
        title: `Hide ${name}?`,
        body: 'The team stops appearing when supporters browse, and its address stops working. The pages in it stay live and keep raising money on their own.',
        confirmLabel: 'Hide this team',
        busyLabel: 'Hiding...',
        isDestructive: true,
      }
    : {
        title: `Bring ${name} back?`,
        body: 'The team returns to browsing with its members and its total exactly as they were.',
        confirmLabel: 'Bring this team back',
        busyLabel: 'Bringing back...',
        isDestructive: false,
      };

export const actionDoneMessage = (action: ModerationAction, name: string) => {
  switch (action) {
    case 'Approve':
      return `${name} is live.`;
    case 'Reject':
      return `${name} has been turned down.`;
    case 'Hide':
      return `${name} is hidden.`;
    default:
      return `${name} is back.`;
  }
};

export const historyLine = (
  action: ModerationAction,
  actedByName: string,
  subjectName: string,
) => `${HISTORY_ACTION_LABELS[action]} ${subjectName} — ${actedByName}`;

export const showingRange = (pageNo: number, pageSize: number, total: number) => {
  if (total === 0) {
    return 'Nothing to show';
  }

  const first = (pageNo - 1) * pageSize + 1;

  return `${first}–${Math.min(pageNo * pageSize, total)} of ${total}`;
};

export const PREVIOUS_PAGE = 'Previous';
export const NEXT_PAGE = 'Next';

export const EXPORT_EMPTY = 'There is nothing to export yet.';
export const EXPORT_DONE = 'Export downloaded.';
