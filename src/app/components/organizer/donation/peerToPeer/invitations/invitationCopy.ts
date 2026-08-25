import { InvitationStatus } from 'app/interface/donationInter/fundraiserInvitationDto';

export const INVITATIONS_HEADING = 'Invitations';
export const COMPOSE_HEADING = 'Invite people to fundraise';
export const COMPOSE_NOTE =
  'An invitation is an offer. Nothing is created until the person follows the link and agrees.';

export const ADDRESSES_LABEL = 'Email addresses';
export const ADDRESSES_PLACEHOLDER = 'one@example.com, two@example.com';
export const ADDRESSES_HELP = 'Separate addresses with a comma, a space or a new line.';
export const PERSONAL_MESSAGE_LABEL = 'Personal message';
export const PERSONAL_MESSAGE_PLACEHOLDER =
  'A line or two in your own words. It appears above the button in the email.';
export const SUPPORTERS_LABEL = 'Or pick from people who have given before';
export const SUPPORTERS_SEARCH_PLACEHOLDER = 'Search supporters by name or address';
export const SEND_LABEL = 'Send invitations';
export const SENDING_LABEL = 'Sending...';
export const PREVIEW_LABEL = 'Preview the email';
export const PREVIEW_HEADING = 'The invitation email';
export const PREVIEW_NOTE =
  'This is the email itself, not a description of it. The link is live only in the real send.';
export const PREVIEW_FRAME_TITLE = 'Invitation email preview';
export const CLOSE_LABEL = 'Close';

export const ADDRESS_LIMIT = 50;
export const MESSAGE_LIMIT = 1000;

export const NO_ADDRESSES_ERROR = 'Add at least one email address.';
export const TOO_MANY_ADDRESSES_ERROR = `Invite up to ${ADDRESS_LIMIT} people at a time.`;
export const MESSAGE_TOO_LONG_ERROR = `Keep the personal message under ${MESSAGE_LIMIT} characters.`;
export const invalidAddressError = (address: string) => `${address} is not a valid email address.`;

export const SEARCH_LABEL = 'Search invitations';
export const SEARCH_PLACEHOLDER = 'Search by address';
export const STATUS_FILTER_LABEL = 'Status';
export const ALL_STATUSES_LABEL = 'All statuses';

export const EMPTY_HEADING = 'Nobody has been invited yet';
export const EMPTY_BODY =
  'Invite the supporters most likely to say yes. Their own network gives more than a public appeal does.';
export const NO_MATCHES_HEADING = 'No invitations match that';
export const NO_MATCHES_BODY = 'Clear the search or choose a different status.';

export const ADDRESS_COLUMN = 'Address';
export const STATUS_COLUMN = 'Status';
export const SENT_COLUMN = 'Sent';
export const EXPIRES_COLUMN = 'Expires';
export const INVITED_BY_COLUMN = 'Invited by';

export const SUMMARY_SENT = 'Sent';
export const SUMMARY_OPENED = 'Opened';
export const SUMMARY_ACCEPTED = 'Accepted';
export const SUMMARY_EXPIRED = 'Expired';
export const SUMMARY_SUPPRESSED = 'Held back';

export const STATUS_SCHEMES: Record<InvitationStatus, string> = {
  Sent: 'blue',
  Opened: 'purple',
  Accepted: 'green',
  Expired: 'gray',
  'Not sent': 'red',
};

export const LIST_FAILED = 'The invitations on this campaign could not be read.';

export const showingRange = (page: number, pageSize: number, total: number) => {
  if (total === 0) {
    return 'No invitations';
  }

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return `Showing ${first}-${last} of ${total}`;
};

/**
 * People paste addresses out of a spreadsheet, an email client or a text file, so all three separators
 * are accepted rather than making the organiser tidy the list by hand first.
 */
export const splitAddresses = (raw: string): string[] =>
  raw
    .split(/[\s,;]+/)
    .map((address) => address.trim())
    .filter((address) => address.length > 0);

const EMAIL_SHAPE = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

export const isEmailShaped = (address: string) =>
  address.length <= 254 && EMAIL_SHAPE.test(address);
