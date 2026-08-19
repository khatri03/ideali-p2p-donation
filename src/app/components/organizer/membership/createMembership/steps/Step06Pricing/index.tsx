import React from 'react';
import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
} from '@chakra-ui/react';
import { MdRadioButtonChecked, MdRadioButtonUnchecked } from 'react-icons/md';
import { useStep06, PricingBillingCycle, AnnualRenewalType } from './useStep06';
import StepNavButtons from '../../shared/StepNavButtons';
import { MembershipPreviewData } from '../../../types';
import Loader from 'app/components/common/Loader';

interface Step06Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
  onPrev?: () => void;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
  onPreviewUpdate?: (data: Partial<MembershipPreviewData>) => void;
}

const BILLING_OPTIONS: { value: PricingBillingCycle; label: string; renewalText: string }[] = [
  { value: 'monthly',  label: 'Monthly',   renewalText: 'Renewed every month.' },
  { value: 'annual',   label: 'Annual',    renewalText: 'Renewed every year.' },
  { value: 'lifetime', label: 'Life Time', renewalText: 'One-time payment, never expires.' },
  { value: 'custom',   label: 'Custom',    renewalText: 'Custom billing period based on the number of days you specify.' },
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const daysInMonth = (month: number) => new Date(2024, month, 0).getDate();

export default function Step06Pricing({
  membershipId,
  isEditMode,
  onComplete,
  onPrev,
  onSaveAndExit,
  isSavingAndExiting,
  onPreviewUpdate,
}: Step06Props) {
  const {
    billingCycle, setBillingCycle,
    membershipCharges, setMembershipCharges,
    annualRenewalType, setAnnualRenewalType,
    annualExpiryMonth, setAnnualExpiryMonth,
    annualExpiryDay, setAnnualExpiryDay,
    customExpiryDays, setCustomExpiryDays,
    chargesError, customDaysError,
    isLoading, isSubmitting, submit, saveAndExit,
  } = useStep06({ membershipId, isEditMode, onComplete, onPreviewUpdate });

  const selected = BILLING_OPTIONS.find((o) => o.value === billingCycle);

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)"
      overflow="hidden"
    >
      {/* Body */}
      <Box px={{ base: 3, md: 6 }} pt={6} pb={5}>
        {isLoading ? (
          <Loader message="Loading Pricing" subtitle="Fetching saved pricing details..." />
        ) : (<>
        {/* Header */}
        <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>
          Pricing
        </Text>
        <Text fontSize="sm" color="gray.400" mb={1}>
          Set the billing cycle that defines this membership plan.
        </Text>
        <Text fontSize="sm" color="gray.400" mb={6}>
          Choose one option before continuing to the next setup step.
        </Text>

        {/* Membership Charges */}
        <FormControl isRequired mb={1}>
          <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
            Membership Price
          </FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none" color="gray.500" fontSize="sm">
              $
            </InputLeftElement>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={membershipCharges}
              onChange={(e) => setMembershipCharges(e.target.value)}
              fontSize="sm"
              bg="gray.100"
              border="1px solid"
              borderColor={chargesError ? 'red.400' : 'gray.200'}
              borderRadius="lg"
              boxShadow="sm"
              _focus={{ boxShadow: '0 0 0 2px #044bd9', bg: 'white', borderColor: '#044bd9' }}
              _hover={{ bg: 'white', borderColor: 'gray.300' }}
              pl={8}
            />
          </InputGroup>
        </FormControl>
        <Text fontSize="xs" color={chargesError ? 'red.500' : 'gray.400'} mb={5}>
          {chargesError || 'Enter the membership price. Up to 2 decimals allowed. Use 0.00 for free.'}
        </Text>

        {/* Billing cycle radio cards */}
        <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={3} mb={3}>
          {BILLING_OPTIONS.map((opt) => {
            const isSelected = billingCycle === opt.value;
            return (
              <Flex
                key={opt.value}
                align="center"
                gap={2}
                px={3}
                py={3}
                borderRadius="lg"
                border="1.5px solid"
                borderColor={isSelected ? '#044bd9' : 'gray.200'}
                bg={isSelected ? 'blue.50' : 'white'}
                cursor="pointer"
                transition="all 0.15s"
                _hover={{ borderColor: '#044bd9', bg: 'blue.50' }}
                onClick={() => setBillingCycle(opt.value)}
                userSelect="none"
              >
                <Icon
                  as={isSelected ? MdRadioButtonChecked : MdRadioButtonUnchecked}
                  color={isSelected ? '#044bd9' : 'gray.300'}
                  boxSize={4}
                  flexShrink={0}
                />
                <Text
                  fontSize="sm"
                  fontWeight={isSelected ? 'semibold' : 'normal'}
                  color={isSelected ? '#044bd9' : 'gray.700'}
                >
                  {opt.label}
                </Text>
              </Flex>
            );
          })}
        </Grid>

        {/* Renewal description */}
        {selected && (
          <Box
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            px={4}
            py={3}
            mb={4}
          >
            <Text fontSize="sm" color="gray.600">
              {selected.renewalText}
            </Text>
          </Box>
        )}

        {/* Annual — Renewal Due On section */}
        {billingCycle === 'annual' && (
          <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            overflow="hidden"
            mb={2}
          >
            {/* Section header */}
            <Flex
              px={4}
              py={3}
              bg="gray.50"
              borderBottom="1px solid"
              borderColor="gray.200"
              justify="space-between"
              align="center"
            >
              <Box>
                <Text fontSize="xs" fontWeight="bold" color="teal.600" textTransform="uppercase" letterSpacing="wide">
                  Renewal Due On
                </Text>
                <Text fontSize="xs" color="gray.400" mt={0.5}>
                  Month and date are required for the custom annual expiry.
                </Text>
              </Box>
              {annualRenewalType === 'custom' && (
                <Box
                  px={2}
                  py={0.5}
                  border="1px solid"
                  borderColor="red.300"
                  borderRadius="full"
                  fontSize="10px"
                  color="red.400"
                  fontWeight="medium"
                >
                  Required
                </Box>
              )}
            </Flex>

            {/* Every Year / Custom radio options */}
            <Grid templateColumns="1fr 1fr" gap={0}>
              {(['every-year', 'custom'] as AnnualRenewalType[]).map((type) => {
                const isSelected = annualRenewalType === type;
                return (
                  <Flex
                    key={type}
                    align="center"
                    gap={3}
                    px={4}
                    py={3}
                    cursor="pointer"
                    bg={isSelected ? 'cyan.50' : 'white'}
                    borderRight={type === 'every-year' ? '1px solid' : 'none'}
                    borderColor="gray.200"
                    transition="all 0.15s"
                    _hover={{ bg: isSelected ? 'cyan.50' : 'gray.50' }}
                    onClick={() => setAnnualRenewalType(type)}
                    userSelect="none"
                  >
                    <Flex
                      w="18px"
                      h="18px"
                      borderRadius="full"
                      border="2px solid"
                      borderColor={isSelected ? 'teal.400' : 'gray.300'}
                      bg={isSelected ? 'teal.400' : 'white'}
                      align="center"
                      justify="center"
                      flexShrink={0}
                      transition="all 0.15s"
                    >
                      {isSelected && (
                        <Box w="6px" h="6px" borderRadius="full" bg="white" />
                      )}
                    </Flex>
                    <Text
                      fontSize="sm"
                      fontWeight={isSelected ? 'semibold' : 'normal'}
                      color={isSelected ? 'teal.700' : 'gray.700'}
                    >
                      {type === 'every-year' ? 'Every Year' : 'Custom'}
                    </Text>
                  </Flex>
                );
              })}
            </Grid>

            {/* Month + Date dropdowns */}
            <Grid templateColumns="1fr 1fr" gap={4} px={4} py={4} borderTop="1px solid" borderColor="gray.100">
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                  Month <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <Select
                  value={annualExpiryMonth}
                  isDisabled={annualRenewalType === 'every-year'}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setAnnualExpiryMonth(m);
                    if (annualExpiryDay > daysInMonth(m)) setAnnualExpiryDay(1);
                  }}
                  fontSize="sm"
                  bg={annualRenewalType === 'every-year' ? 'gray.50' : 'white'}
                  borderColor="gray.200"
                  borderRadius="lg"
                  _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 2px #044bd9' }}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                  Date <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <Select
                  value={annualExpiryDay}
                  isDisabled={annualRenewalType === 'every-year'}
                  onChange={(e) => setAnnualExpiryDay(Number(e.target.value))}
                  fontSize="sm"
                  bg={annualRenewalType === 'every-year' ? 'gray.50' : 'white'}
                  borderColor="gray.200"
                  borderRadius="lg"
                  _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 2px #044bd9' }}
                >
                  {Array.from({ length: daysInMonth(annualExpiryMonth) }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Box>
        )}

        {/* Custom expiry days */}
        {billingCycle === 'custom' && (
          <FormControl isRequired>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
              Expiry Days
            </FormLabel>
            <Input
              type="number"
              min="1"
              max="999"
              maxLength={3}
              placeholder="30"
              value={customExpiryDays}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                setCustomExpiryDays(val);
              }}
              fontSize="sm"
              bg="gray.100"
              border="1px solid"
              borderColor={customDaysError ? 'red.400' : 'gray.200'}
              borderRadius="lg"
              boxShadow="sm"
              _focus={{ boxShadow: '0 0 0 2px #044bd9', bg: 'white', borderColor: '#044bd9' }}
              _hover={{ bg: 'white', borderColor: 'gray.300' }}
            />
            <Text fontSize="xs" color={customDaysError ? 'red.500' : 'gray.400'} mt={1}>
              {customDaysError || 'Number of days before the membership expires (1–999).'}
            </Text>
          </FormControl>
        )}
        </>)}
      </Box>

      {/* Footer */}
      <StepNavButtons
        onNext={submit}
        onPrev={onPrev}
        onSaveAndExit={onSaveAndExit ? () => saveAndExit(onSaveAndExit) : undefined}
        isSavingAndExiting={isSavingAndExiting}
        isSubmitting={isSubmitting}
      />
    </Box>
  );
}
