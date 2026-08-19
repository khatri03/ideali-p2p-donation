import React from 'react';
import { Box, Button, Flex, Icon } from '@chakra-ui/react';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';

interface Props {
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  isLoading?: boolean;
  color?: string;
  rightContent?: React.ReactNode;
  rightContentProps?: React.ComponentProps<typeof Box>;
}

export default function RegistrationFooter({
  onBack,
  onContinue,
  continueLabel = 'Continue',
  isLoading = false,
  color = '#044bd9',
  rightContent,
  rightContentProps,
}: Props) {
  return (
    <Box
      bg="white"
      borderTop="1px solid"
      borderColor="gray.200"
      px={{ base: 4, md: 8 }}
      py={4}
      flexShrink={0}
      position="sticky"
      bottom={0}
      zIndex={10}
      boxShadow="0 -2px 8px rgba(0,0,0,0.06)"
    >
      <Flex justify="space-between" align="center" w="full" gap={3}>
        {onBack ? (
          <Button
            variant="ghost"
            size="sm"
            color="gray.600"
            borderRadius="lg"
            leftIcon={<Icon as={MdArrowBack} />}
            onClick={onBack}
            _hover={{ bg: 'gray.100' }}
          >
            Back
          </Button>
        ) : (
          <Box />
        )}
        {rightContent ? (
          <Box
            ml="auto"
            flex={1}
            display="flex"
            justifyContent="flex-end"
            {...rightContentProps}
          >
            {rightContent}
          </Box>
        ) : (
          <Button
            size="sm"
            color="white"
            borderRadius="lg"
            px={6}
            rightIcon={<Icon as={MdArrowForward} />}
            isLoading={isLoading}
            onClick={onContinue}
            style={{ background: color }}
            _hover={{ opacity: 0.88 }}
            _active={{ opacity: 0.75 }}
          >
            {continueLabel}
          </Button>
        )}
      </Flex>
    </Box>
  );
}
