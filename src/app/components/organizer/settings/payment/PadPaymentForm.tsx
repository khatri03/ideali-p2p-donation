// PadPaymentForm.tsx
import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import US_bank from '../../../../../assets/img/organizer/donation/US_bank.svg';
import { FaInfoCircle } from 'react-icons/fa';

export interface PadPaymentDetail {
  institutionNumber: string;
  transitNumber: string;
  accountNumber: string;
}

interface PadPaymentFormProps {
  showForm: boolean;
  padDetail: PadPaymentDetail;
  onPadDetailChange: (field: keyof PadPaymentDetail, value: string) => void;
  themeColor?: string;
}

export default function PadPaymentForm({
  showForm,
  padDetail,
  onPadDetailChange,
  themeColor = '#044bd9',
}: PadPaymentFormProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('#e2e8f0', 'gray.600');
  const textColor = useColorModeValue('#2d3748', 'white');
  const inputBg = '#F5FAFF';

  const [touched, setTouched] = useState({
    institutionNumber: false,
    transitNumber: false,
    accountNumber: false,
  });

  const [errors, setErrors] = useState({
    institutionNumber: '',
    transitNumber: '',
    accountNumber: '',
  });

  if (!showForm) return null;

  const validateInstitutionNumber = (value: string) => {
    if (!value.trim()) return 'Institution number is required';
    if (!/^\d{3}$/.test(value))
      return 'Institution number must be exactly 3 digits';
    return '';
  };

  const validateTransitNumber = (value: string) => {
    if (!value.trim()) return 'Transit number is required';
    if (!/^\d{5}$/.test(value))
      return 'Transit number must be exactly 5 digits';
    return '';
  };

  const validateAccountNumber = (value: string) => {
    if (!value.trim()) return 'Account number is required';
    if (!/^\d{4,17}$/.test(value)) return 'Account number must be 4–17 digits';
    return '';
  };

  const inputFocusStyle = {
    borderColor: themeColor,
    boxShadow: `0 0 0 1px ${themeColor}`,
    bg: 'white',
  };

  return (
    <Box
      bg={cardBg}
      p={{ base: 2, md: 2 }}
      borderRadius="md"
      borderColor={cardBorder}
    >
      <VStack spacing={{ base: 3, md: 4 }} align="stretch">
        <Box>
          {/* Top row: Icon + Title + Subtitle */}
          <HStack spacing={3} align="center" mb={4}>
            {/* SVG icon from assets in a blue rounded box */}
            <Box>
              <img src={US_bank} alt="Canadian Bank" width={36} height={36} />
            </Box>

            {/* Title + Subtitle */}
            <Box>
              <Text
                fontWeight="semibold"
                fontSize={{ base: 'md', md: 'lg' }}
                color="gray.800"
              >
                Canadian Bank Accounts Only
              </Text>
              <Text fontSize="sm" color="gray.500">
                PAD Direct Debit
              </Text>
            </Box>
          </HStack>

          {/* Info box */}
          <Box bg="blue.50" borderRadius="lg" p={4}>
            <HStack align="flex-start" spacing={2}>
              <Icon
                as={FaInfoCircle} // 👈 same as ACH form
                color="blue.400"
                boxSize={4}
                mt={0.5}
                flexShrink={0}
              />
              <Box>
                <Text fontWeight="semibold" fontSize="sm" color="gray.800">
                  PAD (Pre-authorized Debit)
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Direct debit from Canadian accounts. Lower fees than cards.
                  Processing takes 3-5 business days.
                </Text>
              </Box>
            </HStack>
          </Box>
        </Box>

        {/* Institution Number + Transit Number — side by side */}
        <HStack spacing={{ base: 2, md: 3 }} align="flex-start">
          {/* Institution Number */}
          <FormControl
            isRequired
            isInvalid={touched.institutionNumber && !!errors.institutionNumber}
          >
            <FormLabel
              fontSize="xs"
              fontWeight="500"
              color={textColor}
              mb={1.5}
            >
              Institution Number (3 digits)
            </FormLabel>
            <Input
              placeholder="000"
              maxLength={3}
              value={padDetail.institutionNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                onPadDetailChange('institutionNumber', val);
                if (touched.institutionNumber || val) {
                  setErrors((prev) => ({
                    ...prev,
                    institutionNumber: validateInstitutionNumber(val),
                  }));
                }
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, institutionNumber: true }));
                setErrors((prev) => ({
                  ...prev,
                  institutionNumber: validateInstitutionNumber(
                    padDetail.institutionNumber,
                  ),
                }));
              }}
              bg={inputBg}
              borderColor={cardBorder}
              borderRadius="md"
              fontSize="sm"
              _hover={{ borderColor: 'gray.300' }}
              _focus={inputFocusStyle}
            />
            <FormErrorMessage fontSize="xs">
              {errors.institutionNumber}
            </FormErrorMessage>
          </FormControl>

          {/* Transit Number */}
          <FormControl
            isRequired
            isInvalid={touched.transitNumber && !!errors.transitNumber}
          >
            <FormLabel
              fontSize="xs"
              fontWeight="500"
              color={textColor}
              mb={1.5}
            >
              Transit Number (5 digits)
            </FormLabel>
            <Input
              placeholder="11000"
              maxLength={5}
              value={padDetail.transitNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                onPadDetailChange('transitNumber', val);
                if (touched.transitNumber || val) {
                  setErrors((prev) => ({
                    ...prev,
                    transitNumber: validateTransitNumber(val),
                  }));
                }
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, transitNumber: true }));
                setErrors((prev) => ({
                  ...prev,
                  transitNumber: validateTransitNumber(padDetail.transitNumber),
                }));
              }}
              bg={inputBg}
              borderColor={cardBorder}
              borderRadius="md"
              fontSize="sm"
              _hover={{ borderColor: 'gray.300' }}
              _focus={inputFocusStyle}
            />
            <FormErrorMessage fontSize="xs">
              {errors.transitNumber}
            </FormErrorMessage>
          </FormControl>
        </HStack>
        {/* Account Number */}
        <FormControl
          isRequired
          isInvalid={touched.accountNumber && !!errors.accountNumber}
        >
          <FormLabel fontSize="xs" fontWeight="500" color={textColor} mb={1.5}>
            Account Number
          </FormLabel>
          <Input
            placeholder="000123456789"
            maxLength={17}
            value={padDetail.accountNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              onPadDetailChange('accountNumber', val);
              if (touched.accountNumber || val) {
                setErrors((prev) => ({
                  ...prev,
                  accountNumber: validateAccountNumber(val),
                }));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, accountNumber: true }));
              setErrors((prev) => ({
                ...prev,
                accountNumber: validateAccountNumber(padDetail.accountNumber),
              }));
            }}
            bg={inputBg}
            borderColor={cardBorder}
            borderRadius="md"
            fontSize="sm"
            _hover={{ borderColor: 'gray.300' }}
            _focus={inputFocusStyle}
          />
          <FormErrorMessage fontSize="xs">
            {errors.accountNumber}
          </FormErrorMessage>
        </FormControl>
      </VStack>
    </Box>
  );
}
