import React from 'react';
import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { MdArrowBack, MdArrowForward, MdExitToApp } from 'react-icons/md';

interface StepNavButtonsProps {
  onNext: () => void | Promise<void>;
  onSaveAndExit?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  prevLabel?: string;
  skipLabel?: string;
  isSubmitting: boolean;
  isSavingAndExiting?: boolean;
  loadingText?: string;
  showSkip?: boolean;
  disableNext?: boolean;
}

export default function StepNavButtons({
  onNext,
  onSaveAndExit,
  onPrev,
  onSkip,
  nextLabel = 'Save & Next',
  prevLabel = 'Back One Step',
  skipLabel = 'Skip',
  isSubmitting,
  isSavingAndExiting = false,
  loadingText = 'Saving...',
  showSkip = false,
  disableNext = false,
}: StepNavButtonsProps) {
  return (
    <Box
      bg="gray.50"
      borderTop="1px solid"
      borderColor="gray.200"
      px={{ base: 3, md: 6 }}
      py={{ base: 2, md: 4 }}
    >
      <Flex justify="space-between" align="center">
        {/* Left — back */}
        {onPrev ? (
          <Button
            variant="outline"
            fontSize={14}
            size="sm"
            minW="auto"
            px={{ base: 2, md: '15px' }}
            borderRadius="lg"
            borderColor="gray.300"
            color="gray.700"
            onClick={onPrev}
            isDisabled={isSubmitting || isSavingAndExiting}
            leftIcon={<Icon as={MdArrowBack} color="inherit" />}
            _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
          >
            <Text display={{ base: 'none', md: 'block' }}>{prevLabel}</Text>
          </Button>
        ) : (
          <Box />
        )}

        {/* Right */}
        <Flex gap={{ base: 1, md: 2 }} align="center">
          {/* Skip */}
          {showSkip && onSkip && (
            <Button
              variant="outline"
              fontSize={14}
              size="sm"
              minW="auto"
              px={{ base: 2, md: 4 }}
              borderRadius="lg"
              borderColor="gray.300"
              color="gray.600"
              onClick={onSkip}
              isDisabled={isSubmitting || isSavingAndExiting}
              rightIcon={<Icon as={MdArrowForward} color="inherit" />}
              _hover={{ bg: 'gray.50' }}
            >
              <Text display={{ base: 'none', md: 'block' }}>{skipLabel}</Text>
            </Button>
          )}

          {/* Save & Exit */}
          {onSaveAndExit && (
            <Button
              variant="outline"
              fontSize={14}
              size="sm"
              minW="auto"
              px={{ base: 2, md: '15px' }}
              borderRadius="lg"
              borderColor="#044bd9"
              color="#044bd9"
              bg="white"
              onClick={onSaveAndExit}
              isLoading={isSavingAndExiting}
              loadingText="Saving..."
              isDisabled={isSubmitting || isSavingAndExiting}
              leftIcon={<Icon as={MdExitToApp} color="inherit" />}
              _hover={{ bg: 'blue.50', borderColor: '#044bd9' }}
              transition="all 0.2s"
            >
              <Text display={{ base: 'none', sm: 'block', md: 'none' }}>Exit</Text>
              <Text display={{ base: 'none', md: 'block' }}>Save &amp; Exit</Text>
            </Button>
          )}

          {/* Save & Next */}
          <Button
            fontSize={14}
            size="sm"
            minW="auto"
            px={{ base: 2, md: '15px' }}
            borderRadius="lg"
            bg="#044bd9"
            color="white"
            onClick={onNext}
            isLoading={isSubmitting}
            loadingText={loadingText}
            isDisabled={isSubmitting || isSavingAndExiting || disableNext}
            rightIcon={<Icon as={MdArrowForward} color="white" />}
            _hover={{ bg: 'blue.500' }}
            _active={{ bg: '#0235a0' }}
            transition="all 0.2s"
          >
            <Text display={{ base: 'none', sm: 'block' }}>{nextLabel}</Text>
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
