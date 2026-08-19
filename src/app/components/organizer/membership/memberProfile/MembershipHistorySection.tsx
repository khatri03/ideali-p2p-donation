import React from 'react';
import {
  Box, Flex, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VStack,
} from '@chakra-ui/react';
import {
  profileSectionCardStyles,
  profileSectionDescriptionStyles,
  profileSectionTitleStyles,
  profileEyebrowStyles,
} from './memberProfileStyles';

type Row = {
  membershipType: string;
  expiry: string;
  invoiceNo: string;
};

export default function MembershipHistorySection({ rows }: { rows: Row[] }) {
  return (
    <Box {...profileSectionCardStyles}>
      <Text {...profileSectionTitleStyles} mb={1}>
        Membership history
      </Text>
      <Text {...profileSectionDescriptionStyles} mb={4}>
        Most recent membership records are shown first.
      </Text>

      {rows.length === 0 ? (
        <Box border="1px dashed" borderColor="gray.200" borderRadius="lg" p={4}>
          <Text fontSize="sm" color="gray.500" textAlign="center">
            No membership history found.
          </Text>
        </Box>
      ) : (
        <>
          {/* Desktop table */}
          <Box display={{ base: 'none', md: 'block' }}>
            <TableContainer border="1px solid" borderColor="gray.200" borderRadius="lg">
              <Table size="sm" variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th {...profileEyebrowStyles}>Membership type</Th>
                    <Th {...profileEyebrowStyles}>Expiry</Th>
                    <Th {...profileEyebrowStyles}>Invoice number</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((row) => (
                    <Tr key={row.invoiceNo}>
                      <Td fontSize="sm" fontWeight="600">{row.membershipType}</Td>
                      <Td fontSize="sm" color="gray.600">{row.expiry}</Td>
                      <Td fontSize="sm" color="blue.600" fontWeight="600">{row.invoiceNo}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

          {/* Mobile card list */}
          <VStack display={{ base: 'flex', md: 'none' }} spacing={3}>
            {rows.map((row) => (
              <Box
                key={row.invoiceNo}
                w="full"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                p={3}
              >
                <Text fontSize="sm" fontWeight="700" color="gray.800" mb={2}>
                  {row.membershipType}
                </Text>
                <Flex justify="space-between" wrap="wrap" gap={2}>
                  <Box>
                    <Text {...profileEyebrowStyles} mb={0.5}>
                      Expiry
                    </Text>
                    <Text fontSize="xs" color="gray.600">{row.expiry}</Text>
                  </Box>
                  <Box>
                    <Text {...profileEyebrowStyles} mb={0.5}>
                      Invoice
                    </Text>
                    <Text fontSize="xs" color="blue.600" fontWeight="600">{row.invoiceNo}</Text>
                  </Box>
                </Flex>
              </Box>
            ))}
          </VStack>
        </>
      )}
    </Box>
  );
}
