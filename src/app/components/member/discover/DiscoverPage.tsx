import {
  Badge,
  Box,
  Flex,
  Grid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { OrganizerCampaign, OrganizerWithCampaigns } from 'app/interface/memberInter/discoverCampaignDto';
import Loader from 'app/components/common/Loader';
import discoverService from '../services/discoverService';
import CampaignCard from './CampaignCard';

const GRID = { base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' };

function CampaignGrid({ campaigns, loading, bannerUrls }: { campaigns: OrganizerCampaign[]; loading: boolean; bannerUrls: Record<string, string> }) {
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');

  if (loading) {
    return <Loader message="Loading campaigns…" subtitle="Please wait while we fetch available campaigns" />;
  }

  if (campaigns.length === 0) {
    return (
      <Text color={subColor} textAlign="center" py="80px" fontSize="sm">
        No campaigns found.
      </Text>
    );
  }

  return (
    <Grid templateColumns={GRID} gap="20px">
      {campaigns.map((c) => (
        <CampaignCard
          key={c.campaignUniqueId}
          campaign={c}
          bannerUrl={c.bannerList?.[0] ? bannerUrls[c.bannerList[0]] ?? null : null}
        />
      ))}
    </Grid>
  );
}

function OrganizerSection({ org, bannerUrls }: { org: OrganizerWithCampaigns; bannerUrls: Record<string, string> }) {
  const textColor = useColorModeValue('#1B2559', 'white');
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');

  return (
    <Box mb="32px">
      <Flex align="center" gap="10px" mb="16px">
        <Text color={textColor} fontWeight="700" fontSize="md">{org.organizerName}</Text>
        <Text color={subColor} fontSize="sm">· {org.campaigns.length} campaign{org.campaigns.length !== 1 ? 's' : ''}</Text>
      </Flex>
      <Grid templateColumns={GRID} gap="20px">
        {org.campaigns.map((c) => (
          <CampaignCard
            key={c.campaignUniqueId}
            campaign={c}
            bannerUrl={c.bannerList?.[0] ? bannerUrls[c.bannerList[0]] ?? null : null}
          />
        ))}
      </Grid>
    </Box>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <Badge
      ml="6px"
      colorScheme="brand"
      borderRadius="full"
      px="7px"
      fontSize="10px"
      fontWeight="700"
    >
      {count}
    </Badge>
  );
}

function DiscoverPage() {
  const [organizers, setOrganizers] = useState<OrganizerWithCampaigns[]>([]);
  const [loading, setLoading] = useState(true);
  const textColor = useColorModeValue('#1B2559', 'white');

  const bannerUrlsRef = useRef<Record<string, string>>({});
  const [, forceUpdate] = useState({});

  const allCampaigns: OrganizerCampaign[] = organizers.flatMap((o) => o.campaigns);

  const loadBanners = useCallback(async (campaigns: OrganizerCampaign[]) => {
    const pending = campaigns.filter(
      (c) => c.bannerList?.[0] && !bannerUrlsRef.current[c.bannerList[0]],
    );
    await Promise.allSettled(
      pending.map(async (c) => {
        const bannerId = c.bannerList[0];
        try {
          const url = await discoverService.getBannerImageBlob(bannerId);
          bannerUrlsRef.current[bannerId] = url;
        } catch {
          // silently ignore failed banners — card falls back to gradient
        }
      }),
    );
    if (pending.length > 0) forceUpdate({});
  }, []);

  useEffect(() => {
    discoverService.getOrganizerCampaigns().then((res) => {
      setOrganizers(res);
      setLoading(false);
      loadBanners(res.flatMap((o) => o.campaigns));
    });
  }, [loadBanners]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    const ref = bannerUrlsRef.current;
    return () => { Object.values(ref).forEach((u) => URL.revokeObjectURL(u)); };
  }, []);

  return (
    <Box pt={{ base: '10px', md: '50px' }}>
      <Tabs variant="line" colorScheme="brand">
        <TabList borderBottomColor={useColorModeValue('gray.200', 'whiteAlpha.100')} mb="24px">
          <Tab
            fontSize="sm"
            fontWeight="600"
            color={textColor}
            _selected={{ color: 'brand.500', borderBottomColor: 'brand.500', borderBottomWidth: '2px' }}
          >
            All Campaigns
            {!loading && <CountBadge count={allCampaigns.length} />}
          </Tab>
          <Tab
            fontSize="sm"
            fontWeight="600"
            color={textColor}
            _selected={{ color: 'brand.500', borderBottomColor: 'brand.500', borderBottomWidth: '2px' }}
          >
            From My Organizers
            {!loading && <CountBadge count={allCampaigns.length} />}
          </Tab>
        </TabList>

        <TabPanels>
          {/* All Campaigns */}
          <TabPanel p="0">
            <CampaignGrid campaigns={allCampaigns} loading={loading} bannerUrls={bannerUrlsRef.current} />
          </TabPanel>

          {/* From My Organizers */}
          <TabPanel p="0">
            {loading ? (
              <Loader message="Loading organizer campaigns…" subtitle="Please wait while we fetch campaigns from your organizers" />
            ) : organizers.length === 0 ? (
              <Text color={useColorModeValue('#A3AED0', '#A3AED0')} textAlign="center" py="80px" fontSize="sm">
                No organizer campaigns found.
              </Text>
            ) : (
              organizers.map((org) => (
                <OrganizerSection key={org.organizerId} org={org} bannerUrls={bannerUrlsRef.current} />
              ))
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default DiscoverPage;
