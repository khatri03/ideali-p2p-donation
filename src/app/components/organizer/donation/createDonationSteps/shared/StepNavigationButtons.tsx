import React from 'react';
import { Button, Flex, Icon, Text } from '@chakra-ui/react';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import { StepNavigationButtonsProps } from './types';

export default function StepNavigationButtons({
  onPrev,
  onSkip,
  onNext,
  onSaveAndExit,
  prevLabel = 'Back One Step',
  skipLabel = 'Skip',
  nextLabel = 'Save & Next',
  isSubmitting,
  isSavingAndExiting = false,
  loadingText = 'Saving...',
  showSkip = false,
  disableSkip = false,
  disableNext = false,
}: StepNavigationButtonsProps) {
  return (
    <Flex justify="space-between" align="center" mt="4">
      {/* Back Button */}
      {onPrev ? (
        <Button
          variant="outline"
          fontSize={14}
          size="sm"
          px="15px"
          borderRadius="lg"
          borderColor="gray.300"
          color="gray.700"
          onClick={onPrev}
          leftIcon={<Icon as={MdArrowBack} fontWeight={900} color="inherit" />}
          _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
        >
          <Text mr={2}>{prevLabel}</Text>
        </Button>
      ) : (
        <div />
      )}

      {/* Right side buttons */}
      <Flex gap="2">
        {/* Skip Button */}
        {showSkip && onSkip && (
          <Button
            variant="outline"
            fontSize={14}
            size="sm"
            borderRadius="lg"
            borderColor="gray.300"
            color="gray.600"
            onClick={onSkip}
            isDisabled={disableSkip}
            _hover={{ bg: 'gray.50' }}
            rightIcon={<Icon as={MdArrowForward} fontWeight={900} color="inherit" />}
          >
            <Text ml={2}>{skipLabel}</Text>
          </Button>
        )}

        {/* Save & Exit Button */}
        {onSaveAndExit && (
          <Button
            variant="outline"
            fontSize={14}
            size="sm"
            borderRadius="lg"
            px="15px"
            borderColor="#044bd9"
            color="#044bd9"
            bg="white"
            onClick={onSaveAndExit}
            isLoading={isSavingAndExiting}
            loadingText="Saving..."
            isDisabled={isSubmitting || isSavingAndExiting}
            _hover={{ bg: 'blue.50', borderColor: '#044bd9' }}
            transition="all 0.2s"
          >
            <Text mr={2}>Save & Exit</Text>
          </Button>
        )}

        {/* Save & Next Button */}
        <Button
          fontSize={14}
          size="sm"
          borderRadius="lg"
          px="15px"
          bg="#044bd9"
          color="white"
          onClick={onNext}
          isLoading={isSubmitting}
          loadingText={loadingText}
          isDisabled={isSubmitting || disableNext}
          _hover={{ bg: 'blue.500' }}
          _active={{ bg: '#0235a0' }}
          transition="all 0.2s"
          rightIcon={<Icon as={MdArrowForward} fontWeight={900} color="white" />}
        >
          <Text ml={2}>{nextLabel}</Text>
        </Button>
      </Flex>
    </Flex>
  );
}
