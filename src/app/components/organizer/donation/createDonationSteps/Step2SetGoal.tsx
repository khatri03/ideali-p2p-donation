import React from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  Collapse,
  Switch,
  Divider,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { handleNumberInput, handleNumberKeyDown } from '../../../../components/common/validation';
import StepNavigationButtons from './shared/StepNavigationButtons';
import { Step2SetGoalProps } from './shared/types';

/**
 * Step 2: Set Fundraising Goal
 * Allows setting an optional fundraising goal with toggle visibility
 */
export default function Step2SetGoal({
  donationGoal,
  showGoalInput,
  showFundraisingGoalInPreview,
  goalError,
  onGoalChange,
  onShowGoalInputChange,
  onShowInPreviewChange,
  onSaveAndNext,
  onSkip,
  onPrevStep,
  isSubmitting,
  onSaveAndExit,
  isSavingAndExiting,
}: Step2SetGoalProps) {
  return (
    <>
      <Box maxW="100%" h="85%">
        <Text fontSize="32" mb="4">
          Set Goal
        </Text>
        <Text fontSize="16" mb="4">
          Our fundraising goal is to raise enough funds to support our mission
          and make a lasting positive impact on the community.
        </Text>

        {!showGoalInput ? (
          <Button
            leftIcon={<AddIcon />}
            colorScheme="purple"
            fontSize="xs"
            variant="outline"
            borderRadius="full"
            onClick={() => onShowGoalInputChange(true)}
            mb="5"
          >
            Add Fundraising Goal
          </Button>
        ) : (
          <Collapse in={showGoalInput} animateOpacity>
            <FormControl mb="3">
              <FormLabel fontWeight="semibold">
                Fundraising Goal (Amount)
                <Text as="span" color="red.700">
                  {' '}
                  *
                </Text>
              </FormLabel>

              <Input
                name="fundRaisingGoal"
                type="text"
                value={
                  donationGoal.fundRaisingGoal === 0
                    ? ''
                    : donationGoal.fundRaisingGoal
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (handleNumberInput(value, 8)) {
                    onGoalChange(value === '' ? 0 : Number(value));
                  }
                }}
                onKeyDown={handleNumberKeyDown}
                borderRadius="full"
                focusBorderColor="blue.400"
                placeholder="Enter amount"
              />

              <Text
                as="span"
                fontSize="sm"
                fontWeight="bold"
                color="red.700"
                mt={2}
                display="block"
              >
                {goalError}
              </Text>
            </FormControl>

            <FormControl display="flex" alignItems="center" mt="4">
              <Switch
                id="show-fundraising-goal"
                isChecked={showFundraisingGoalInPreview}
                onChange={(e) => onShowInPreviewChange(e.target.checked)}
                colorScheme="purple"
                mr="3"
              />
              <FormLabel htmlFor="show-fundraising-goal" fontSize="xs" mb="0">
                Show Fundraising Goal
              </FormLabel>
            </FormControl>
          </Collapse>
        )}
      </Box>

      <Divider my={3} />

      <Box maxW="100%" h="10%">
        <StepNavigationButtons
          onPrev={onPrevStep}
          onSkip={!showGoalInput ? onSkip : undefined}
          onNext={showGoalInput ? onSaveAndNext : onSkip}
          onSaveAndExit={onSaveAndExit}
          prevLabel="Back One Step"
          skipLabel="Skip Now"
          nextLabel={showGoalInput ? 'Save & Next' : 'Skip Now'}
          isSubmitting={isSubmitting}
          isSavingAndExiting={isSavingAndExiting}
          loadingText="Saving..."
          showSkip={!showGoalInput}
        />
      </Box>
    </>
  );
}
