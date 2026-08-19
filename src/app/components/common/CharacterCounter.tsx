import React from 'react';
import { Text, Box } from '@chakra-ui/react';

interface CharacterCounterProps {
  currentLength: number;
  maxLength: number;
  warningThreshold?: number; // Percentage at which to show warning (default: 90%)
}


const CharacterCounter: React.FC<CharacterCounterProps> = ({
  currentLength,
  maxLength,
  warningThreshold = 90,
}) => {
  const percentage = (currentLength / maxLength) * 100;
  const isWarning = percentage >= warningThreshold;
  const isError = currentLength > maxLength;

  let color = 'gray.500';
  if (isError) {
    color = 'red.500';
  } else if (isWarning) {
    color = 'orange.500';
  }

  return (
    <Box mt={1}>
      <Text fontSize="xs" color={color} fontWeight="medium">
        {currentLength.toLocaleString()} / {maxLength.toLocaleString()} characters
        {isError && ' (Limit exceeded!)'}
      </Text>
    </Box>
  );
};

export default CharacterCounter;
