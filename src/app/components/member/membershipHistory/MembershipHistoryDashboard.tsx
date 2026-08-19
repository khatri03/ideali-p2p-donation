import { useEffect, useState } from 'react';
import {
  Box, Flex, Icon, Input, InputGroup, InputLeftElement,
  Skeleton, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VStack,
} from '@chakra-ui/react';
import { MdCardMembership, MdSearch } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import MembershipHeroHeader from 'app/components/organizer/membership/common/MembershipHeroHeader';
import StatusBadge from 'app/components/common/StatusBadge';
import membershipHistoryService, { MembershipHistoryItem } from '../services/membershipHistoryService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(utc: string) {
  return new Date(utc).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function InvoiceBadge({
  invoiceNo,
  onClick,
}: {
  invoiceNo: string;
  onClick?: () => void;
}) {
  return (
    <StatusBadge
      label={invoiceNo}
      variant="tag"
      colorScheme="blue"
      as="button"
      type="button"
      onClick={onClick}
      cursor={onClick ? 'pointer' : 'default'}
      _hover={onClick ? { bg: 'blue.100', borderColor: 'blue.300' } : undefined}
    />
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <Flex direction="column" align="center" justify="center" py={16} gap={3}>
      <Flex w="56px" h="56px" borderRadius="xl" bg="blue.50"
        border="1px solid" borderColor="blue.100" align="center" justify="center"
      >
        <Icon as={MdCardMembership} boxSize={7} color="blue.300" />
      </Flex>
      <Text fontWeight="semibold" color="gray.600" fontSize="sm">No membership records found</Text>
      <Text color="gray.400" fontSize="xs">Your membership history will appear here.</Text>
    </Flex>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MembershipHistoryDashboard() {
  const navigate = useNavigate();
  const [items,   setItems]   = useState<MembershipHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const userUniqueId = localStorage.getItem('memberUniqueId') ?? '';

  useEffect(() => {
    if (!userUniqueId) { setLoading(false); return; }
    membershipHistoryService.getMembershipHistory()
      .then(setItems)
      .finally(() => setLoading(false));
  }, [userUniqueId]);

  const filtered = items.filter((i) =>
    i.membershipName.toLowerCase().includes(search.toLowerCase()) ||
    i.invoiceNo.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box minH="100vh" bg="gray.50" pt={16} pb={8}>

      {/* Hero header */}
      <MembershipHeroHeader
        eyebrow="Membership"
        title="My Memberships"
        description="Track your active and past memberships, renewal dates, and invoices in one place."
      />

      {/* Search + list card */}
      <Box mx={{ base: 2, md: 4 }} mt={4} bg="white" borderRadius="xl"
        boxShadow="0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)"
        overflow="hidden"
      >
        {/* Search bar */}
        <Flex px={4} py={3} align="center" borderBottomWidth="1px" borderColor="gray.100">
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <Icon as={MdSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search memberships or invoices..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              borderRadius="lg" bg="gray.50" borderColor="gray.200"
              _focus={{ borderColor: 'blue.400', bg: 'white' }}
            />
          </InputGroup>
        </Flex>

        {/* Desktop table */}
        <Box display={{ base: 'none', md: 'block' }}>
          <TableContainer>
            <Table variant="simple" size="md">
              <Thead bg="gray.200">
                <Tr>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Membership</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Status</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Start Date</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Expiry Date</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Invoice</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Tr key={i} bg={(i + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <Td key={j}><Skeleton h="16px" borderRadius="md" /></Td>
                      ))}
                    </Tr>
                  ))
                ) : filtered.map((item, i) => (
                  <Tr key={item.uniqueId} bg={(i + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                    <Td>
                      <Text fontWeight="semibold" fontSize="sm" color="gray.800">
                        {item.membershipName}
                      </Text>
                    </Td>
                    <Td><StatusBadge label={item.membershipStatus} variant="status" /></Td>
                    <Td>
                      <Text fontSize="sm" color="gray.700">{formatDate(item.membershipStartUtc)}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="gray.700">{formatDate(item.membershipExpiryUtc)}</Text>
                    </Td>
                    <Td>
                      <InvoiceBadge
                        invoiceNo={item.invoiceNo}
                        onClick={() =>
                          item.invoiceUniqueId &&
                          navigate(
                            `/member/membership-history/invoice-detail/${encodeURIComponent(item.invoiceUniqueId)}`,
                          )
                        }
                      />
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
          ) : filtered.length > 0 ? (
            <VStack spacing={0} divider={<Box h="1px" bg="gray.100" w="full" />}>
              {filtered.map((item) => (
                <Box key={item.uniqueId} px={4} py={4} w="full">
                  <Text fontWeight="semibold" fontSize="sm" color="gray.800" mb={1.5}>
                    {item.membershipName}
                  </Text>
                  <Flex gap={2} mb={2} flexWrap="wrap">
                    <StatusBadge label={item.membershipStatus} variant="status" />
                    <InvoiceBadge
                      invoiceNo={item.invoiceNo}
                      onClick={() =>
                        item.invoiceUniqueId &&
                        navigate(
                          `/member/membership-history/invoice-detail/${encodeURIComponent(item.invoiceUniqueId)}`,
                        )
                      }
                    />
                  </Flex>
                  <Flex gap={4} flexWrap="wrap">
                    <Box>
                      <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Start</Text>
                      <Text fontSize="xs" color="gray.700" fontWeight="medium">{formatDate(item.membershipStartUtc)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Expiry</Text>
                      <Text fontSize="xs" color="gray.700" fontWeight="medium">{formatDate(item.membershipExpiryUtc)}</Text>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </VStack>
          ) : null}
        </Box>

        {!loading && filtered.length === 0 && <EmptyState />}
      </Box>
    </Box>
  );
}
