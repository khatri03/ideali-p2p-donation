import { Box, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  DonorDashboardSummary,
  RecentDonationItem,
  SuggestedCampaignItem,
} from 'app/interface/memberInter/donorDashboardDto';
import Loader from 'app/components/common/Loader';
import donorDashboardService from '../services/donorDashboardService';
import LifetimeImpactBanner from './LifetimeImpactBanner';
import StatCards from './StatCards';
import RecentDonationsList from './RecentDonationsList';
import SuggestedCampaigns from './SuggestedCampaigns';
import MembershipInfoCard from './MembershipInfoCard';
import { getAllowedModules, hasAllowedModule } from 'utils/allowedModules';

function DonorDashboard() {
  // Tokens that don't carry the modules claim keep the legacy donor-only view.
  const claimedModules = getAllowedModules();
  const hasDonationModule = claimedModules.length === 0 || hasAllowedModule('Donation');
  const hasMembershipModule = hasAllowedModule('Membership');

  const [summary, setSummary] = useState<DonorDashboardSummary | null>(null);
  const [recentDonations, setRecentDonations] = useState<RecentDonationItem[]>([]);
  const [suggestedCampaigns, setSuggestedCampaigns] = useState<SuggestedCampaignItem[]>([]);
  const [loading, setLoading] = useState(hasDonationModule);
  const textColor = useColorModeValue('#1B2559', 'white');

  const donorName = localStorage.getItem('userName') ?? 'Donor';

  useEffect(() => {
    if (!hasDonationModule) return;
    Promise.all([
      donorDashboardService.getDashboardSummary(),
      donorDashboardService.getLatestDonations(),
      donorDashboardService.getSuggestedCampaigns(1, 3),
    ]).then(([summaryRes, donationsRes, campaignsRes]) => {
      setSummary(summaryRes);
      setRecentDonations(donationsRes);
      setSuggestedCampaigns(campaignsRes?.pageData ?? []);
      setLoading(false);
    });
  }, [hasDonationModule]);

  if (hasDonationModule && loading) {
    return <Loader message="Loading your dashboard…" subtitle="Fetching your latest activity" fullPage />;
  }

  // "Shared" dashboard: donor sees both donation and membership content.
  const isSharedDashboard = hasDonationModule && hasMembershipModule;

  return (
    <Box pt={{ base: '10px', md: '50px' }}>
      {hasMembershipModule && !isSharedDashboard && <MembershipInfoCard />}

      {hasDonationModule && (
        summary ? (
          <>
            <LifetimeImpactBanner
              donorName={donorName}
              totalDonated={summary.lifetimeTotalDonationAmount}
              campaignsCount={summary.totalDonationCampaigns}
              organizersCount={summary.totalOrganizers}
            />
            <StatCards summary={summary} />
            <Flex gap="20px" align="flex-start" direction={{ base: 'column', lg: 'row' }} mb={isSharedDashboard ? '24px' : undefined}>
              <Box flex="1" minW="0">
                <RecentDonationsList donations={recentDonations} />
              </Box>
              <Box w={{ base: '100%', lg: '400px' }} flexShrink={0}>
                <SuggestedCampaigns campaigns={suggestedCampaigns} />
              </Box>
            </Flex>
            {isSharedDashboard && <MembershipInfoCard />}
          </>
        ) : (
          <Text color={textColor}>Unable to load dashboard. Please try again.</Text>
        )
      )}
    </Box>
  );
}

export default DonorDashboard;
