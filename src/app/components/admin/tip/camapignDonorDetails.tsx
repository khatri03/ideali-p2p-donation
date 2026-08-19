import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Spinner,
  Center,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
} from '@chakra-ui/react';
import { MdArrowBack, MdAttachMoney, MdPeople, MdTrendingUp, MdEmail } from 'react-icons/md';
import TipReportService, {
  CampaignDonorRow,
  CampaignDonorSummaryResponse,
} from '../../../service/admin/tipService';
import Pagination from '../../organizer/donation/organizerDonationComponents/Pagination';
import Loader from 'app/components/common/Loader';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

const AVATAR_COLORS = [
  '#3B82F6'
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const PAGE_SIZE = 20;

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  cardBg: string;
  borderColor: string;
  labelColor: string;
  valueColor: string;
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, cardBg, borderColor, labelColor, valueColor }: StatCardProps) {
  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="10px"
      px={4}
      py={4}
      boxShadow="sm"
    >
      <Flex align="center" gap={3}>
        <Center w="36px" h="36px" borderRadius="8px" bg={iconBg} flexShrink={0}>
          <Icon size={18} color={iconColor} />
        </Center>
        <Box>
          <Text fontSize="10px" color={labelColor} textTransform="uppercase" letterSpacing="0.6px" fontWeight="500">
            {label}
          </Text>
          <Text fontSize="16px" fontWeight="700" color={valueColor} lineHeight="1.3">
            {value}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CampaignDonorDetailProps {
  campaignUniqueId: string;
  campaignName: string;
  organizerName: string;
  onBack: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CampaignDonorDetail({
  campaignUniqueId,
  campaignName,
  organizerName,
  onBack,
}: CampaignDonorDetailProps) {
  const [data, setData] = useState<CampaignDonorSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Colors ──────────────────────────────────────────────────────────────────
  const cardBg = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'white');
  const headingColor = useColorModeValue('gray.800', 'white');
  const subColor = useColorModeValue('gray.500', 'gray.400');
  const backColor = useColorModeValue('gray.500', 'gray.400');
  const backHover = useColorModeValue('gray.800', 'white');
  const tableHeaderBg = useColorModeValue('gray.50', 'navy.900');
  const tableHeaderColor = useColorModeValue('gray.500', 'gray.400');
  const tableBorderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const rowHover = useColorModeValue('gray.50', 'whiteAlpha.50');
  const emptyColor = useColorModeValue('gray.300', 'gray.600');
  const sectionTitleColor = useColorModeValue('gray.700', 'gray.200');

  const iconBgBlue = useColorModeValue('blue.50', 'whiteAlpha.100');
  const iconBgGreen = useColorModeValue('green.50', 'whiteAlpha.100');
  const iconBgOrange = useColorModeValue('orange.50', 'whiteAlpha.100');

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await TipReportService.getCampaignDonorSummary(
        campaignUniqueId,
        undefined,
        page,
        PAGE_SIZE
      );
      setData(result);
    } catch {
      setError('Failed to load campaign details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [campaignUniqueId]);

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const donors = data?.pageData ?? [];
  const totalTips = donors.reduce((sum, d) => sum + d.tipAmount, 0);
  const totalDonors = data?.totalRecordsCount ?? 0;
  const avgTip = totalDonors > 0 ? totalTips / donors.length : 0;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
     <Loader
        message="Loading Campaign Details..."
        subtitle="Fetching organizer campaign details"
      />
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Box bg={cardBg} borderRadius="12px" border="1px solid" borderColor={borderColor} mt={3} p={6}>
        <Center py={10}>
          <Text fontSize="sm" color="red.400">{error}</Text>
        </Center>
      </Box>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box mt={3}>

      {/* Back + breadcrumb */}
      <Flex align="center" gap={2} mb={4} px={1}>
        <Flex
          as="button"
          align="center"
          color={backColor}
          _hover={{ color: backHover }}
          cursor="pointer"
          onClick={onBack}
          transition="color 0.15s"
          bg="transparent"
          border="none"
          p={0}
        >
          <MdArrowBack size={16} />
        </Flex>
        <Text fontSize="xs" color={subColor}>
          {organizerName}
        </Text>
        <Text fontSize="xs" color={subColor}>/</Text>
        <Text fontSize="xs" fontWeight="600" color={sectionTitleColor} noOfLines={1}>
          {campaignName}
        </Text>
      </Flex>

      {/* Campaign title */}
      <Box mb={4} px={1}>
        <Text fontSize="lg" fontWeight="700" color={headingColor}>
          {campaignName}
        </Text>
      </Box>

      {/* Stat cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
        <StatCard
          label="Total Tips"
          value={`${(totalTips)}`}
          icon={MdAttachMoney}
          iconBg={iconBgBlue}
          iconColor="#3B82F6"
          cardBg={cardBg}
          borderColor={borderColor}
          labelColor={labelColor}
          valueColor={valueColor}
        />
        <StatCard
          label="Total Donors"
          value={String(totalDonors)}
          icon={MdPeople}
          iconBg={iconBgGreen}
          iconColor="#10B981"
          cardBg={cardBg}
          borderColor={borderColor}
          labelColor={labelColor}
          valueColor={valueColor}
        />
        <StatCard
          label="Average Tip"
          value={`${formatAmount(avgTip)}`}
          icon={MdAttachMoney}
          iconBg={iconBgOrange}
          iconColor="#F59E0B"
          cardBg={cardBg}
          borderColor={borderColor}
          labelColor={labelColor}
          valueColor={valueColor}
        />
      </SimpleGrid>

      {/* Donor Details Table */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="10px"
        overflow="hidden"
        boxShadow="sm"
      >
        {/* Table header */}
        <Box px={4} py={3} borderBottom="1px solid" borderColor={borderColor}>
          <Text fontSize="sm" fontWeight="600" color={sectionTitleColor}>
            Donor Details
          </Text>
        </Box>

        {donors.length === 0 ? (
          <Center py={12} flexDirection="column" gap={3}>
            <Box color={emptyColor}><MdPeople size={36} /></Box>
            <Text fontSize="sm" color={subColor}>No donor data found</Text>
          </Center>
        ) : (
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead bg={tableHeaderBg}>
                <Tr>
                  <Th color={tableHeaderColor} fontSize="11px" borderColor={tableBorderColor} w="40px">#</Th>
                  <Th color={tableHeaderColor} fontSize="11px" borderColor={tableBorderColor}>Donor Name</Th>
                  <Th color={tableHeaderColor} fontSize="11px" borderColor={tableBorderColor}>Invoice No</Th>
                  <Th color={tableHeaderColor} fontSize="11px" borderColor={tableBorderColor}>Status</Th>
                  <Th color={tableHeaderColor} fontSize="11px" borderColor={tableBorderColor}>Date</Th>
                  <Th color={tableHeaderColor} fontSize="11px" borderColor={tableBorderColor} isNumeric>Tip Donated</Th>
                </Tr>
              </Thead>
              <Tbody>
                {donors.map((donor, idx) => {
                  const initials = getInitials(donor.contactName || '?');
                  const bg = avatarColor(donor.contactName || '?');
                  const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;

                  return (
                    <Tr
                      key={donor.invoiceUniqueId}
                      _hover={{ bg: rowHover }}
                      transition="background 0.1s"
                    >
                      {/* # */}
                      <Td borderColor={tableBorderColor} color={subColor} fontSize="12px">
                        {rowNum}
                      </Td>

                      {/* Donor Name */}
                      <Td borderColor={tableBorderColor}>
                        <Flex align="center" gap={2}>
                          <Center
                            w="28px"
                            h="28px"
                            borderRadius="full"
                            bg={bg}
                            flexShrink={0}
                          >
                            <Text fontSize="10px" fontWeight="700" color="white">
                              {initials}
                            </Text>
                          </Center>
                          <Text fontSize="13px" fontWeight="500" color={valueColor}>
                            {donor.contactName || '-'}
                          </Text>
                        </Flex>
                      </Td>

                      {/* Invoice No */}
                      <Td borderColor={tableBorderColor}>
                        <Text fontSize="12px" color={subColor}>
                          {donor.invoiceNo}
                        </Text>
                      </Td>

                      {/* Status */}
                      <Td borderColor={tableBorderColor}>
                        <Badge
                          colorScheme={donor.invoiceStatus === 'Paid' ? 'green' : 'gray'}
                          fontSize="10px"
                          borderRadius="4px"
                          px={2}
                          py="1px"
                        >
                          {donor.invoiceStatus}
                        </Badge>
                      </Td>

                      {/* Date */}
                      <Td borderColor={tableBorderColor}>
                        <Text fontSize="12px" color={subColor}>
                          {formatDate(donor.createdOnUtc)}
                        </Text>
                      </Td>

                      {/* Tip Amount */}
                      <Td borderColor={tableBorderColor} isNumeric>
                        <Text fontSize="13px" fontWeight="600" color={valueColor}>
                          {(donor.tipAmount)}
                        </Text>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {(data?.totalRecordsCount ?? 0) > PAGE_SIZE && (
          <Box borderTop="1px solid" borderColor={borderColor}>
            <Pagination
              currentPage={currentPage}
              totalRecords={data?.totalRecordsCount ?? 0}
              entriesPerPage={PAGE_SIZE}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              displayedItemsCount={donors.length}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}