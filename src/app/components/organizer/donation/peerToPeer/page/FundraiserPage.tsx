import { useNavigate, useParams } from 'react-router-dom';
import { SimpleGrid, Stack } from '@chakra-ui/react';
import { FundraiserPage as FundraiserPageData } from 'app/interface/donationInter/fundraiserPageDto';
import LeaderboardLink from '../leaderboard/LeaderboardLink';
import { leaderboardPath } from '../leaderboard/leaderboardPaths';
import FundraiserIdentity from './FundraiserIdentity';
import FundraiserPageNotice from './FundraiserPageNotice';
import FundraiserPageSkeleton from './FundraiserPageSkeleton';
import FundraiserProgressPanel from './FundraiserProgressPanel';
import FundraiserStoryPanel from './FundraiserStoryPanel';
import FundraiserTeamLink from './FundraiserTeamLink';
import PublicPageShell from './PublicPageShell';
import RecentSupportersPanel from './RecentSupportersPanel';
import SharePanel from './SharePanel';
import {
  NOT_FOUND_GUIDANCE,
  NOT_FOUND_HEADING,
  RETRY_LABEL,
  socialPreviewTitle,
  unavailableExplanation,
  unavailableHeading,
} from './pageCopy';
import { useFundraiserPage } from './useFundraiserPage';
import { useSocialPreview } from './useSocialPreview';

/** The public address of a fundraiser page, as agreed: /campaigns/{campaign}/{fundraiser}. */
export const fundraiserPagePath = (campaignSlug: string, fundraiserSlug: string) =>
  `/campaigns/${campaignSlug}/${fundraiserSlug}`;

export const fundraiserDonatePath = (campaignSlug: string, fundraiserSlug: string) =>
  `${fundraiserPagePath(campaignSlug, fundraiserSlug)}/donate`;

/**
 * Screen 04. Composes the public fundraiser page and nothing else: every piece below is presentational
 * and every state a stranger can land in - loading, missing, waiting for approval, withdrawn, finished
 * campaign, and live with no donations yet - is a designed surface.
 */
export const FundraiserPageScreen = () => {
  const { campaignSlug, fundraiserSlug } = useParams<{
    campaignSlug: string;
    fundraiserSlug: string;
  }>();
  const navigate = useNavigate();
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
      <PublicPageShell>
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
      <PublicPageShell>
        <FundraiserPageNotice
          heading={unavailableHeading(page.state)}
          message={unavailableExplanation(page.state, page.displayName, page.organizerName)}
        />
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell>
      <LiveFundraiserPage
        page={page}
        onDonate={() => navigate(fundraiserDonatePath(page.campaignSlug, page.slug))}
      />
    </PublicPageShell>
  );
};

interface LiveFundraiserPageProps {
  page: FundraiserPageData;
  onDonate: () => void;
}

const LiveFundraiserPage = ({ page, onDonate }: LiveFundraiserPageProps) => {
  const shareUrl = `${window.location.origin}${fundraiserPagePath(page.campaignSlug, page.slug)}`;

  useSocialPreview({
    title: socialPreviewTitle(page.displayName, page.campaignName),
    description: page.story?.slice(0, 200) ?? `Support ${page.campaignName}.`,
    url: shareUrl,
  });

  return (
    <SimpleGrid columns={{ base: 1, lg: 3 }} gap={{ base: 4, md: 6 }} alignItems="start">
      <Stack gridColumn={{ lg: 'span 2' }} gap={{ base: 4, md: 6 }} minW={0}>
        <FundraiserIdentity
          displayName={page.displayName}
          campaignName={page.campaignName}
          campaignUniqueId={page.campaignUniqueId}
          organizerName={page.organizerName}
          fundraisingSinceUtc={page.fundraisingSinceUtc}
          photoUniqueId={page.photoUniqueId}
          team={
            page.team ? <FundraiserTeamLink campaignSlug={page.campaignSlug} team={page.team} /> : null
          }
        />

        {page.story && <FundraiserStoryPanel story={page.story} />}

        <RecentSupportersPanel
          supporters={page.recentSupporters}
          currencySymbol={page.currencySymbol}
        />
      </Stack>

      <Stack gap={{ base: 4, md: 6 }} minW={0}>
        <FundraiserProgressPanel
          displayName={page.displayName}
          organizerName={page.organizerName}
          raisedAmount={page.raisedAmount}
          goal={page.goal}
          donorCount={page.donorCount}
          currencySymbol={page.currencySymbol}
          onDonate={onDonate}
        />

        <SharePanel shareUrl={shareUrl} />

        <LeaderboardLink
          to={leaderboardPath(page.campaignSlug)}
          isReachable={page.isLeaderboardPublished}
        />
      </Stack>
    </SimpleGrid>
  );
};

export default FundraiserPageScreen;
