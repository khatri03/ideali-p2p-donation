import { Box, Flex, Progress, Text, useColorModeValue } from '@chakra-ui/react';

interface CampaignProgressBarProps {
  amountRaised: number;
  goalAmount: number | null;
  progressPercent: number | null;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

function CampaignProgressBar({
  amountRaised,
  goalAmount,
  progressPercent,
  showLabel = true,
  size = 'sm',
}: CampaignProgressBarProps) {
  const labelColor = useColorModeValue('#A3AED0', '#A3AED0');
  const percent = progressPercent ?? (goalAmount ? Math.min((amountRaised / goalAmount) * 100, 100) : 0);
  const raised = `$${(amountRaised / 1000).toFixed(0)}k raised`;
  const pct = `${Math.round(percent)}%`;

  return (
    <Box>
      {showLabel && (
        <Flex justify="space-between" mb="4px">
          <Text fontSize="xs" color="green.500" fontWeight="600">
            {raised}
          </Text>
          <Text fontSize="xs" color={labelColor}>
            {pct}
          </Text>
        </Flex>
      )}
      <Progress
        value={percent}
        size={size}
        colorScheme="brand"
        borderRadius="full"
        bg={useColorModeValue('gray.100', 'whiteAlpha.100')}
      />
    </Box>
  );
}

export default CampaignProgressBar;
