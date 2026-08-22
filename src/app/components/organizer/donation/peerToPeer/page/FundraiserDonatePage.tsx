import { useParams } from 'react-router-dom';
import DonateToCampaign from '../../donateToCampaign';
import FundraiserPageNotice from './FundraiserPageNotice';
import FundraiserPageSkeleton from './FundraiserPageSkeleton';
import PublicPageShell from './PublicPageShell';
import { fundraiserPagePath } from './FundraiserPage';
import {
  NOT_FOUND_GUIDANCE,
  NOT_FOUND_HEADING,
  RETRY_LABEL,
  unavailableExplanation,
  unavailableHeading,
} from './pageCopy';
import { useFundraiserPage } from './useFundraiserPage';

/**
 * Screen 07. Donating through somebody's page is the existing donation flow with one thing added: the
 * fundraiser is resolved from the address first, so a page that is not taking money is refused here
 * rather than at the card step, and the campaign the donor is really giving to is read from the server
 * rather than from the URL.
 */
export const FundraiserDonatePage = () => {
  const { campaignSlug, fundraiserSlug } = useParams<{
    campaignSlug: string;
    fundraiserSlug: string;
  }>();
  const { page, isLoading, loadError, reload } = useFundraiserPage(campaignSlug, fundraiserSlug);

  if (isLoading) {
    return (
      <PublicPageShell>
        <FundraiserPageSkeleton />
      </PublicPageShell>
    );
  }

  if (loadError || !page) {
    return (
      <PublicPageShell maxWidth="820px">
        <FundraiserPageNotice
          heading={NOT_FOUND_HEADING}
          message={NOT_FOUND_GUIDANCE}
          onRetry={reload}
          retryLabel={RETRY_LABEL}
        />
      </PublicPageShell>
    );
  }

  if (page.state !== 'Available') {
    return (
      <PublicPageShell maxWidth="820px">
        <FundraiserPageNotice
          heading={unavailableHeading(page.state)}
          message={unavailableExplanation(page.state, page.displayName, page.organizerName)}
        />
      </PublicPageShell>
    );
  }

  return (
    <DonateToCampaign
      campaignUniqueId={page.campaignUniqueId}
      fundraiser={{
        slug: page.slug,
        displayName: page.displayName,
        campaignName: page.campaignName,
        organizerName: page.organizerName,
        pagePath: fundraiserPagePath(page.campaignSlug, page.slug),
      }}
    />
  );
};

export default FundraiserDonatePage;
