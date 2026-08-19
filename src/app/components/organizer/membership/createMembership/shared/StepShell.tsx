import React from 'react';
import { Box, Text } from '@chakra-ui/react';

interface StepShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function StepShell({ title, description, children }: StepShellProps) {
  return (
    <Box
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)"
      overflow="hidden"
    >
      {/* Header */}
      <Box px={6} pt={6} pb={5}>
        <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>
          {title}
        </Text>
        {description && (
          <Text fontSize="sm" color="gray.500">
            {description}
          </Text>
        )}
      </Box>

      {/* Body — StepNavButtons at the bottom renders its own gray footer flush to card edge */}
      <Box px={6} pb={0}>
        {children}
      </Box>
    </Box>
  );
}
