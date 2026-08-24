import { Box, Button, Progress, Stack, Text } from '@chakra-ui/react';
import { formatMoney, goalPercentage } from '../page/money';
import { raisedSummary } from '../page/pageCopy';
import {
  CAMPAIGN_CLOSED_NOTE,
  DONATE_CTA,
  DONATE_REASSURANCE,
  membersCount,
  teamDonorSummary,
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
            {`${teamDonorSummary(donorCount)} · ${membersCount(memberCount)}`}
          </Text>
        </Stack>

        {percentage !== null && (
          <Stack gap={1}>
            <Progress
              value={percentage}
              size="sm"
              borderRadius="full"
              colorScheme="purple"
              aria-label={`${percentage}% of the team goal raised`}
            />
            <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
              {`${percentage}% there`}
            </Text>
          </Stack>
        )}

        {isCampaignOpen ? (
          <>
            <Button
              onClick={onDonate}
              colorScheme="purple"
              size="lg"
              w="full"
              minH="48px"
              borderRadius="12px"
              cursor="pointer"
              isDisabled={memberCount === 0}
            >
              {DONATE_CTA}
            </Button>

            <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }} textAlign="center">
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
