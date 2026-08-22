import { Box, Button, Progress, Stack, Text } from '@chakra-ui/react';
import { formatMoney, goalPercentage } from './money';
import { DONATE_CTA, DONATE_REASSURANCE, donorSummary, raisedSummary } from './pageCopy';

interface FundraiserProgressPanelProps {
  displayName: string;
  organizerName: string;
  raisedAmount: number;
  goal: number | null;
  donorCount: number;
  currencySymbol: string;
  onDonate: () => void;
}

/**
 * The money, and the one action the page exists for. Kept in its own panel so it can sit beside the
 * story on a desktop and above it on a phone without either layout having to know about the other.
 */
export const FundraiserProgressPanel = ({
  displayName,
  organizerName,
  raisedAmount,
  goal,
  donorCount,
  currencySymbol,
  onDonate,
}: FundraiserProgressPanelProps) => {
  const percentage = goalPercentage(raisedAmount, goal);

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
              goal ? formatMoney(goal, currencySymbol) : null,
            )}
          </Text>

          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
            {donorSummary(donorCount)}
          </Text>
        </Stack>

        {percentage !== null && (
          <Stack gap={1}>
            <Progress
              value={percentage}
              size="sm"
              borderRadius="full"
              colorScheme="purple"
              aria-label={`${percentage}% of the goal raised`}
            />
            <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
              {`${percentage}% there`}
            </Text>
          </Stack>
        )}

        <Button
          onClick={onDonate}
          colorScheme="purple"
          size="lg"
          w="full"
          minH="48px"
          borderRadius="12px"
          cursor="pointer"
        >
          {DONATE_CTA(displayName)}
        </Button>

        <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }} textAlign="center">
          {DONATE_REASSURANCE(organizerName)}
        </Text>
      </Stack>
    </Box>
  );
};

export default FundraiserProgressPanel;
