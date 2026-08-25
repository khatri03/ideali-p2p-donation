import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
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
import { formatMoney } from '../page/money';
import {
  GOAL_COLUMN,
  NAME_COLUMN,
  NO_GOAL,
  RAISED_COLUMN,
  RANK_COLUMN,
} from './leaderboardCopy';
import RankBadge from './RankBadge';

/**
 * One place in the standings, whether it is a person or a team. Both boards rank the same four things
 * - a place, a name, an amount and a goal - so they are rendered by one component: two copies would
 * drift the moment either gained a column.
 */
export interface Standing {
  key: string;
  rank: number;
  name: string;
  raisedAmount: number;
  goal: number | null;
  count: number;
  /** What the count is of, in the reader's words: donors behind a page, members behind a team. */
  countLabel: string;
  /** A second fact about the row, shown when there is one. The team a page counts towards. */
  detail: string | null;
  detailLabel: string;
  href: string;
  linkLabel: string;
}

interface StandingsBoardProps {
  standings: Standing[];
  currencySymbol: string;
  /** Column heading for the count, which differs between the two boards. */
  countColumn: string;
  /** Omitted by a board whose rows carry no second fact, so no empty column is drawn for one. */
  detailColumn?: string;
}

const OpenLink = ({ standing, isFullWidth = false }: { standing: Standing; isFullWidth?: boolean }) => (
  <Button
    as={RouterLink}
    to={standing.href}
    size="sm"
    variant="outline"
    minH="44px"
    w={isFullWidth ? 'full' : 'auto'}
    aria-label={`${standing.linkLabel}: ${standing.name}`}
    sx={{ cursor: 'pointer' }}
  >
    {standing.linkLabel}
  </Button>
);

export const StandingsBoard = ({
  standings,
  currencySymbol,
  countColumn,
  detailColumn,
}: StandingsBoardProps) => (
  <Box>
    <Stack gap={3} display={{ base: 'flex', lg: 'none' }}>
      {standings.map((standing) => (
        <Stack
          key={standing.key}
          gap={2}
          p={4}
          borderWidth="1px"
          borderColor="secondaryGray.200"
          borderRadius="16px"
          bg="white"
          _dark={{ bg: 'navy.700', borderColor: 'whiteAlpha.300' }}
        >
          <Flex gap={3} align="center">
            <RankBadge rank={standing.rank} />
            <Text fontWeight="700" minW={0}>
              {standing.name}
            </Text>
          </Flex>
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
            {RAISED_COLUMN}: {formatMoney(standing.raisedAmount, currencySymbol)} ·{' '}
            {standing.countLabel}: {standing.count}
          </Text>
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
            {GOAL_COLUMN}: {standing.goal ? formatMoney(standing.goal, currencySymbol) : NO_GOAL}
          </Text>
          {standing.detail && (
            <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
              {standing.detailLabel}: {standing.detail}
            </Text>
          )}
          <OpenLink standing={standing} isFullWidth />
        </Stack>
      ))}
    </Stack>

    <TableContainer display={{ base: 'none', lg: 'block' }} overflowX="auto" maxW="100%">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>{RANK_COLUMN}</Th>
            <Th>{NAME_COLUMN}</Th>
            <Th isNumeric>{RAISED_COLUMN}</Th>
            <Th isNumeric>{GOAL_COLUMN}</Th>
            <Th isNumeric>{countColumn}</Th>
            {detailColumn && <Th>{detailColumn}</Th>}
            <Th aria-label={NAME_COLUMN} />
          </Tr>
        </Thead>
        <Tbody>
          {standings.map((standing) => (
            <Tr key={standing.key}>
              <Td>
                <RankBadge rank={standing.rank} />
              </Td>
              <Td fontWeight="600">{standing.name}</Td>
              <Td isNumeric>{formatMoney(standing.raisedAmount, currencySymbol)}</Td>
              <Td isNumeric>
                {standing.goal ? formatMoney(standing.goal, currencySymbol) : NO_GOAL}
              </Td>
              <Td isNumeric>{standing.count}</Td>
              {detailColumn && <Td>{standing.detail ?? '—'}</Td>}
              <Td textAlign="right">
                <OpenLink standing={standing} />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);

export default StandingsBoard;
