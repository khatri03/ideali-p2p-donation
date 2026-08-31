import { Badge, Box, Button, Heading, Stack, Text } from '@chakra-ui/react';
import GoalProgressBar from '../page/GoalProgressBar';
import { CampaignTeamSummary } from 'app/interface/donationInter/campaignTeamDto';
import { formatMoney, goalPercentage } from '../page/money';
import {
  CAPTAIN_BADGE,
  JOIN_LABEL,
  VIEW_TEAM,
  membersCount,
  raisedByMember,
  viewTeamLabel,
} from './teamCopy';

interface TeamCardProps {
  team: CampaignTeamSummary;
  currencySymbol: string;
  /** Absent when the caller cannot join: teams are off, they are not fundraising, or they are in one. */
  onJoin?: () => void;
  onOpen: () => void;
}

/**
 * One team as the browse screen lists it. Presentational: it renders what it is handed and reports the
 * two things a person can do with a team, and decides neither of them.
 */
export const TeamCard = ({ team, currencySymbol, onJoin, onOpen }: TeamCardProps) => {
  const percentage = goalPercentage(team.raisedAmount, team.teamGoal);

  return (
    <Box
      bg="white"
      _dark={{ bg: 'navy.700' }}
      borderRadius="16px"
      boxShadow="sm"
      p={{ base: 4, md: 6 }}
      display="flex"
      flexDirection="column"
      h="100%"
    >
      <Stack gap={3} flex="1" minW={0}>
        <Stack gap={1} minW={0}>
          <Heading
            as="h3"
            fontSize={{ base: 'md', md: 'lg' }}
            color="navy.700"
            _dark={{ color: 'white' }}
            noOfLines={2}
          >
            {team.name}
          </Heading>

          <Stack direction="row" gap={2} flexWrap="wrap">
            <Badge colorScheme="purple" borderRadius="full" px={3} py={1} textTransform="none">
              {membersCount(team.memberCount)}
            </Badge>
            <Badge colorScheme="gray" borderRadius="full" px={3} py={1} textTransform="none">
              {`${CAPTAIN_BADGE}: ${team.captainDisplayName}`}
            </Badge>
          </Stack>
        </Stack>

        {team.story && (
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }} noOfLines={3}>
            {team.story}
          </Text>
        )}

        <Stack gap={1}>
          <Text
            fontSize={{ base: 'lg', md: 'xl' }}
            fontWeight="700"
            color="navy.700"
            _dark={{ color: 'white' }}
          >
            {raisedByMember(formatMoney(team.raisedAmount, currencySymbol))}
          </Text>

          {percentage !== null && (
            <Stack gap={1}>
              <GoalProgressBar
                percentage={percentage}
                label={`${percentage}% of the team goal raised`}
                colorScheme="purple"
              />
              <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
                {`${percentage}% of ${formatMoney(team.teamGoal, currencySymbol)}`}
              </Text>
            </Stack>
          )}
        </Stack>
      </Stack>

      <Stack direction={{ base: 'column', '2sm': 'row' }} gap={3} mt={5}>
        <Button
          onClick={onOpen}
          variant="outline"
          colorScheme="brand"
          minH="44px"
          borderRadius="12px"
          cursor="pointer"
          w={{ base: 'full', '2sm': 'auto' }}
          flex={{ '2sm': 1 }}
          aria-label={viewTeamLabel(team.name)}
        >
          {VIEW_TEAM}
        </Button>

        {onJoin && (
          <Button
            onClick={onJoin}
            colorScheme="brand"
            minH="44px"
            borderRadius="12px"
            cursor="pointer"
            w={{ base: 'full', '2sm': 'auto' }}
            flex={{ '2sm': 1 }}
          >
            {JOIN_LABEL}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default TeamCard;
