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
import { ModeratedTeam } from 'app/interface/donationInter/peerToPeerModerationDto';
import { formatMoney } from '../page/money';
import {
  CAPTAIN_COLUMN,
  GOAL_COLUMN,
  MEMBERS_COLUMN,
  NAME_COLUMN,
  NO_GOAL,
  RAISED_COLUMN,
  REVIEW_LABEL,
  STARTED_COLUMN,
  VISIBILITY_COLUMN,
} from './moderationCopy';
import { moderatedTeamPath } from './moderationPaths';
import { TeamVisibilityBadge } from './ModerationStates';

interface TeamResultsProps {
  campaignUniqueId: string;
  currencySymbol: string;
  teams: ModeratedTeam[];
}

const formatDate = (isoUtc: string) => {
  const when = new Date(isoUtc);

  return Number.isNaN(when.getTime()) ? '' : when.toLocaleDateString();
};

const ReviewLink = ({
  campaignUniqueId,
  team,
  isFullWidth = false,
}: {
  campaignUniqueId: string;
  team: ModeratedTeam;
  isFullWidth?: boolean;
}) => (
  <Button
    as={RouterLink}
    to={moderatedTeamPath(campaignUniqueId, team.uniqueId)}
    size="sm"
    variant="outline"
    minH="44px"
    w={isFullWidth ? 'full' : 'auto'}
    aria-label={`${REVIEW_LABEL} ${team.name}`}
    sx={{ cursor: 'pointer' }}
  >
    {REVIEW_LABEL}
  </Button>
);

export const TeamResults = ({ campaignUniqueId, currencySymbol, teams }: TeamResultsProps) => (
  <Box>
    <Stack gap={3} display={{ base: 'flex', lg: 'none' }}>
      {teams.map((team) => (
        <Stack
          key={team.uniqueId}
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
              {team.name}
            </Text>
            <TeamVisibilityBadge isHidden={team.isHidden} />
          </Flex>
          <Text fontSize="sm" color="secondaryGray.600">
            {CAPTAIN_COLUMN}: {team.captainName} · {MEMBERS_COLUMN}: {team.memberCount}
          </Text>
          <Text fontSize="sm" color="secondaryGray.600">
            {RAISED_COLUMN}: {formatMoney(team.raisedAmount, currencySymbol)} · {GOAL_COLUMN}:{' '}
            {team.teamGoal ? formatMoney(team.teamGoal, currencySymbol) : NO_GOAL}
          </Text>
          <Text fontSize="xs" color="secondaryGray.600">
            {STARTED_COLUMN}: {formatDate(team.startedOnUtc)}
          </Text>
          <ReviewLink campaignUniqueId={campaignUniqueId} team={team} isFullWidth />
        </Stack>
      ))}
    </Stack>

    <TableContainer display={{ base: 'none', lg: 'block' }} overflowX="auto" maxW="100%">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>{NAME_COLUMN}</Th>
            <Th>{CAPTAIN_COLUMN}</Th>
            <Th isNumeric>{MEMBERS_COLUMN}</Th>
            <Th isNumeric>{RAISED_COLUMN}</Th>
            <Th isNumeric>{GOAL_COLUMN}</Th>
            <Th>{VISIBILITY_COLUMN}</Th>
            <Th>{STARTED_COLUMN}</Th>
            <Th aria-label={REVIEW_LABEL} />
          </Tr>
        </Thead>
        <Tbody>
          {teams.map((team) => (
            <Tr key={team.uniqueId}>
              <Td fontWeight="600">{team.name}</Td>
              <Td>{team.captainName}</Td>
              <Td isNumeric>{team.memberCount}</Td>
              <Td isNumeric>{formatMoney(team.raisedAmount, currencySymbol)}</Td>
              <Td isNumeric>
                {team.teamGoal ? formatMoney(team.teamGoal, currencySymbol) : NO_GOAL}
              </Td>
              <Td>
                <TeamVisibilityBadge isHidden={team.isHidden} />
              </Td>
              <Td>{formatDate(team.startedOnUtc)}</Td>
              <Td textAlign="right">
                <ReviewLink campaignUniqueId={campaignUniqueId} team={team} />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);

export default TeamResults;
