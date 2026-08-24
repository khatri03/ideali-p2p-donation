import { MyFundraisingPage } from 'app/interface/donationInter/fundraiserConsoleDto';
import { fundraiserPagePath } from '../page/FundraiserPage';

/**
 * The address a fundraiser sends people to. Empty while the campaign has no public address of its own,
 * which is the one case where there is genuinely nothing to share yet.
 */
export const fundraiserShareUrl = (page: MyFundraisingPage) =>
  page.campaignSlug ? `${window.location.origin}${fundraiserPagePath(page.campaignSlug, page.slug)}` : '';
