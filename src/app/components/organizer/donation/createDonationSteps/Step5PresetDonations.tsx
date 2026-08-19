import React from 'react';
import {
  Box,
  Flex,
  Input,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react';
import { handleNumberInput, handleNumberKeyDown } from '../../../../components/common/validation';
import StepNavigationButtons from './shared/StepNavigationButtons';
import { Step5PresetDonationsProps, PresetAmountItem } from './shared/types';

/**
 * Renders a donation section with toggle and preset amounts
 */
const DonationSection = ({
  title,
  type,
  enabled,
  onToggleChange,
  presets,
  onAmountChange,
  onDescriptionChange,
}: {
  title: string;
  type: string;
  enabled: boolean;
  onToggleChange: (enabled: boolean) => void;
  presets: PresetAmountItem[];
  onAmountChange: (type: string, id: number, newAmount: string) => void;
  onDescriptionChange: (type: string, id: number, newDescription: string) => void;
}) => (
  <Box mb="8" pb="6" borderBottomWidth="1px" borderColor="gray.200">
    <Flex justify="space-between" align="center" mb="6">
      <Text fontSize="md" fontWeight="semibold">
        {title}
      </Text>
      <Switch
        size="lg"
        isChecked={enabled}
        onChange={(e) => onToggleChange(e.target.checked)}
        colorScheme="green"
      />
    </Flex>

    {enabled && (
      <VStack spacing="4" align="stretch">
        {presets.map((preset) => (
          <Flex
            key={preset.id}
            justify="space-between"
            align="center"
            gap="4"
            w="full"
            p="3"
          >
            <Box flex="0.4">
              <Input
                type="text"
                value={preset.amount === '0.00' ? '' : preset.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (handleNumberInput(value, 8)) {
                    onAmountChange(type, preset.id, value);
                  }
                }}
                onKeyDown={handleNumberKeyDown}
                fontSize="md"
                fontWeight="normal"
                border="1px solid"
                borderColor="gray.300"
                w="100%"
                p="2"
                textAlign="center"
                _focus={{ boxShadow: 'none', borderColor: 'blue.400' }}
                placeholder="0.00"
              />
            </Box>
            <Box flex="1">
              <Input
                value={preset.description}
                onChange={(e) =>
                  onDescriptionChange(type, preset.id, e.target.value)
                }
                placeholder="Enter description e.g. Can help feeding 30 children"
                fontSize="sm"
                bg="white"
                border="1px solid"
                borderColor="gray.300"
                _focus={{ boxShadow: 'none', borderColor: 'blue.400' }}
                _placeholder={{ fontSize: 'xs', color: 'gray.400' }}
              />
            </Box>
          </Flex>
        ))}
      </VStack>
    )}
  </Box>
);

/**
 * Step 5: Preset Donation Amounts
 * Configure preset amounts for one-time, monthly, and yearly donations
 */
export default function Step5PresetDonations({
  presetAmounts,
  oneTimeEnabled,
  monthlyEnabled,
  yearlyEnabled,
  onAmountChange,
  onDescriptionChange,
  onToggleChange,
  onSaveAndNext,
  onSkip,
  onPrevStep,
  isSubmitting,
  onSaveAndExit,
  isSavingAndExiting,
}: Step5PresetDonationsProps) {
  return (
    <>
      <Box maxW="100%" h="85%" overflowY="auto">
        <Text fontSize="32" mb="4">
          Preset Donation
        </Text>

        {/* One Time Donation Section - Enabled by Default */}
        <DonationSection
          title="One Time Amount(s)"
          type="oneTime"
          enabled={oneTimeEnabled}
          onToggleChange={(enabled) => onToggleChange('oneTime', enabled)}
          presets={presetAmounts.oneTime}
          onAmountChange={onAmountChange}
          onDescriptionChange={onDescriptionChange}
        />

        {/* Monthly Donation Section */}
        <DonationSection
          title="Monthly Amount(s)"
          type="monthly"
          enabled={monthlyEnabled}
          onToggleChange={(enabled) => onToggleChange('monthly', enabled)}
          presets={presetAmounts.monthly}
          onAmountChange={onAmountChange}
          onDescriptionChange={onDescriptionChange}
        />

        {/* Yearly Donation Section */}
        <DonationSection
          title="Yearly Amount(s)"
          type="yearly"
          enabled={yearlyEnabled}
          onToggleChange={(enabled) => onToggleChange('yearly', enabled)}
          presets={presetAmounts.yearly}
          onAmountChange={onAmountChange}
          onDescriptionChange={onDescriptionChange}
        />
      </Box>

      <Box maxW="100%" h="10%">
        <StepNavigationButtons
          onPrev={onPrevStep}
          onSkip={onSkip}
          onNext={onSaveAndNext}
          onSaveAndExit={onSaveAndExit}
          prevLabel="Back One Step"
          skipLabel="Skip"
          nextLabel="Save & Next"
          isSubmitting={isSubmitting}
          isSavingAndExiting={isSavingAndExiting}
          loadingText="Saving..."
          showSkip={true}
        />
      </Box>
    </>
  );
}
