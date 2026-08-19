import { useEffect, useState } from 'react';
import {
  Box,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Select,
  Text,
  useToast,
} from '@chakra-ui/react';
import Loader from 'app/components/common/Loader';
import donationService from 'app/service/organizer/donation/donationService';
import {
  PaymentMethodOption,
} from 'app/interface/paymentMerchantsInter/paymentMerchantsResponseDto';
import StepNavButtons from '../../shared/StepNavButtons';
import membershipWizardService, {
  PaymentAccountSelectionItem,
} from '../../../services/membershipWizardService';

interface Step05Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
}

export default function Step05PaymentAccount({
  membershipId,
  isEditMode,
  onComplete,
  onPrev,
  onSkip,
  onSaveAndExit,
  isSavingAndExiting,
}: Step05Props) {
  const toast = useToast();

  const [paymentAccountUniqueId, setPaymentAccountUniqueId] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccountSelectionItem[]>([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalize = (value: unknown) =>
    String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');

  const isSupportedPaymentMethod = (method: PaymentMethodOption) => {
    const normalizedText = normalize(method.text);
    return (
      method.value === 1 ||
      method.value === 3 ||
      method.value === 4 ||
      method.value === 5 ||
      method.value === 7 ||
      normalizedText === 'debitcreditcard' ||
      normalizedText === 'applegooglepay' ||
      normalizedText.startsWith('ach') ||
      normalizedText.startsWith('pad') ||
      normalizedText.startsWith('check') ||
      normalizedText.startsWith('cheque')
    );
  };

  const filterSupportedPaymentMethods = (methods: PaymentMethodOption[]) =>
    methods.filter(isSupportedPaymentMethod);

  const filterSupportedPaymentMethodValues = (methods: string[]) =>
    methods.filter((method) => {
      const normalizedValue = normalize(method);
      return (
        normalizedValue === '1' ||
        normalizedValue === '3' ||
        normalizedValue === '4' ||
        normalizedValue === '5' ||
        normalizedValue === '7'
      );
    });

  const loadMethodsForAccount = async (uniqueId: string) => {
    if (!uniqueId) {
      setAvailablePaymentMethods([]);
      return;
    }

    setLoadingMethods(true);
    try {
      const res = await donationService.getPaymentMethodsForAccount(uniqueId as any);
      if (res.success) {
        setAvailablePaymentMethods(filterSupportedPaymentMethods(res.data ?? []));
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load payment methods',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setLoadingMethods(false);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      setLoadingAccounts(true);
      try {
        const selectionResponse = await membershipWizardService.getPaymentAccountSelectionItems();
        const accounts = selectionResponse.data?.data ?? [];
        setPaymentAccounts(accounts);

        if (membershipId && isEditMode) {
          try {
            const saved = await membershipWizardService.getWizardPaymentAccount(membershipId);
            const d = saved?.data?.data;
            if (d?.paymentAccountUniqueId) {
              setPaymentAccountUniqueId(d.paymentAccountUniqueId);
              await loadMethodsForAccount(d.paymentAccountUniqueId);

              if (d.paymentMethods?.length) {
                setPaymentMethods(
                  filterSupportedPaymentMethodValues(d.paymentMethods.map(String)),
                );
              }
            }
          } catch {
            // no saved data yet - keep defaults
          }
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load payment accounts',
          status: 'error',
          position: 'top-right',
        });
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetch();
  }, [isEditMode, membershipId]);

  const handleAccountChange = async (uniqueId: string) => {
    setPaymentAccountUniqueId(uniqueId);
    setPaymentMethods([]);
    await loadMethodsForAccount(uniqueId);
  };

  const savePaymentAccount = async (): Promise<boolean> => {
    if (!paymentAccountUniqueId) {
      toast({
        title: 'Error',
        description: 'Please select a payment account',
        status: 'error',
        position: 'top-right',
      });
      return false;
    }

    if (!paymentMethods.length) {
      toast({
        title: 'Error',
        description: 'Please select at least one payment method',
        status: 'error',
        position: 'top-right',
      });
      return false;
    }

    const supportedPaymentMethods = filterSupportedPaymentMethodValues(paymentMethods);
    if (!supportedPaymentMethods.length) {
      toast({
        title: 'Error',
        description: 'Please select at least one payment method',
        status: 'error',
        position: 'top-right',
      });
      return false;
    }

    await membershipWizardService.saveWizardPaymentAccount(
      membershipId!,
      { paymentAccountUniqueId, paymentMethods: supportedPaymentMethods },
      5,
    );
    return true;
  };

  const handleSaveAndNext = async () => {
    if (!membershipId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ok = await savePaymentAccount();
      if (ok) onComplete();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message ?? 'Failed to save',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndExit = async () => {
    if (!membershipId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ok = await savePaymentAccount();
      if (ok) onSaveAndExit?.();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message ?? 'Failed to save',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccount = paymentAccounts.find((account) => account.uniqueId === paymentAccountUniqueId);

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)"
      overflow="hidden"
    >
      <Box px={{ base: 3, md: 6 }} pt={6} pb={0}>
        {loadingAccounts ? (
          <Loader message="Loading Payment Account" subtitle="Fetching saved payment account..." />
        ) : (
          <Box maxW="100%">
            <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={4}>
              Payment Account
            </Text>
            <Text fontSize="sm" color="gray.400" mb={1}>
              Choose the payment account and supported methods that will collect membership charges.
            </Text>
            <Text fontSize="sm" color="gray.400" mb={4}>
              Select one organizer payment account, then pick the methods it can accept.
            </Text>

            <FormControl mb={4}>
              <FormLabel fontWeight="medium" fontSize="sm">
                Payment Account
                <Text as="span" color="red.500" ml={1}>*</Text>
              </FormLabel>
              <Select
                value={paymentAccountUniqueId}
                onChange={(e) => handleAccountChange(e.target.value)}
                isDisabled={loadingAccounts}
                borderRadius="lg"
                borderColor="gray.200"
                bg="white"
                _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9' }}
                fontSize="sm"
              >
                <option value="">Select Payment Account</option>
                {paymentAccounts.map((account) => (
                  <option key={account.uniqueId} value={account.uniqueId}>
                    {account.name} {account.paymentCurrency ? `(${account.paymentCurrency})` : ''}
                  </option>
                ))}
              </Select>
              {selectedAccount?.tapToPayEnabled ? (
                <Text fontSize="xs" color="gray.400" mt={1}>
                  Tap to Pay is enabled for this account.
                </Text>
              ) : null}
              {loadingAccounts && (
                <Text fontSize="xs" color="gray.400" mt={1}>Loading payment accounts...</Text>
              )}
            </FormControl>

            {paymentAccountUniqueId ? (
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
                        const isSelected = paymentMethods.map(String).includes(String(method.value));
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
                            onClick={() => {
                              const current = paymentMethods.map(String);
                              const methodValue = String(method.value);
                              const updated = current.includes(methodValue)
                                ? current.filter((v) => v !== methodValue)
                                : [...current, methodValue];
                              setPaymentMethods(updated);
                            }}
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
            ) : null}
          </Box>
        )}
      </Box>

      <Divider my={3} />

      <StepNavButtons
        onNext={handleSaveAndNext}
        onPrev={onPrev}
        showSkip={false}
        onSaveAndExit={onSaveAndExit ? handleSaveAndExit : undefined}
        isSavingAndExiting={isSavingAndExiting}
        isSubmitting={isSubmitting}
      />
    </Box>
  );
}
