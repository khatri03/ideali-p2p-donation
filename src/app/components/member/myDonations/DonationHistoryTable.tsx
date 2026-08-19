import {
  Avatar, Badge, Box, Flex, Icon, Input, InputGroup, InputLeftElement,
  Table, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue,
} from '@chakra-ui/react';
import { useState } from 'react';
import { MdSearch } from 'react-icons/md';
import { DonorDonationRecord } from 'app/interface/memberInter/donorDonationDto';
import Loader from 'app/components/common/Loader';
import DownloadReceiptButton from './DownloadReceiptButton';

interface DonationHistoryTableProps {
  donations: DonorDonationRecord[];
  loading: boolean;
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (term: string) => void;
  onRowClick: (invoiceId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  Completed: 'green', Pending: 'yellow', Failed: 'red', Refunded: 'purple',
};

function DonationHistoryTable({ donations, loading, totalRecords, currentPage, pageSize, onPageChange, onSearch, onRowClick }: DonationHistoryTableProps) {
  const [searchInput, setSearchInput] = useState('');
  const cardBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('#1B2559', 'white');
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');
  const headerBg = useColorModeValue('gray.50', 'navy.700');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <Box bg={cardBg} borderRadius="20px" p="20px">
      <Flex justify="space-between" align="center" mb="16px" wrap="wrap" gap="12px">
        <Text color={textColor} fontWeight="700" fontSize="lg">Donation History</Text>
        <InputGroup maxW="240px" size="sm">
          <InputLeftElement pointerEvents="none"><Icon as={MdSearch} color={subColor} /></InputLeftElement>
          <Input placeholder="Search campaigns..." borderRadius="10px" value={searchInput} onChange={(e) => { setSearchInput(e.target.value); onSearch(e.target.value); }} />
        </InputGroup>
      </Flex>

      {loading ? (
        <Loader message="Loading donation history…" subtitle="Please wait while we fetch your donation records" />
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr bg={headerBg}>
                <Th color={subColor} borderColor={borderColor}>Campaign</Th>
                <Th color={subColor} borderColor={borderColor}>Date</Th>
                <Th color={subColor} borderColor={borderColor}>Amount</Th>
                <Th color={subColor} borderColor={borderColor}>Frequency</Th>
                <Th color={subColor} borderColor={borderColor}>Status</Th>
                <Th color={subColor} borderColor={borderColor}></Th>
              </Tr>
            </Thead>
            <Tbody>
              {donations.length === 0 ? (
                <Tr><Td colSpan={6} textAlign="center" py="40px"><Text color={subColor} fontSize="sm">No donations found.</Text></Td></Tr>
              ) : (
                donations.map((d) => (
                  <Tr key={d.invoiceId} _hover={{ bg: headerBg, cursor: 'pointer' }} onClick={() => onRowClick(d.invoiceId)}>
                    <Td borderColor={borderColor}>
                      <Flex align="center" gap="10px">
                        <Avatar src={d.campaignImageUrl ?? undefined} name={d.campaignName} size="xs" borderRadius="6px" />
                        <Box>
                          <Text color={textColor} fontWeight="600" fontSize="sm">{d.campaignName}</Text>
                          <Text color={subColor} fontSize="xs">{d.organizerName}</Text>
                        </Box>
                      </Flex>
                    </Td>
                    <Td borderColor={borderColor}><Text color={textColor} fontSize="sm">{new Date(d.donationDateUtc).toLocaleDateString()}</Text></Td>
                    <Td borderColor={borderColor}>
                      <Text color="green.500" fontWeight="700" fontSize="sm">${d.amount.toLocaleString()}</Text>
                      {d.tipAmount > 0 && <Text color={subColor} fontSize="xs">+${d.tipAmount} tip</Text>}
                    </Td>
                    <Td borderColor={borderColor}><Text color={textColor} fontSize="sm">{d.frequency}</Text></Td>
                    <Td borderColor={borderColor}><Badge colorScheme={STATUS_COLORS[d.status] ?? 'gray'} borderRadius="6px" px="6px">{d.status}</Badge></Td>
                    <Td borderColor={borderColor} onClick={(e) => e.stopPropagation()}><DownloadReceiptButton receiptUrl={d.receiptUrl} invoiceNo={d.invoiceNo} /></Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      )}

      {totalPages > 1 && (
        <Flex justify="space-between" align="center" mt="16px">
          <Text color={subColor} fontSize="sm">Page {currentPage} of {totalPages} · {totalRecords} total</Text>
          <Flex gap="8px">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Box key={p} w="32px" h="32px" borderRadius="8px" display="flex" alignItems="center" justifyContent="center" cursor="pointer" bg={p === currentPage ? 'brand.500' : 'transparent'} color={p === currentPage ? 'white' : subColor} fontWeight="600" fontSize="sm" onClick={() => onPageChange(p)} _hover={{ bg: p === currentPage ? 'brand.500' : 'gray.100' }}>{p}</Box>
            ))}
          </Flex>
        </Flex>
      )}
    </Box>
  );
}

export default DonationHistoryTable;
