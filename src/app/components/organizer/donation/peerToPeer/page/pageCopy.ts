import { FundraiserPageState } from 'app/interface/donationInter/fundraiserPageDto';

export const NOT_FOUND_HEADING = 'This fundraising page is not here';
export const NOT_FOUND_MESSAGE = 'Fundraising page not found.';
export const NOT_FOUND_GUIDANCE =
  'The address may have been mistyped, or the page may have been taken down. Check the link you were sent.';

export const AWAITING_APPROVAL_HEADING = 'This page is waiting to be approved';
export const CLOSED_HEADING = 'This page is not taking donations';
export const CAMPAIGN_ENDED_HEADING = 'This campaign has finished';

export const DONATE_CTA = (displayName: string) => `Donate to ${displayName}`;
export const DONATE_REASSURANCE = (organizerName: string) =>
  `Goes straight to ${organizerName}`;

export const STORY_HEADING = 'Why I am doing this';
export const SUPPORTERS_HEADING = 'Recent supporters';
export const SUPPORTERS_EMPTY_HEADING = 'No donations yet';
export const SUPPORTERS_EMPTY_GUIDANCE =
  'Be the first to give, and your name appears here.';

export const SHARE_HEADING = (displayName: string) => `Share ${displayName}'s page`;
export const SHARE_COPY_LINK = 'Copy link';
export const SHARE_LINK_COPIED = 'Link copied';
export const SHARE_LINK_COPY_FAILED =
  'Your browser would not copy the link. Select the address bar and copy it instead.';

export const RETRY_LABEL = 'Try again';

export const supportingBanner = (displayName: string) =>
  `You are supporting ${displayName}`;

export const raisedSummary = (raised: string, goal: string | null) =>
  goal ? `${raised} of ${goal}` : raised;

export const donorSummary = (donorCount: number) =>
  donorCount === 1 ? '1 donor' : `${donorCount} donors`;

export const fundraiserCountSummary = (count: number) =>
  count === 1
    ? '1 fundraiser on this campaign'
    : `${count} fundraisers on this campaign`;

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
