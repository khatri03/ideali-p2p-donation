import React, { useState } from 'react';
import { FormControl, FormErrorMessage } from '@chakra-ui/react';
import {
  Box,
  Button,
  Input,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  Divider,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { DonationFormData } from '../../../../interface/donationInter/donationFormDto';

interface DonationAmountSelectorProps {
  presets: any;
  isLoadingPresets: boolean;
  formData: DonationFormData;
  handleInputChange: (field: keyof DonationFormData, value: any) => void;
  tabIndex: number;
  setTabIndex: (index: number) => void;
  handleNext: () => void;
  themeColor: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
}

const DonationAmountSelector: React.FC<DonationAmountSelectorProps> = ({
  presets,
  isLoadingPresets,
  formData,
  handleInputChange,
  tabIndex,
  setTabIndex,
  handleNext,
  themeColor,
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
}) => {
  const getPresetAmountsForFrequency = (frequency: 'OneTime' | 'Monthly' | 'Yearly') => {
    if (!presets) return [];

    if (frequency === 'OneTime' && presets['oneTime']?.enabled) {
      return presets['oneTime'].presetDetails;
    } else if (frequency === 'Monthly' && presets['monthly']?.enabled) {
      return presets['monthly'].presetDetails;
    } else if (frequency === 'Yearly' && presets['yearly']?.enabled) {
      return presets['yearly'].presetDetails;
    }
    // Fallback to first available frequency
    if (presets['oneTime']?.enabled) return presets['oneTime'].presetDetails;
    if (presets['monthly']?.enabled) return presets['monthly'].presetDetails;
    if (presets['yearly']?.enabled) return presets['yearly'].presetDetails;
    return [];
  };

  const currentPresets = getPresetAmountsForFrequency(formData.frequency);
  const [amountError, setAmountError] = useState('');

  const renderPresetButtons = (frequency: 'OneTime' | 'Monthly' | 'Yearly', presetsData: any[]) => (
    <SimpleGrid columns={2} spacing={2}>
      {presetsData.map((preset: any, index: number) => (
        <Button
          key={`${frequency}-${preset.amount}-${index}`}
          h="auto"
          minH="70px"
          py={3}
          px={3}
          color={textColor}
          borderRadius="lg"
          variant="outline"
          borderWidth="2px"
          borderColor={formData.donationAmount === preset.amount && formData.frequency === frequency ? themeColor : cardBorder}
          fontWeight="bold"
          fontSize="md"
          bg={formData.donationAmount === preset.amount && formData.frequency === frequency ? `${themeColor}10` : cardBg}
          onClick={() => {
            handleInputChange('donationAmount', preset.amount);
            handleInputChange('frequency', frequency);
          }}
          _hover={{
            borderColor: themeColor,
            bg: "gray.50",
            transform: "translateY(-2px)",
            boxShadow: "lg"
          }}
          _active={{
            transform: "translateY(0)"
          }}
          transition="all 0.2s ease"
        >
          <VStack spacing={1}>
            <Text fontSize="xl" fontWeight="extrabold" color={themeColor}>
              ${preset.amount}
            </Text>
            {preset.description && (
              <Text fontSize="2xs" color={subTextColor} fontWeight="medium" textAlign="center" noOfLines={2}>
                {preset.description}
              </Text>
            )}
          </VStack>
        </Button>
      ))}
    </SimpleGrid>
  );

  return (
    <Box
      p={5}
      borderRadius="xl"
      bg={cardBg}
      borderWidth="1px"
      borderColor={cardBorder}
      boxShadow="xl"
      position="sticky"
      top="20px"
    >
      <Text fontSize="md" fontWeight="bold" color={textColor} mb={4}>
        Choose Your Donation
      </Text>

      {/* Tabs for Different Preset Frequencies */}
      <Tabs
        variant="soft-rounded"
        colorScheme="blue"
        mb={4}
        index={tabIndex}
        onChange={(index) => {
          setTabIndex(index);
          // Update frequency based on tab index
          const availableTabs: Array<'OneTime' | 'Monthly' | 'Yearly'> = [];
          if (presets && presets['oneTime']?.enabled && presets['oneTime'].presetDetails?.length > 0) availableTabs.push('OneTime');
          if (presets && presets['monthly']?.enabled && presets['monthly'].presetDetails?.length > 0) availableTabs.push('Monthly');
          if (presets && presets['yearly']?.enabled && presets['yearly'].presetDetails?.length > 0) availableTabs.push('Yearly');
          if (availableTabs[index]) {
            handleInputChange('frequency', availableTabs[index]);
          }
        }}
      >
        <TabList mb={3}>
          {presets && presets['oneTime']?.enabled && presets['oneTime'].presetDetails?.length > 0 && (
            <Tab
              fontSize="sm"
              fontWeight="semibold"
              _selected={{
                color: 'white',
                bg: themeColor,
              }}
            >
              One Time 
            </Tab>
          )}
          {presets && presets['monthly']?.enabled && presets['monthly'].presetDetails?.length > 0 && (
            <Tab
              fontSize="sm"
              fontWeight="semibold"
              _selected={{
                color: 'white',
                bg: themeColor,
              }}
            >
              Monthly 
            </Tab>
          )}
          {presets && presets['yearly']?.enabled && presets['yearly'].presetDetails?.length > 0 && (
            <Tab
              fontSize="sm"
              fontWeight="semibold"
              _selected={{
                color: 'white',
                bg: themeColor,
              }}
            >
              Yearly
            </Tab>
          )}
        </TabList>

        <TabPanels>
          {/* One Time Tab Panel */}
          {presets && presets['oneTime']?.enabled && presets['oneTime'].presetDetails?.length > 0 && (
            <TabPanel p={0}>
              {renderPresetButtons('OneTime', presets['oneTime'].presetDetails)}
            </TabPanel>
          )}

          {/* Monthly Tab Panel */}
          {presets && presets['monthly']?.enabled && presets['monthly'].presetDetails?.length > 0 && (
            <TabPanel p={0}>
              {renderPresetButtons('Monthly', presets['monthly'].presetDetails)}
            </TabPanel>
          )}

          {/* Yearly Tab Panel */}
          {presets && presets['yearly']?.enabled && presets['yearly'].presetDetails?.length > 0 && (
            <TabPanel p={0}>
              {renderPresetButtons('Yearly', presets['yearly'].presetDetails)}
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      {/* Custom Amount Input */}
<Divider my={6} />
<Text fontSize="sm" fontWeight="semibold" color={textColor} mb={3}>
  Or enter a custom amount
</Text>

<FormControl isInvalid={!!amountError}>
  <InputGroup size="lg">
    <InputLeftElement pointerEvents="none" color={subTextColor} fontSize="1.2em">
      $
    </InputLeftElement>

    <Input
      type="number"
      placeholder="Enter amount"
      value={formData.donationAmount}
      onChange={(e) => {
        let value = e.target.value;

        // 🔒 max 5 digits hard stop
        if (value.length > 5) {
          value = value.slice(0, 5);
        }

        const numValue = parseFloat(value);

        if (value === '' || isNaN(numValue)) {
          setAmountError('');
          handleInputChange('donationAmount', '');
          return;
        }

        if (numValue <= 0) {
          setAmountError('Amount must be greater than 0');
        } else {
          setAmountError('');
        }

        handleInputChange('donationAmount', numValue);
      }}
      borderWidth="2px"
      borderColor={amountError ? 'red.500' : cardBorder}
      _focus={{
        borderColor: amountError ? 'red.500' : themeColor,
        boxShadow: `0 0 0 1px ${amountError ? 'red.500' : themeColor}`,
      }}
    />
  </InputGroup>

  {/* ✅ error input ke neeche */}
  <FormErrorMessage mt={1}>
    {amountError}
  </FormErrorMessage>
</FormControl>

      {/* Continue to Payment Button */}
     <Button
  mt={6}
  w="100%"
  h="60px"
  borderRadius="xl"
  fontSize="lg"
  fontWeight="bold"
  bg={themeColor}
  color="white"
  onClick={() => {
    const amount = Number(formData.donationAmount);
    if (!amount || amount <= 0 || amount.toString().length > 5) {
      setAmountError('Please enter a valid amount');
      return;
    }
    handleNext();
  }}
  _hover={{
    bg: `${themeColor}dd`,
    transform: "translateY(-2px)",
    boxShadow: "lg",
  }}
  _active={{
    transform: "translateY(0)",
  }}
  transition="all 0.2s ease"
>
  Continue to Payment →
</Button>



      {/* Summary Text */}
      {formData.donationAmount && (
        <Box
          mt={4}
          p={4}
          borderRadius="lg"
          bg={`${themeColor}10`}
          borderWidth="1px"
          borderColor={themeColor}
        >
          <Text fontSize="sm" color={textColor} textAlign="center">
            You're donating{' '}
            <Text as="span" fontWeight="bold" color={themeColor}>
              ${formData.donationAmount}
            </Text>
            {' '}
            <Text as="span" fontWeight="semibold">
              {formData.frequency === 'OneTime' ? 'one time' : formData.frequency.toLowerCase()}
            </Text>
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default DonationAmountSelector;
