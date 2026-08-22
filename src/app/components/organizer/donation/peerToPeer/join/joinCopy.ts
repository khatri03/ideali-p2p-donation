import { FundraiserStatus } from 'app/interface/donationInter/fundraiserJoinDto';

export const JOIN_HEADING = 'Fundraise for this campaign';
export const JOIN_CTA = 'Fundraise for this';
export const JOIN_SUBMIT = 'Create my page';

export const DISPLAY_NAME_LABEL = 'Name on your page';
export const DISPLAY_NAME_HINT = 'This is what supporters see when they open your page.';
export const PERSONAL_GOAL_LABEL = 'Your fundraising goal';
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
export const NEXT_SIGN_IN_NOTICE =
  'Your fundraising menu appears the next time you sign in. Sign out and back in to see it now.';

export const SIGN_OUT_AND_BACK_IN = 'Sign out and back in';

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
