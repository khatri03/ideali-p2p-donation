import { Box, Stack, Text } from '@chakra-ui/react';
import GoalProgressBar from '../page/GoalProgressBar';
import DonateButton from '../page/DonateButton';
import { formatMoney, goalPercentage } from '../page/money';
import { raisedSummary } from '../page/pageCopy';
import {
  CAMPAIGN_CLOSED_NOTE,
  DONATE_CTA,
  DONATE_REASSURANCE,
  GOAL_PERCENT_VISIBLE_FROM,
  RAISED_SO_FAR,
  teamProgressSummary,
} from './teamCopy';

interface TeamProgressPanelProps {
  organizerName: string;
  raisedAmount: number;
  teamGoal: number | null;
  donorCount: number;
  memberCount: number;
  currencySymbol: string;
  isCampaignOpen: boolean;
  onDonate: () => void;
}

/**
 * What the team has raised together, and the one action the page exists for. The figure is the sum the
 * server derived from the member pages, shown and never recalculated here.
 */
export const TeamProgressPanel = ({
  organizerName,
  raisedAmount,
  teamGoal,
  donorCount,
  memberCount,
  currencySymbol,
  isCampaignOpen,
  onDonate,
}: TeamProgressPanelProps) => {
  const percentage = goalPercentage(raisedAmount, teamGoal);

  return (
    <Box
      bg="white"
      _dark={{ bg: 'navy.700' }}
      borderRadius="16px"
      boxShadow="sm"
      p={{ base: 4, md: 6 }}
      position={{ lg: 'sticky' }}
      top={{ lg: 6 }}
    >
      <Stack gap={4}>
        <Stack gap={1}>
          {teamGoal === null && (
            <Text
              fontSize="xs"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="wide"
              color="gray.600"
              _dark={{ color: 'gray.400' }}
            >
              {RAISED_SO_FAR}
            </Text>
          )}

          <Text
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="700"
            color="navy.700"
            _dark={{ color: 'white' }}
            lineHeight="1.2"
          >
            {raisedSummary(
              formatMoney(raisedAmount, currencySymbol),
              teamGoal ? formatMoney(teamGoal, currencySymbol) : null,
            )}
          </Text>

          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
            {teamProgressSummary(donorCount, memberCount)}
          </Text>
        </Stack>

        {percentage !== null && (
          <Stack gap={1}>
            <GoalProgressBar
              percentage={percentage}
              label={`${percentage}% of the team goal raised`}
              colorScheme="purple"
            />
            {percentage >= GOAL_PERCENT_VISIBLE_FROM && (
              <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
                {`${percentage}% there`}
              </Text>
            )}
          </Stack>
        )}

        {isCampaignOpen ? (
          <>
            <DonateButton
              label={DONATE_CTA}
              onClick={onDonate}
              isDisabled={memberCount === 0}
            />

            <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }} textAlign="center">
              {DONATE_REASSURANCE(organizerName)}
            </Text>
          </>
        ) : (
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }} textAlign="center">
            {CAMPAIGN_CLOSED_NOTE}
          </Text>
        )}
      </Stack>
    </Box>
  );
};

export default TeamProgressPanel;
