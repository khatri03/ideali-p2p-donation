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
import { ModeratedFundraiser } from 'app/interface/donationInter/peerToPeerModerationDto';
import { formatMoney } from '../page/money';
import {
  DONORS_COLUMN,
  GOAL_COLUMN,
  NAME_COLUMN,
  NO_GOAL,
  NO_TEAM,
  RAISED_COLUMN,
  REVIEW_LABEL,
  STARTED_COLUMN,
  STATUS_COLUMN,
  TEAM_COLUMN,
} from './moderationCopy';
import { moderatedFundraiserPath } from './moderationPaths';
import { FundraiserStatusBadge } from './ModerationStates';

interface FundraiserResultsProps {
  campaignUniqueId: string;
  currencySymbol: string;
  fundraisers: ModeratedFundraiser[];
}

const formatDate = (isoUtc: string) => {
  const when = new Date(isoUtc);

  return Number.isNaN(when.getTime()) ? '' : when.toLocaleDateString();
};

const ReviewLink = ({
  campaignUniqueId,
  fundraiser,
  isFullWidth = false,
}: {
  campaignUniqueId: string;
  fundraiser: ModeratedFundraiser;
  isFullWidth?: boolean;
}) => (
  <Button
    as={RouterLink}
    to={moderatedFundraiserPath(campaignUniqueId, fundraiser.uniqueId)}
    size="sm"
    variant="outline"
    minH="44px"
    w={isFullWidth ? 'full' : 'auto'}
    aria-label={`${REVIEW_LABEL} ${fundraiser.displayName}`}
    sx={{ cursor: 'pointer' }}
  >
    {REVIEW_LABEL}
  </Button>
);

/**
 * The same rows twice: a table once there is room for eight columns, and a card list at the widths
 * where a table would either clip or force the page itself to scroll sideways.
 */
export const FundraiserResults = ({
  campaignUniqueId,
  currencySymbol,
  fundraisers,
}: FundraiserResultsProps) => (
  <Box>
    <Stack gap={3} display={{ base: 'flex', lg: 'none' }}>
      {fundraisers.map((fundraiser) => (
        <Stack
          key={fundraiser.uniqueId}
          gap={2}
          p={4}
          borderWidth="1px"
          borderColor="secondaryGray.200"
          borderRadius="16px"
          bg="white"
          _dark={{ bg: 'navy.700', borderColor: 'whiteAlpha.300' }}
        >
          <Flex justify="space-between" gap={3} align="flex-start">
            <Text fontWeight="700" minW={0}>
              {fundraiser.displayName}
            </Text>
            <FundraiserStatusBadge status={fundraiser.currentStatus} />
          </Flex>
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
            {RAISED_COLUMN}: {formatMoney(fundraiser.raisedAmount, currencySymbol)} ·{' '}
            {DONORS_COLUMN}: {fundraiser.donorCount}
          </Text>
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
            {GOAL_COLUMN}:{' '}
            {fundraiser.goal ? formatMoney(fundraiser.goal, currencySymbol) : NO_GOAL} ·{' '}
            {TEAM_COLUMN}: {fundraiser.teamName ?? NO_TEAM}
          </Text>
          <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
            {STARTED_COLUMN}: {formatDate(fundraiser.startedOnUtc)}
          </Text>
          <ReviewLink campaignUniqueId={campaignUniqueId} fundraiser={fundraiser} isFullWidth />
        </Stack>
      ))}
    </Stack>

    <TableContainer display={{ base: 'none', lg: 'block' }} overflowX="auto" maxW="100%">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>{NAME_COLUMN}</Th>
            <Th>{STATUS_COLUMN}</Th>
            <Th isNumeric>{RAISED_COLUMN}</Th>
            <Th isNumeric>{DONORS_COLUMN}</Th>
            <Th isNumeric>{GOAL_COLUMN}</Th>
            <Th>{TEAM_COLUMN}</Th>
            <Th>{STARTED_COLUMN}</Th>
            <Th aria-label={REVIEW_LABEL} />
          </Tr>
        </Thead>
        <Tbody>
          {fundraisers.map((fundraiser) => (
            <Tr key={fundraiser.uniqueId}>
              <Td fontWeight="600">{fundraiser.displayName}</Td>
              <Td>
                <FundraiserStatusBadge status={fundraiser.currentStatus} />
              </Td>
              <Td isNumeric>{formatMoney(fundraiser.raisedAmount, currencySymbol)}</Td>
              <Td isNumeric>{fundraiser.donorCount}</Td>
              <Td isNumeric>
                {fundraiser.goal ? formatMoney(fundraiser.goal, currencySymbol) : NO_GOAL}
              </Td>
              <Td>{fundraiser.teamName ?? NO_TEAM}</Td>
              <Td>{formatDate(fundraiser.startedOnUtc)}</Td>
              <Td textAlign="right">
                <ReviewLink campaignUniqueId={campaignUniqueId} fundraiser={fundraiser} />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);

export default FundraiserResults;
