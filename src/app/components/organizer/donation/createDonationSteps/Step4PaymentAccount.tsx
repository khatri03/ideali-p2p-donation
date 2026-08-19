import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Select,
  Text,
  Divider,
  Grid,
  Flex,
  Checkbox,
} from '@chakra-ui/react';
import StepNavigationButtons from './shared/StepNavigationButtons';
import { Step4PaymentAccountProps } from './shared/types';

export default function Step4PaymentAccount({
  paymentAccountData,
  paymentAccountList,
  availablePaymentMethods,
  loadingAccounts,
  loadingMethods,
  onAccountChange,
  onMethodsChange,
  onSaveAndNext,
  onPrevStep,
  isSubmitting,
  onSaveAndExit,
  isSavingAndExiting,
  stepTitle = 'Set Payment Account',
  stepTitleFontSize = '32',
  stepSubtitle,
  stepSubtitle2,
  renderNavigation,
}: Step4PaymentAccountProps & {
  stepTitle?: string;
  stepTitleFontSize?: string;
  stepSubtitle?: string;
  stepSubtitle2?: string;
  renderNavigation?: () => React.ReactNode;
}) {
  const toggleMethod = (methodValue: string) => {
    const current = paymentAccountData.paymentMethods.map(String);
    const updated = current.includes(methodValue)
      ? current.filter((v) => v !== methodValue)
      : [...current, methodValue];
    onMethodsChange(updated);
  };

  return (
    <>
      <Box maxW="100%">
        <Text fontSize={stepTitleFontSize} fontWeight={stepTitleFontSize !== '32' ? 'bold' : 'normal'} color={stepTitleFontSize !== '32' ? 'gray.900' : 'inherit'} mb="4">{stepTitle}</Text>
        {stepSubtitle && (
          <Text fontSize="sm" color="gray.400" mb={stepSubtitle2 ? 1 : 4}>{stepSubtitle}</Text>
        )}
        {stepSubtitle2 && (
          <Text fontSize="sm" color="gray.400" mb={4}>{stepSubtitle2}</Text>
        )}

        {/* Payment Account Dropdown */}
        <FormControl mb={4}>
          <FormLabel fontWeight="medium" fontSize="sm">
            Payment Account
            <Text as="span" color="red.500" ml={1}>*</Text>
          </FormLabel>
          <Select
            value={paymentAccountData.paymentAccountId}
            onChange={(e) => onAccountChange(Number(e.target.value))}
            isDisabled={loadingAccounts}
            borderRadius="lg"
            borderColor="gray.200"
            bg="white"
            _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9' }}
            fontSize="sm"
          >
            <option value="0">Select Payment Account</option>
            {paymentAccountList.map((account) => (
              <option key={account.value} value={account.value}>
                {account.text}
              </option>
            ))}
          </Select>

          {loadingAccounts && (
            <Text fontSize="xs" color="gray.400" mt={1}>Loading payment accounts...</Text>
          )}

        </FormControl>

        {/* Available Payment Methods */}
        {paymentAccountData.paymentAccountId > 0 && (
          <FormControl mb={4}>
            <Box
              border="1px solid"
              borderColor="gray.200"
              borderRadius="xl"
              p={4}
              bg="gray.50"
            >
              <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>
                Available Payment Methods
              </Text>

              {loadingMethods ? (
                <Text fontSize="sm" color="gray.400">Loading payment methods...</Text>
              ) : availablePaymentMethods.length > 0 ? (
                <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                  {availablePaymentMethods.map((method) => {
                    const isSelected = paymentAccountData.paymentMethods
                      .map(String)
                      .includes(String(method.value));
                    return (
                      <Flex
                        key={method.value}
                        align="center"
                        gap={3}
                        px={4}
                        py={3}
                        borderRadius="lg"
                        border="1.5px solid"
                        borderColor={isSelected ? '#044bd9' : 'gray.200'}
                        bg={isSelected ? 'blue.50' : 'white'}
                        cursor="pointer"
                        transition="all 0.15s"
                        _hover={{ borderColor: '#044bd9', bg: 'blue.50' }}
                        onClick={() => toggleMethod(String(method.value))}
                        userSelect="none"
                      >
                        <Checkbox
                          isChecked={isSelected}
                          isReadOnly
                          pointerEvents="none"
                          colorScheme="blue"
                          flexShrink={0}
                        />
                        <Text
                          fontSize="sm"
                          fontWeight={isSelected ? 'semibold' : 'normal'}
                          color={isSelected ? '#044bd9' : 'gray.700'}
                        >
                          {method.text}
                        </Text>
                      </Flex>
                    );
                  })}
                </Grid>
              ) : (
                <Text fontSize="sm" color="gray.400">
                  No payment methods available for this account.
                </Text>
              )}
            </Box>
          </FormControl>
        )}
      </Box>

      <Divider my={3} />

      {renderNavigation ? renderNavigation() : (
        <Box maxW="100%" h="10%">
          <StepNavigationButtons
            onPrev={onPrevStep}
            onNext={onSaveAndNext}
            onSaveAndExit={onSaveAndExit}
            prevLabel="Back One Step"
            nextLabel="Save & Next"
            isSubmitting={isSubmitting}
            isSavingAndExiting={isSavingAndExiting}
            loadingText="Saving..."
          />
        </Box>
      )}
    </>
  );
}
