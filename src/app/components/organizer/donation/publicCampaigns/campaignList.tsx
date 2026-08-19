import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Grid,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  Badge,
  HStack,
  VStack,
  Card,
  CardBody,
  useToast,
  Skeleton,
  Icon,
  Button,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { MdCampaign } from 'react-icons/md';
import { useParams } from 'react-router-dom';
import campaignService, { Campaign } from '../../../../service/organizer/donation/publicCampaigns/campaignSevice';
import logo from '../../../../../assets/img/logo/idealiLogo.svg';
import Loader from 'app/components/common/Loader';
import CustomButton from 'app/components/common/CustomButton';
import donateIcon from '../../../../../assets/img/organizer/donation/donateIcon.svg';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const formatAmount = (val: number | null): string => {
  if (!val) return '$0';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
};

const getDaysLeft = (endDate: string): number =>
  Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000));

const getProgressPct = (achieved: number, goal: number): number =>
  goal > 0 ? Math.min(100, Math.round((achieved / goal) * 100)) : 0;

const STATUS_BADGE: Record<
  string,
  { colorScheme?: string; bg?: string; color?: string; border?: boolean; label: string }
> = {
  Draft:          { bg: 'white', color: 'gray.500', border: true, label: 'Draft' },
  Started:        { colorScheme: 'green',  label: 'Active' },
  Published:      { colorScheme: 'green',  label: 'Active' },
  Ended:          { colorScheme: 'gray',   label: 'Ended' },
  'Goal Reached': { colorScheme: 'yellow', label: 'Goal Reached' },
};

const getStatusBadge = (status: string) =>
  STATUS_BADGE[status] ?? { colorScheme: 'blue', label: status };
export default function CampaignList() {
  const toast = useToast();

  const { organizerUniqueId: paramId } = useParams<{ organizerUniqueId: string }>();
  const organizerUniqueId = paramId || localStorage.getItem('organizerUniqueId') || '';
  const [campaigns, setCampaigns]         = useState<Campaign[]>([]);
  const [loading, setLoading]             = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const [entriesPerPage]                  = useState(8);
  const [imageErrors, setImageErrors]         = useState<Set<string>>(new Set());
  const [bannerVersion, setBannerVersion]     = useState(0); // bumped after all banners load → single re-render
  const loadingBannersRef                     = useRef<Set<string>>(new Set());
  const bannerUrlsRef                         = useRef<Record<string, string>>({});

  const debouncedSearch = useDebounce(searchQuery, 300);
  const filtered = debouncedSearch
    ? campaigns.filter(c =>
        c.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : campaigns;

  const totalRecords = filtered.length;
  const totalPages   = Math.ceil(totalRecords / entriesPerPage);
  const paginated    = filtered.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await campaignService.getCampaignList(organizerUniqueId);
      setCampaigns(res.data ?? []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to fetch campaigns',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [organizerUniqueId, toast]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  const loadBanners = useCallback((campaignList: Campaign[]) => {
    const toLoad = campaignList.filter(c => {
      const bannerId = c.bannerList?.[0];
      return (
        bannerId &&
        !bannerUrlsRef.current[bannerId] &&
        !loadingBannersRef.current.has(c.uniqueId)
      );
    });

    if (toLoad.length === 0) return;
    toLoad.forEach(c => loadingBannersRef.current.add(c.uniqueId));
    Promise.all(
      toLoad.map(async (campaign) => {
        const bannerId = campaign.bannerList[0];
        try {
          const blobUrl = await campaignService.getBannerImageBlob(bannerId);
          bannerUrlsRef.current[bannerId] = blobUrl;
        } catch {
          setImageErrors(prev => new Set(prev).add(campaign.uniqueId));
        } finally {
          loadingBannersRef.current.delete(campaign.uniqueId);
        }
      })
    ).then(() => {
      // Single re-render after ALL banners are ready
      setBannerVersion(v => v + 1);
    });
  }, []);

  // ── Trigger banner loads after campaigns fetch ──
  useEffect(() => {
    if (campaigns.length > 0 && !loading) {
      loadBanners(campaigns);
    }
  }, [campaigns, loading, loadBanners]);

  // ── Re-load banners when user returns to tab ──
  // Blob URLs can be silently revoked by the browser when the tab is hidden.
  // On visibility restore we clear the stale cache and re-fetch everything.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && campaigns.length > 0) {
        // Revoke any stale blob URLs and clear the cache
        Object.values(bannerUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
        bannerUrlsRef.current = {};
        loadingBannersRef.current = new Set();

        // Re-load all banners fresh
        loadBanners(campaigns);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [campaigns, loadBanners]);

  useEffect(() => {
    return () => {
      Object.values(bannerUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);
  return (
    <Box minH="100vh" bg="gray.50">

      {/* ── Header ── */}
      <Flex
        as="header"
        align="center"
        px={6}
        h="60px"
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        boxShadow="0 1px 4px rgba(0,0,0,0.06)"
        position="sticky"
        top={0}
        zIndex={100}
      >
        <Image
          src={logo}
          alt="Ideali Logo"
          h="36px"
          objectFit="contain"
          fallback={
            <Flex align="center" gap={2}>
              <Box
                w="32px" h="32px"
                borderRadius="8px"
                bgGradient="linear(135deg, purple.500, purple.300)"
                display="flex" alignItems="center" justifyContent="center"
              >
                <Icon as={MdCampaign} color="white" boxSize={4} />
              </Box>
              <Text fontWeight="800" fontSize="16px" color="gray.800" letterSpacing="-0.3px">
                ideali
              </Text>
            </Flex>
          }
        />
      </Flex>

      {/* ── Page body ── */}
      <Box px={6} py={6}>
        <Flex mb={3} align="center" justify="space-between" gap={3} flexWrap="wrap">
          <Text
            fontWeight="700"
            fontSize="var(--chakra-fontSizes-s+)"
            lineHeight="32px"
            letterSpacing="0"
            verticalAlign="middle"
            color="gray.800"
          >
            Campaigns
          </Text>
        </Flex>

        <InputGroup w="200px" flexShrink={0}>
          <Input
            placeholder="Search campaigns"
            h="36px"
            bg="white"
            mb={5}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            borderColor="gray.300"
            borderRadius="md"
            fontSize="sm"
          />
          <InputRightElement h="36px">
            <SearchIcon color="gray.400" boxSize={3} />
          </InputRightElement>
        </InputGroup>
        {loading ? (
          <Loader
            message="Loading Campaigns..."
            subtitle="Please wait while we fetch the latest campaigns"
          />
        ) : (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
              xl: 'repeat(4, 1fr)',
            }}
            gap={4}
          >
            {paginated.map((campaign) => {
              // Reading bannerVersion ensures this map re-runs when banners finish loading
              void bannerVersion;

              const bannerId        = campaign.bannerList?.[0];
              const bannerBlobUrl   = bannerId ? bannerUrlsRef.current[bannerId] : null;
              const isLoadingBanner = loadingBannersRef.current.has(campaign.uniqueId);
              const hasImgError     = imageErrors.has(campaign.uniqueId);
              const pct             = getProgressPct(campaign.goal.goalAchieved, campaign.goal.goal);
              const statusBadge     = getStatusBadge(campaign.status);
              const isDraft         = campaign.status === 'Draft';
              const isEnded         = campaign.status === 'Ended';

              return (
                <Card
                  key={campaign.uniqueId}
                  bg="white"
                  border="1px"
                  borderColor="purple.200"
                  borderRadius="2xl"
                  overflow="hidden"
                  display="flex"
                  flexDirection="column"
                  transition="all 0.3s"
                  boxShadow="0 1px 3px 0 rgba(29,33,43,0.06)"
                  _hover={{ transform: 'translateY(-3px)', boxShadow: 'lg' }}
                >
                  {/* ── Banner ── */}
                  <Box
                    position="relative"
                    w="100%" h="160px"
                    flexShrink={0}
                    overflow="hidden"
                    bg="gray.100"
                  >
                    {isLoadingBanner ? (
                      <Skeleton position="absolute" top={0} left={0} w="100%" h="100%" />
                    ) : bannerBlobUrl && !hasImgError ? (
                      <Image
                        position="absolute" top={0} left={0}
                        src={bannerBlobUrl}
                        alt={campaign.name}
                        w="100%" h="100%"
                        objectFit="cover"
                        onError={() =>
                          setImageErrors(prev => new Set(prev).add(campaign.uniqueId))
                        }
                      />
                    ) : (
                      <Flex
                        position="absolute" top={0} left={0}
                        w="100%" h="100%"
                        align="center" justify="center"
                        bgGradient="linear(135deg, purple.100, purple.200)"
                      >
                        <Icon as={MdCampaign} boxSize={12} color="purple.400" />
                      </Flex>
                    )}
                    <Box
                      position="absolute" top={0} left={0} right={0}
                      h="60px"
                      bgGradient="linear(to-b, blackAlpha.600, transparent)"
                      pointerEvents="none"
                    />

                    {/* Overlay badges */}
                    <Flex
                      position="absolute" top={0} left={0} right={0}
                      px={2.5} pt={2.5}
                      align="center" gap={1.5}
                    >
                      {/* Days left */}
                      <Badge
                        fontSize="10px" bg="blackAlpha.700" color="white"
                        borderRadius="full" px={2} py={0.5}
                        fontWeight="bold" textTransform="uppercase"
                        whiteSpace="nowrap" letterSpacing="0.03em"
                      >
                        <HStack spacing={1} display="inline-flex" alignItems="center" pt={1}>
                          <Box as="span" display="inline-flex">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                          </Box>
                          <Text as="span">{getDaysLeft(campaign.endDate)} DAYS LEFT</Text>
                        </HStack>
                      </Badge>

                      {/* Donor count */}
                      <Badge
                        fontSize="10px" bg="blackAlpha.700" color="white"
                        borderRadius="full" px={2} py={0.5}
                        fontWeight="medium" whiteSpace="nowrap"
                      >
                        <HStack spacing={1} display="inline-flex" alignItems="center" pt={1}>
                          <Box as="span" display="inline-flex">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          </Box>
                          <Text as="span">{campaign.invoiceCount ?? 0}</Text>
                        </HStack>
                      </Badge>

                      {/* Goal reached */}
                      {pct >= 100 && (
                        <Badge
                          ml="auto" fontSize="10px" colorScheme="yellow"
                          borderRadius="full" px={2} py={0.5}
                          fontWeight="bold" textTransform="uppercase" whiteSpace="nowrap"
                        >
                          Goal Reached
                        </Badge>
                      )}
                    </Flex>
                  </Box>

                  {/* ── Card body ── */}
                  <CardBody p={3} display="flex" flexDirection="column" flex={1}>

                    {/* Status badge */}
                    <Badge
                      mb={2} alignSelf="flex-start" fontSize="11px"
                      colorScheme={statusBadge.colorScheme}
                      bg={statusBadge.bg} color={statusBadge.color}
                      border={statusBadge.border ? '1px solid' : undefined}
                      borderColor={statusBadge.border ? 'gray.300' : undefined}
                      borderRadius="full" px={3} py={0.5}
                      fontWeight="medium" textTransform="capitalize"
                    >
                      {statusBadge.label}
                    </Badge>

                    {/* Campaign name */}
                    <Text
                      fontWeight="bold" fontSize="sm" color="gray.800"
                      noOfLines={1} lineHeight="1.4" mb={2}
                    >
                      {campaign.name}
                    </Text>

                    {/* Donate button */}
                    <CustomButton
                      size="sm"
                      fullWidth
                      fontSize="12px"
                      isDisabled={isDraft || isEnded}
                      onClick={() => window.open(`/donate/${campaign.uniqueId}`, '_blank')}
                      leftIcon={<Image src={donateIcon} alt="donate" boxSize="13px" />}
                    >
                      Donate
                    </CustomButton>

                    {/* Divider */}
                    <Box mt={3} borderTop="1px" borderColor="gray.300" mb={3} />

                    {/* Stats: Raised / Goal / Donations */}
                    <HStack justify="space-between" spacing={2}>
                      <VStack spacing={0} align="flex-start" flex={1} minW={0}>
                        <Text fontSize="9px" color="gray.400" fontWeight="bold" textTransform="uppercase" letterSpacing="0.07em">
                          RAISED
                        </Text>
                        <Text fontSize="sm" fontWeight="bold" color="gray.800" noOfLines={1}>
                          {formatAmount(campaign.goal.goalAchieved)}
                        </Text>
                      </VStack>
                      <VStack spacing={0} align="center" flex={1} minW={0}>
                        <Text fontSize="9px" color="gray.400" fontWeight="bold" textTransform="uppercase" letterSpacing="0.07em">
                          GOAL
                        </Text>
                        <Text fontSize="sm" fontWeight="bold" color="gray.800" noOfLines={1}>
                          {formatAmount(campaign.goal.goal)}
                        </Text>
                      </VStack>
                      <VStack spacing={0} align="flex-end" flex={1} minW={0}>
                        <Text fontSize="9px" color="gray.400" fontWeight="bold" textTransform="uppercase" letterSpacing="0.07em">
                          DONATIONS
                        </Text>
                        <Text fontSize="sm" fontWeight="bold" color="gray.800" noOfLines={1}>
                          {campaign.invoiceCount}
                        </Text>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              );
            })}
          </Grid>
        )}

        {/* ── Empty state ── */}
        {!loading && paginated.length === 0 && (
          <Box textAlign="center" py={12} bg="white" borderRadius="xl" shadow="sm">
            <Text color="gray.500" fontSize="lg" fontWeight="medium">No campaigns found</Text>
            <Text color="gray.400" fontSize="sm" mt={2}>Try adjusting your search</Text>
          </Box>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <Flex justify="space-between" align="center" mt={6} flexWrap="wrap" gap={2}>
            <Text fontSize="sm" color="gray.500">
              Showing {(currentPage - 1) * entriesPerPage + 1}–{Math.min(currentPage * entriesPerPage, totalRecords)} of {totalRecords}
            </Text>
            <HStack spacing={1}>
              <Button
                size="sm" variant="outline" colorScheme="purple"
                isDisabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ‹ Prev
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page} size="sm" colorScheme="purple"
                  variant={page === currentPage ? 'solid' : 'outline'}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                size="sm" variant="outline" colorScheme="purple"
                isDisabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next ›
              </Button>
            </HStack>
          </Flex>
        )}
      </Box>
    </Box>
  );
}