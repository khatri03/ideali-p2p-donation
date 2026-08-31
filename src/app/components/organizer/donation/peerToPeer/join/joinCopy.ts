import { FundraiserStatus } from 'app/interface/donationInter/fundraiserJoinDto';

export const JOIN_HEADING = 'Fundraise for this campaign';
export const JOIN_CTA = 'Fundraise for this';

/**
 * What the campaign offers a supporter who already has a page here. The control stays a control:
 * somebody who is already fundraising wants the way back to their page, not a sentence telling them
 * what they already know.
 */
/**
 * The campaign page states what the panel is for before it offers the control, because a lone outline
 * button between two heavy cards reads as a stray control rather than a second thing to do here.
 */
export const FUNDRAISE_PANEL_INVITE_BODY =
  'Create your own page and ask friends and family to give through you.';
export const ALREADY_FUNDRAISING_HEADING = 'You are fundraising for this campaign';
export const ALREADY_FUNDRAISING_BODY =
  'Open your page to share its address or see how much you have raised.';
export const AWAITING_APPROVAL_HEADING = 'Your page is with the charity';
export const AWAITING_APPROVAL_BODY =
  'Nobody can donate through it until it is approved. You will be emailed when that happens.';

export const ALREADY_FUNDRAISING_CTA = 'Go to your fundraising page';
export const AWAITING_APPROVAL_CTA = 'Your page is waiting for approval';
export const JOIN_SUBMIT = 'Create my page';

/**
 * What a supporter is agreeing to before they fill anything in. The heading alone says what the screen
 * is called, not what they end up with, and somebody deciding whether to start needs the second.
 */
export const JOIN_LEAD =
  'You get your own page with its own web address. Share it with friends and family, and every donation made through it counts towards this campaign.';

export const OPTIONAL_MARK = 'Optional';

export const DISPLAY_NAME_LABEL = 'Name on your page';
export const DISPLAY_NAME_HINT = 'This is what supporters see when they open your page.';
export const PERSONAL_GOAL_LABEL = 'Your fundraising goal';
export const PERSONAL_GOAL_HINT =
  'Shown on your page as a target to raise. Leave it blank and no target is shown.';
export const PERSONAL_GOAL_PLACEHOLDER = 'No target';
export const STORY_LABEL = 'Why you are fundraising';
export const STORY_HINT = 'A sentence or two is plenty. You can change it later.';

export const DISPLAY_NAME_MAX_LENGTH = 80;
export const STORY_MAX_LENGTH = 2000;

export const DISPLAY_NAME_REQUIRED = 'Enter the name to show on your fundraising page.';
export const DISPLAY_NAME_TOO_LONG = `Use ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`;
export const GOAL_NOT_POSITIVE = 'Enter an amount greater than zero, or leave this blank.';
export const STORY_TOO_LONG = `Use ${STORY_MAX_LENGTH} characters or fewer.`;

export const SIGN_IN_PROMPT = 'Sign in to fundraise for this campaign';

/**
 * The menu that carries a fundraiser to their own page is built from the token, so it only appears
 * once a new token has been issued. Saying so plainly, and offering the action, is the agreed interim
 * behaviour: it is better to state the limitation than to leave someone hunting for a missing menu.
 */
/**
 * What is actually stale is the menu item, not the page. Saying "sign out to see your page" would tell
 * a supporter to log out of a product that is already showing them the way in.
 */
export const NEXT_SIGN_IN_NOTICE =
  'The fundraising menu item appears after your next sign-in. Until then, the button above takes you to your page.';

export const SIGN_OUT_AND_BACK_IN = 'Sign out and back in';

export const GO_TO_CONSOLE = 'Go to my fundraising';

/**
 * A page waiting on the charity answers nothing yet, so a supporter who sends its address now sends
 * their friends to a screen saying the page is not ready. Reading it is useful; sending it is not.
 */
export const PENDING_ADDRESS_NOTE =
  'Sending this address now takes people to a page that is not ready. Wait until the charity approves it.';

export const successHeading = (status: FundraiserStatus, alreadyJoined: boolean): string => {
  if (alreadyJoined) {
    return 'You already have a page for this campaign';
  }

  return status === 'PendingApproval'
    ? 'Your page has been sent for review'
    : 'Your fundraising page is live';
};

export const successMessage = (status: FundraiserStatus, alreadyJoined: boolean): string => {
  if (alreadyJoined) {
    return 'Nothing was created a second time. Your existing page and every donation it has already taken are unchanged.';
  }

  return status === 'PendingApproval'
    ? 'The charity reviews supporter pages before they go live on this campaign. Your page is not public yet, and nobody can donate through it until it is approved. You will be told when that happens.'
    : 'Your page is public now. Share its address with anyone you would like to donate through you.';
};

export const pageAddressLabel = (status: FundraiserStatus): string =>
  status === 'PendingApproval' ? 'Your page address, once approved' : 'Your page address';

/**
 * A field with a limit says how much room is left before the limit is reached, not after. Typing into
 * a `maxLength` field that has run out looks identical to a broken keyboard.
 */
export const charactersLeftNotice = (used: number, limit: number): string | null => {
  const left = limit - used;

  if (left > Math.min(100, Math.round(limit / 4))) {
    return null;
  }

  return left === 1 ? '1 character left' : `${left} characters left`;
};
