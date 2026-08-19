import {
  Box,
  Button,
  Flex,
  Icon,
  Select,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { MdFilterList, MdDownload, MdVolunteerActivism } from 'react-icons/md';
import {
  DonationHistoryRecord,
  DonationHistoryFilters,
} from 'app/interface/memberInter/donorDonationDto';
import StatusBadge from 'app/components/common/StatusBadge';
import MembershipHeroHeader from 'app/components/organizer/membership/common/MembershipHeroHeader';
import donorDonationService from '../services/donorDonationService';

const PAGE_SIZE = 10;

const DATE_OPTIONS = [
  { label: 'Last 90 Days', value: '90' },
  { label: 'All Time', value: 'all' },
  { label: 'This Year', value: 'year' },
] as const;

const PAYMENT_METHOD_OPTIONS = [
  'Visa',
  'Mastercard',
  'ACH',
  'PayPal',
  'Apple Pay',
];

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    CreditCard: 'Credit Card',
    DebitCard: 'Debit Card',
    BankTransfer: 'Bank Transfer',
    ACH: 'ACH Bank Transfer',
    ApplePay: 'Apple Pay',
    GooglePay: 'Google Pay',
    PayPal: 'PayPal',
    Cash: 'Cash',
    Cheque: 'Cheque',
  };
  return map[method] ?? method;
}

function formatDate(utc: string): string {
  // API returns a UTC timestamp without a trailing 'Z', so Date would otherwise
  // parse it as local time and skip the timezone conversion entirely.
  const isoUtc = /[zZ]|[+-]\d{2}:?\d{2}$/.test(utc) ? utc : `${utc}Z`;
  const d = new Date(isoUtc);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

function getDateFrom(range: string): string | undefined {
  if (range === 'all') return undefined;
  if (range === 'year') return `${new Date().getFullYear()}-01-01`;
  const d = new Date();
  d.setDate(d.getDate() - Number(range));
  return d.toISOString().split('T')[0];
}

function MyDonationsPage() {
  const [records, setRecords] = useState<DonationHistoryRecord[]>([]);
  const [allRecords, setAllRecords] = useState<DonationHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<DonationHistoryFilters>({
    dateRange: '90',
    organizerName: '',
    paymentMethod: '',
  });

  const cardBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('#1B2559', 'white');
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');

  const fetchHistory = useCallback(async (page: number, f: DonationHistoryFilters) => {
    setLoading(true);
    const params: Record<string, string> = {};
    const dateFrom = getDateFrom(f.dateRange);
    if (dateFrom) params.dateFrom = dateFrom;

    const res = await donorDonationService.fetchDonationHistory(page, PAGE_SIZE, params);
    if (res) {
      setAllRecords(res.records);
      setTotalRecords(res.totalRecords);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory(currentPage, filters);
  }, [currentPage]);

  // Client-side filter by organizer and payment method
  useEffect(() => {
    let filtered = allRecords;
    if (filters.organizerName) {
      filtered = filtered.filter((r) => r.organizerName === filters.organizerName);
    }
    if (filters.paymentMethod) {
      filtered = filtered.filter((r) => r.paymentMethod === filters.paymentMethod);
    }
    setRecords(filtered);
  }, [allRecords, filters.organizerName, filters.paymentMethod]);

  const handleFilterChange = (key: keyof DonationHistoryFilters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (key === 'dateRange') {
      setCurrentPage(1);
      fetchHistory(1, next);
    }
  };

  // Derive unique organizer options from loaded records
  const organizers = [...new Set(allRecords.map((r) => r.organizerName))];

  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Campaign', 'Organizer', 'Amount', 'Tip', 'Payment Method', 'Status', 'Date'];
    const rows = records.map((r) => [
      r.receiptNo,
      r.campaignName,
      r.organizerName,
      r.amount,
      r.tipAmount,
      formatPaymentMethod(r.paymentMethod),
      r.paymentStatus,
      formatDate(r.donationDateUtc),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'donations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(totalRecords / PAGE_SIZE);

  return (
    <Box pt={16}>
      {/* Hero header */}
      <Box mb="16px">
        <MembershipHeroHeader
          eyebrow="Donations"
          title="My Donations"
          description="Track your giving history, receipts, and payment details in one place."
          action={
            <Button
              size="sm"
              bg="white"
              color="#044bd9"
              borderRadius="10px"
              leftIcon={<Icon as={MdDownload} />}
              fontWeight="600"
              onClick={handleExportCSV}
              isDisabled={records.length === 0}
              _hover={{ bg: 'whiteAlpha.900' }}
            >
              Export CSV
            </Button>
          }
        />
      </Box>

      {/* Filter bar */}
      <Box mx={{ base: 2, md: 4 }} bg={cardBg} borderRadius="xl" px="20px" py="14px" mb="16px"
        boxShadow="14px 17px 40px 4px rgba(112,144,176,0.08)"
        border="1px solid" borderColor={borderColor}
      >
        <Flex align="center" gap="12px" wrap="wrap">
          <Flex align="center" gap="6px" color={subColor}>
            <Icon as={MdFilterList} w="18px" h="18px" />
            <Text fontSize="sm" fontWeight="600" color={textColor}>Filters:</Text>
          </Flex>

          <Select
            size="sm"
            borderRadius="10px"
            maxW="160px"
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            fontWeight="500"
            fontSize="sm"
          >
            {DATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>

          <Select
            size="sm"
            borderRadius="10px"
            maxW="180px"
            value={filters.organizerName}
            onChange={(e) => handleFilterChange('organizerName', e.target.value)}
            fontWeight="500"
            fontSize="sm"
          >
            <option value="">All Organizers</option>
            {organizers.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>

          <Select
            size="sm"
            borderRadius="10px"
            maxW="200px"
            value={filters.paymentMethod}
            onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            fontWeight="500"
            fontSize="sm"
          >
            <option value="">All Payments Method</option>
            {PAYMENT_METHOD_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </Flex>
      </Box>

      {/* Table */}
      <Box mx={{ base: 2, md: 4 }} bg="white" borderRadius="xl"
        boxShadow="0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)"
        overflow="hidden"
      >
        {/* Desktop table */}
        <Box display={{ base: 'none', md: 'block' }}>
          <TableContainer>
            <Table variant="simple" size="md">
              <Thead bg="gray.200">
                <Tr>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Organizer</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Campaign</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Amount</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Status</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Method</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Date</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Tr key={i} bg={(i + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <Td key={j}><Skeleton h="16px" borderRadius="md" /></Td>
                      ))}
                    </Tr>
                  ))
                ) : records.map((r, i) => (
                  <Tr key={r.invoiceUniqueId} bg={(i + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                    <Td>
                      <Text fontSize="sm" color="gray.700">{r.organizerName}</Text>
                    </Td>
                    <Td>
                      <Text fontWeight="semibold" fontSize="sm" color="gray.800">{r.campaignName}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="gray.800" fontWeight="bold">${r.amount.toLocaleString()}</Text>
                    </Td>
                    <Td><StatusBadge label={r.paymentStatus} variant="status" /></Td>
                    <Td>
                      <Text fontSize="sm" color="gray.700">{formatPaymentMethod(r.paymentMethod)}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="gray.700">{formatDate(r.donationDateUtc)}</Text>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        {/* Mobile card list */}
        <Box display={{ base: 'block', md: 'none' }}>
          {loading ? (
            <VStack spacing={0} divider={<Box h="1px" bg="gray.100" w="full" />}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Box key={i} px={4} py={4} w="full">
                  <Skeleton h="16px" mb={2} borderRadius="md" />
                  <Skeleton h="12px" w="60%" borderRadius="md" />
                </Box>
              ))}
            </VStack>
          ) : records.length > 0 ? (
            <VStack spacing={0} divider={<Box h="1px" bg="gray.100" w="full" />}>
              {records.map((r) => (
                <Box key={r.invoiceUniqueId} px={4} py={4} w="full">
                  <Text fontWeight="semibold" fontSize="sm" color="gray.800" mb={1.5}>
                    {r.campaignName}
                  </Text>
                  <Flex gap={2} mb={2} flexWrap="wrap">
                    <StatusBadge label={r.paymentStatus} variant="status" />
                    <Text fontSize="sm" color="gray.800" fontWeight="bold">${r.amount.toLocaleString()}</Text>
                  </Flex>
                  <Flex gap={4} flexWrap="wrap">
                    <Box>
                      <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Organizer</Text>
                      <Text fontSize="xs" color="gray.700" fontWeight="medium">{r.organizerName}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Method</Text>
                      <Text fontSize="xs" color="gray.700" fontWeight="medium">{formatPaymentMethod(r.paymentMethod)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Date</Text>
                      <Text fontSize="xs" color="gray.700" fontWeight="medium">{formatDate(r.donationDateUtc)}</Text>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </VStack>
          ) : null}
        </Box>

        {!loading && records.length === 0 && (
          <Flex direction="column" align="center" justify="center" py={16} gap={3}>
            <Flex w="56px" h="56px" borderRadius="xl" bg="blue.50"
              border="1px solid" borderColor="blue.100" align="center" justify="center"
            >
              <Icon as={MdVolunteerActivism} boxSize={7} color="blue.300" />
            </Flex>
            <Text fontWeight="semibold" color="gray.600" fontSize="sm">No donations found</Text>
            <Text color="gray.400" fontSize="xs">Your donation history will appear here.</Text>
          </Flex>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center" px={4} py={3} borderTopWidth="1px" borderColor="gray.100">
            <Text color="gray.500" fontSize="sm">
              Page {currentPage} of {totalPages} · {totalRecords} total
            </Text>
            <Flex gap="6px">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Box
                  key={p}
                  w="30px" h="30px"
                  borderRadius="8px"
                  display="flex" alignItems="center" justifyContent="center"
                  cursor="pointer"
                  bg={p === currentPage ? 'brand.500' : 'transparent'}
                  color={p === currentPage ? 'white' : 'gray.500'}
                  fontWeight="600"
                  fontSize="sm"
                  onClick={() => setCurrentPage(p)}
                  _hover={{ bg: p === currentPage ? 'brand.500' : 'gray.100' }}
                >
                  {p}
                </Box>
              ))}
            </Flex>
          </Flex>
        )}
      </Box>
    </Box>
  );
}

export default MyDonationsPage;
