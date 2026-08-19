import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Spinner,
  Center,
  Icon,
  Image,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdArrowBack, MdReceiptLong } from 'react-icons/md';
import { GroupedOrganizerReport } from '../../../service/admin/tipService';
import Pagination from '../../organizer/donation/organizerDonationComponents/Pagination';
import CampaignDonorDetail from '../tip/camapignDonorDetails';
import tipIcon from '../../../../assets/img/admin/tipIcon.svg';
import Loader from 'app/components/common/Loader';

interface SelectedCampaign {
  campaignUniqueId: string;
  campaignName: string;
  organizerName: string;
}
function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toFixed(2);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

const AVATAR_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#06B6D4', '#F97316', '#6366F1',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface OrganizerCampaignReportProps {
  data: GroupedOrganizerReport[];
  isLoading: boolean;
  error: string | null;
  selectedCount: number;
  onBack: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 6; // number of organizer cards per page (2 per row × 3 rows)

// ─── Component ────────────────────────────────────────────────────────────────

export default function organizerCampaignReport({
  data,
  isLoading,
  error,
  selectedCount,
  onBack,
}: OrganizerCampaignReportProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState<SelectedCampaign | null>(null);

  // ── Colors ──────────────────────────────────────────────────────────────────
  const cardBg = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.200', 'gray.300');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const subTextColor = useColorModeValue('gray.400', 'gray.500');
  const totalLabelColor = useColorModeValue('gray.400', 'gray.500');
  const totalAmountColor = useColorModeValue('gray.800', 'white');
  const backColor = useColorModeValue('gray.500', 'gray.400');
  const backHoverColor = useColorModeValue('gray.800', 'white');
  const headingColor = useColorModeValue('gray.700', 'gray.200');
  const campaignRowHover = useColorModeValue('gray.50', 'whiteAlpha.50');
  const campaignAmountColor = useColorModeValue('gray.600', 'gray.300');
  const emptyColor = useColorModeValue('gray.300', 'gray.600');
  const paginationBg = useColorModeValue('white', 'navy.800');

  // ── Pagination logic ─────────────────────────────────────────────────────────
  const totalRecords = data?.length ?? 0;
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedData = data?.slice(startIdx, endIdx) ?? [];
  const displayedItemsCount = paginatedData.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // scroll back to top of report smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (selectedCampaign) {
  return (
    <CampaignDonorDetail
      campaignUniqueId={selectedCampaign.campaignUniqueId}
      campaignName={selectedCampaign.campaignName}
      organizerName={selectedCampaign.organizerName}
      onBack={() => setSelectedCampaign(null)}
    />
  );
}
  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Loader
        message="Loading Tip Reports..."
        subtitle="Fetching organizer campaign data"
      />
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Box bg={cardBg} borderRadius="12px" border="1px solid" borderColor={borderColor} mt={3} p={6}>
        <Center py={10}>
          <Text fontSize="sm" color="red.400">{error}</Text>
        </Center>
      </Box>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (!data || data.length === 0) {
    return (
      <Box bg={cardBg} borderRadius="12px" border="1px solid" borderColor={borderColor} mt={3} p={6}>
        <Center py={12} flexDirection="column" gap={3}>
          <Box color={emptyColor}><MdReceiptLong size={40} /></Box>
          <Text fontSize="sm" fontWeight="600" color={subTextColor}>No report data found</Text>
          <Text fontSize="xs" color={subTextColor} textAlign="center">
            No campaign tip data available for the selected organizers.
          </Text>
        </Center>
      </Box>
    );
  }

  // ── Report ───────────────────────────────────────────────────────────────────
  return (
    <Box mt={3}>
      {/* Section header */}
      <Flex align="center" gap={2} mb={3} px={1}>
        <Flex
          as="button"
          align="center"
          gap={1}
          color={backColor}
          _hover={{ color: backHoverColor }}
          cursor="pointer"
          onClick={onBack}
          transition="color 0.15s"
          bg="transparent"
          border="none"
          p={0}
        >
          <MdArrowBack size={16} />
        </Flex>
        <Text fontSize="sm" fontWeight="600" color={headingColor}>
          Tip Reports for {selectedCount} Organizer{selectedCount !== 1 ? 's' : ''}
        </Text>
      </Flex>

      {/* Organizer cards */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {paginatedData.map((org) => {
          const initials = getInitials(org.organizerName);
          const bgColor = avatarColor(org.organizerName);

          return (
            <Box
              key={org.organizerUniqueId}
              bg={cardBg}
              borderRadius="12px"
              border="1px solid"
              borderColor={borderColor}
              overflow="hidden"
              boxShadow="sm"
            >
              {/* Organizer header */}
              <Flex
                align="center"
                justify="space-between"
                px={4}
                py={3}
                borderBottom="1px solid"
                borderColor={borderColor}
              >
                <Flex align="center" gap={3}>
                  <Center w="36px" h="36px" borderRadius="8px" bg={bgColor} flexShrink={0}>
                    <Text fontSize="13px" fontWeight="700" color="white">
                      {initials}
                    </Text>
                  </Center>
                  <Box>
                    <Text fontSize="13px" fontWeight="600" color={labelColor} lineHeight="1.3">
                      {org.organizerName}
                    </Text>
                    <Text fontSize="11px" color={subTextColor}>
                      {org.campaigns.length} campaign{org.campaigns.length !== 1 ? 's' : ''}
                    </Text>
                  </Box>
                </Flex>

                {/* Total tips */}
                <Box textAlign="right">
                  <Text fontSize="10px" color={totalLabelColor} textTransform="uppercase" letterSpacing="0.5px">
                    Total Tips
                  </Text>
                  <Text fontSize="14px" fontWeight="700" color={totalAmountColor}>
                    {org.totalTipAmount}
                  </Text>
                </Box>
              </Flex>

              {/* Campaign rows */}
              <Box>
                {org.campaigns.length > 0 ? (
                  org.campaigns.map((campaign, idx) => (
                    <Flex
                      key={campaign.campaignUniqueId ?? idx}
                      align="center"
                      justify="space-between"
                      px={4}
                      py="10px"
                      borderBottom={idx < org.campaigns.length - 1 ? '1px solid' : 'none'}
                      borderColor={borderColor}
                      _hover={{ bg: campaignRowHover }}
                      transition="background 0.1s"
                    >
                      <Flex align="center" gap={2} minW={0} flex={1}>
                        <Image src={tipIcon} alt="tip" boxSize="14px" flexShrink={0} />
                        <Text
                          fontSize="12px"
                          color="blue.500"
                          fontWeight="500"
                          noOfLines={1}
                          cursor="pointer"
onClick={() =>
  setSelectedCampaign({
    campaignUniqueId: campaign.campaignUniqueId,
    organizerName: org.organizerName,
    campaignName: campaign.campaignName,
  })
}
                          _hover={{ textDecoration: 'underline' }}
                        >
                          {campaign.campaignName}
                        </Text>
                      </Flex>
                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color={campaignAmountColor}
                        whiteSpace="nowrap"
                        ml={3}
                      >
                        $ {formatCompact(campaign.totalTipAmount)}
                      </Text>
                    </Flex>
                  ))
                ) : (
                  <Center py={4}>
                    <Text fontSize="12px" color={subTextColor}>No campaigns found</Text>
                  </Center>
                )}
              </Box>
            </Box>
          );
        })}
      </SimpleGrid>

      {/* ── Pagination ── */}
      {totalRecords > ITEMS_PER_PAGE && (
        <Box bg={paginationBg} borderRadius="12px" border="1px solid" borderColor={borderColor} mt={4}>
          <Pagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            entriesPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            displayedItemsCount={displayedItemsCount}
          />
        </Box>
      )}
    </Box>
  );
}