import {
  Box,
  Flex,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { LeaderboardGift } from 'app/interface/donationInter/peerToPeerLeaderboardDto';
import { formatMoney } from '../page/money';
import {
  AMOUNT_COLUMN,
  DONOR_COLUMN,
  GIVEN_COLUMN,
  RANK_COLUMN,
  STRAIGHT_TO_CAMPAIGN,
  THROUGH_COLUMN,
} from './leaderboardCopy';
import RankBadge from './RankBadge';

interface TopGiftsBoardProps {
  gifts: LeaderboardGift[];
  currencySymbol: string;
}

const formatDate = (isoUtc: string) => {
  const when = new Date(isoUtc);

  return Number.isNaN(when.getTime()) ? '' : when.toLocaleDateString();
};

/**
 * The largest gifts, named as the donor agreed to be named and no further. Donors who asked to stay
 * anonymous never reach this component - they are dropped by the API rather than listed as
 * "Anonymous", because a place next to an amount is itself a fact about them.
 */
export const TopGiftsBoard = ({ gifts, currencySymbol }: TopGiftsBoardProps) => (
  <Box>
    <Stack gap={3} display={{ base: 'flex', lg: 'none' }}>
      {gifts.map((gift) => (
        <Stack
          key={`${gift.rank}-${gift.givenOnUtc}-${gift.amount}`}
          gap={2}
          p={4}
          borderWidth="1px"
          borderColor="secondaryGray.200"
          borderRadius="16px"
          bg="white"
          _dark={{ bg: 'navy.700', borderColor: 'whiteAlpha.300' }}
        >
          <Flex gap={3} align="center">
            <RankBadge rank={gift.rank} />
            <Text fontWeight="700" minW={0}>
              {gift.donorName}
            </Text>
          </Flex>
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
            {AMOUNT_COLUMN}: {formatMoney(gift.amount, currencySymbol)} · {GIVEN_COLUMN}:{' '}
            {formatDate(gift.givenOnUtc)}
          </Text>
          <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
            {THROUGH_COLUMN}: {gift.fundraiserDisplayName ?? STRAIGHT_TO_CAMPAIGN}
          </Text>
        </Stack>
      ))}
    </Stack>

    <TableContainer display={{ base: 'none', lg: 'block' }} overflowX="auto" maxW="100%">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>{RANK_COLUMN}</Th>
            <Th>{DONOR_COLUMN}</Th>
            <Th isNumeric>{AMOUNT_COLUMN}</Th>
            <Th>{THROUGH_COLUMN}</Th>
            <Th>{GIVEN_COLUMN}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {gifts.map((gift) => (
            <Tr key={`${gift.rank}-${gift.givenOnUtc}-${gift.amount}`}>
              <Td>
                <RankBadge rank={gift.rank} />
              </Td>
              <Td fontWeight="600">{gift.donorName}</Td>
              <Td isNumeric>{formatMoney(gift.amount, currencySymbol)}</Td>
              <Td>{gift.fundraiserDisplayName ?? STRAIGHT_TO_CAMPAIGN}</Td>
              <Td>{formatDate(gift.givenOnUtc)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);

export default TopGiftsBoard;
