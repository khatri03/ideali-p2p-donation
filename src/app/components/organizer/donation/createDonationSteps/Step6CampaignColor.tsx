import React from 'react';
import {
  Box,
  Flex,
  FormLabel,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Text,
  VStack,
} from '@chakra-ui/react';
import StepNavigationButtons from './shared/StepNavigationButtons';
import { Step6CampaignColorProps } from './shared/types';

/**
 * Step 6: Campaign Color Theme
 * Select or customize campaign theme color
 */
export default function Step6CampaignColor({
  selectedColor,
  availableColors,
  onColorChange,
  onSaveAndNext,
  onSkip,
  onPrevStep,
  isSubmitting,
  onSaveAndExit,
  isSavingAndExiting,
  stepTitle = 'Campaign Color',
  renderNavigation,
}: Step6CampaignColorProps & { stepTitle?: string; renderNavigation?: () => React.ReactNode }) {
  return (
    <>
      <Box maxW="100%" h="85%" overflowY="auto">
        <Text fontSize="32" mb="4">
          {stepTitle}
        </Text>

        <Box mb="6">
          <FormLabel mb="4">Select color</FormLabel>
          <Flex gap="3" flexWrap="wrap" align="center">
            {availableColors.map((color) => (
              <Box
                key={color}
                w="50px"
                h="50px"
                bg={color}
                borderRadius="md"
                cursor="pointer"
                borderWidth="3px"
                borderColor={selectedColor === color ? 'black' : 'transparent'}
                transition="all 0.2s"
                _hover={{ transform: 'scale(1.1)' }}
                onClick={() => onColorChange(color)}
              />
            ))}

            {/* Custom Color Picker */}
            <Popover>
              <PopoverTrigger>
                <Box
                  w="50px"
                  h="50px"
                  borderWidth="2px"
                  borderStyle="dashed"
                  borderColor="gray.400"
                  borderRadius="md"
                  cursor="pointer"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  transition="all 0.2s"
                  _hover={{
                    transform: 'scale(1.1)',
                    borderColor: 'gray.600',
                  }}
                >
                  <Text fontSize="2xl" color="gray.500">
                    +
                  </Text>
                </Box>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverBody>
                  <VStack spacing="3">
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                      Choose Custom Color
                    </Text>
                    <Input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => onColorChange(e.target.value)}
                      w="100%"
                      h="40px"
                      p="0"
                      border="none"
                      cursor="pointer"
                    />
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </Flex>

          <Text fontSize="sm" color="gray.600" mt="4">
            Selected color: <strong>{selectedColor}</strong>
          </Text>
        </Box>
      </Box>

      {renderNavigation ? renderNavigation() : (
        <Box maxW="100%" h="10%">
          <StepNavigationButtons
            onPrev={onPrevStep}
            onSkip={onSkip}
            onNext={onSaveAndNext}
            onSaveAndExit={onSaveAndExit}
            isSubmitting={isSubmitting}
            isSavingAndExiting={isSavingAndExiting}
            showSkip={true}
          />
        </Box>
      )}
    </>
  );
}
