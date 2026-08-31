import { FundraiserPageState } from 'app/interface/donationInter/fundraiserPageDto';

export const NOT_FOUND_HEADING = 'This fundraising page is not here';
export const NOT_FOUND_MESSAGE = 'Fundraising page not found.';
export const NOT_FOUND_GUIDANCE =
  'The address may have been mistyped, or the page may have been taken down. Check the link you were sent.';

export const AWAITING_APPROVAL_HEADING = 'This page is waiting to be approved';
export const CLOSED_HEADING = 'This page is not taking donations';
export const CAMPAIGN_ENDED_HEADING = 'This campaign has finished';

/**
 * The longest name a donate button says out loud. A supporter may give their page a name of up to 80
 * characters, and a button repeating one that long reads as a sentence however neatly it wraps, so past
 * this length the button states the action alone. Nothing is lost: the name is the heading immediately
 * above the button on every screen that uses it.
 */
export const DONATE_CTA_NAME_LIMIT = 24;

/** What the donate button says when the name is too long to belong in a control. */
export const DONATE_CTA_WITHOUT_NAME = 'Donate now';

export const DONATE_CTA = (displayName: string) => {
  const name = (displayName ?? '').trim();
  return name && name.length <= DONATE_CTA_NAME_LIMIT
    ? `Donate to ${name}`
    : DONATE_CTA_WITHOUT_NAME;
};
export const DONATE_REASSURANCE = (organizerName: string) =>
  `Goes straight to ${organizerName}`;

export const STORY_HEADING = 'Why I am doing this';
export const SUPPORTERS_HEADING = 'Recent supporters';
export const SUPPORTERS_EMPTY_HEADING = 'No donations yet';
export const SUPPORTERS_EMPTY_GUIDANCE =
  'Be the first to give, and your name appears here.';

/**
 * A supporter names their page after the cause as often as after themselves, and a possessive built
 * from such a name reads as broken English - "Share Raise fund for the shelter's page". Whose page it
 * is, is the heading immediately above this panel on every screen that uses it, so the panel names the
 * thing rather than its owner.
 */
export const SHARE_HEADING = 'Share this page';
export const SHARE_COPY_LINK = 'Copy link';
export const SHARE_LINK_COPIED = 'Link copied';
export const SHARE_LINK_COPY_FAILED =
  'Your browser would not copy the link. Copy the address below by hand instead.';

export const RETRY_LABEL = 'Try again';

export const supportingBanner = (displayName: string) =>
  `You are supporting ${displayName}`;

export const raisedSummary = (raised: string, goal: string | null) =>
  goal ? `${raised} of ${goal}` : raised;

/** Reads the bar out loud. A bare percentage beside a money total says nothing about what it measures. */
export const percentOfGoal = (percentage: number) => `${percentage}% of goal`;

export const donorSummary = (donorCount: number) =>
  donorCount === 1 ? '1 donor' : `${donorCount} donors`;

/**
 * The campaign is what a donation is actually ring-fenced to, so it leads the line rather than sitting
 * in a badge. The person's own name is already the heading above it and is not repeated here.
 */
export const fundraisingForCampaign = 'Fundraising for';

/** The charity that receipts the gift, named in full rather than abbreviated into a tag. */
export const byOrganizer = (organizerName: string) => `by ${organizerName}`;

/**
 * The tab and shared-link title. It repeats the person's name because there is no heading beside it
 * once the link leaves the site.
 */
export const socialPreviewTitle = (displayName: string, campaignName: string) =>
  `${displayName} is fundraising for ${campaignName}`;

export const fundraisingSince = (isoDate: string) => {
  const started = new Date(isoDate);

  if (Number.isNaN(started.getTime())) {
    return '';
  }

  return `Fundraising since ${started.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
};

/**
 * One sentence per reason a page is not taking money. Each is written for the person holding the link,
 * who is usually either the fundraiser checking their own page or somebody they shared it with.
 */
export const unavailableExplanation = (
  state: FundraiserPageState,
  displayName: string,
  organizerName: string,
): string => {
  switch (state) {
    case 'AwaitingApproval':
      return `${organizerName} reviews fundraising pages before they go live. ${displayName}'s page will start taking donations as soon as it is approved.`;
    case 'Closed':
      return `${displayName}'s page has been withdrawn by ${organizerName}. Donations already given are unaffected.`;
    default:
      return `${organizerName} is no longer collecting donations for this campaign. Thank you to everyone who gave.`;
  }
};

export const unavailableHeading = (state: FundraiserPageState): string => {
  switch (state) {
    case 'AwaitingApproval':
      return AWAITING_APPROVAL_HEADING;
    case 'Closed':
      return CLOSED_HEADING;
    default:
      return CAMPAIGN_ENDED_HEADING;
  }
};

/** Initials for the avatar, so a page has a face before a photo exists. */
export const initialsOf = (displayName: string): string =>
  displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export const teamLine = (teamName: string) => `Part of ${teamName}`;
