// AchPaymentForm.tsx
import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  VStack,
  HStack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaInfoCircle, FaUniversity } from 'react-icons/fa';
import { Icon } from '@chakra-ui/react';
import US_bank from '../../../../../assets/img/organizer/donation/US_bank.svg';
import { Image } from '@chakra-ui/react';

export interface AchPaymentDetail {
  routingNumber: string;
  accountNumber: string;
  accountHolderType: 'individual' | 'company';
  accountType: 'checking' | 'savings';
}

interface AchPaymentFormProps {
  showForm: boolean;
  achDetail: AchPaymentDetail;
  onAchDetailChange: (field: keyof AchPaymentDetail, value: string) => void;
  themeColor?: string;
}

export default function AchPaymentForm({
  showForm,
  achDetail,
  onAchDetailChange,
  themeColor = '#044bd9',
}: AchPaymentFormProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('#e2e8f0', 'gray.600');
  const textColor = useColorModeValue('#2d3748', 'white');
  const inputBg = '#F5FAFF';

  const [touched, setTouched] = useState({
    routingNumber: false,
    accountNumber: false,
  });

  const [errors, setErrors] = useState({
    routingNumber: '',
    accountNumber: '',
  });

  if (!showForm) return null;

  const validateRoutingNumber = (value: string) => {
    if (!value.trim()) return 'Routing number is required';
    if (!/^\d{9}$/.test(value))
      return 'Routing number must be exactly 9 digits';
    return '';
  };

  const validateAccountNumber = (value: string) => {
    if (!value.trim()) return 'Account number is required';
    if (!/^\d{4,17}$/.test(value)) return 'Account number must be 4–17 digits';
    return '';
  };

  const handleRoutingChange = (value: string) => {
    onAchDetailChange('routingNumber', value);
    if (touched.routingNumber || value) {
      setErrors((prev) => ({
        ...prev,
        routingNumber: validateRoutingNumber(value),
      }));
    }
  };

  const handleAccountChange = (value: string) => {
    onAchDetailChange('accountNumber', value);
    if (touched.accountNumber || value) {
      setErrors((prev) => ({
        ...prev,
        accountNumber: validateAccountNumber(value),
      }));
    }
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
        {/* Header */}
        <HStack mb={2} spacing={2} align="center">
          <Box>
            <Image src={US_bank} boxSize={4} alt="US Bank" w="36px" h="36px" />
          </Box>
          <Box>
            <Text
              fontWeight="semibold"
              fontSize={{ base: 'md', md: 'lg' }}
              color={textColor}
            >
              US Bank Account
            </Text>
            <Text fontSize="xs" color="gray.500">
              ACH Direct Bank
            </Text>
          </Box>
        </HStack>

        {/* Info Banner */}
        <Box
          bg="blue.50"
          border="1px solid"
          borderColor="blue.200"
          borderRadius="md"
          px={3}
          py={2}
          mb={2}
        >
          <HStack spacing={2} align="flex-start">
            <Icon
              as={FaInfoCircle}
              color="blue.400"
              boxSize={4}
              mt={0.5}
              flexShrink={0}
            />
            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="blue.700">
                ACH (Automated Clearing House)
              </Text>
              <Text fontSize="xs" color="blue.600">
                Direct bank-to-bank transfer. Lower fees than cards. Processing
                takes 3-5 business days.
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* Routing Number + Account Number — side by side */}
        <HStack spacing={{ base: 2, md: 3 }} align="flex-start">
          {/* Routing Number */}
          <FormControl
            isRequired
            isInvalid={touched.routingNumber && !!errors.routingNumber}
          >
            <FormLabel
              fontSize="xs"
              fontWeight="500"
              color={textColor}
              mb={1.5}
            >
              Routing Number
            </FormLabel>
            <Input
              placeholder="110000000"
              maxLength={9}
              value={achDetail.routingNumber}
              onChange={(e) =>
                handleRoutingChange(e.target.value.replace(/\D/g, ''))
              }
              onBlur={() => {
                setTouched((prev) => ({ ...prev, routingNumber: true }));
                setErrors((prev) => ({
                  ...prev,
                  routingNumber: validateRoutingNumber(achDetail.routingNumber),
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
              {errors.routingNumber}
            </FormErrorMessage>
          </FormControl>

          {/* Account Number */}
          <FormControl
            isRequired
            isInvalid={touched.accountNumber && !!errors.accountNumber}
          >
            <FormLabel
              fontSize="xs"
              fontWeight="500"
              color={textColor}
              mb={1.5}
            >
              Account Number
            </FormLabel>
            <Input
              placeholder="000123456789"
              maxLength={17}
              value={achDetail.accountNumber}
              onChange={(e) =>
                handleAccountChange(e.target.value.replace(/\D/g, ''))
              }
              onBlur={() => {
                setTouched((prev) => ({ ...prev, accountNumber: true }));
                setErrors((prev) => ({
                  ...prev,
                  accountNumber: validateAccountNumber(achDetail.accountNumber),
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
        </HStack>

        {/* Account Holder Type & Account Type — side by side like image */}
        <HStack spacing={{ base: 2, md: 3 }} align="flex-start">
          <FormControl isRequired>
            <FormLabel
              fontSize="xs"
              fontWeight="500"
              color={textColor}
              mb={1.5}
            >
              Account Holder Type
            </FormLabel>
            <Select
              value={achDetail.accountHolderType}
              onChange={(e) =>
                onAchDetailChange('accountHolderType', e.target.value)
              }
              bg={inputBg}
              borderColor={cardBorder}
              borderRadius="md"
              fontSize="sm"
              _hover={{ borderColor: 'gray.300' }}
              _focus={inputFocusStyle}
            >
              <option value="individual">individual</option>
              <option value="company">company</option>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel
              fontSize="xs"
              fontWeight="500"
              color={textColor}
              mb={1.5}
            >
              Account Type
            </FormLabel>
            <Select
              value={achDetail.accountType}
              onChange={(e) => onAchDetailChange('accountType', e.target.value)}
              bg={inputBg}
              borderColor={cardBorder}
              borderRadius="md"
              fontSize="sm"
              _hover={{ borderColor: 'gray.300' }}
              _focus={inputFocusStyle}
            >
              <option value="checking">checking</option>
              <option value="savings">savings</option>
            </Select>
          </FormControl>
        </HStack>
      </VStack>
    </Box>
  );
}
