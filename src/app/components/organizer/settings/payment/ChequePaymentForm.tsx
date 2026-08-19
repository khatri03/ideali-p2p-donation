import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  VStack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';

export interface ChequePaymentDetail {
  chequeNumber: string;
  description: string;
}

interface ChequePaymentFormProps {
  showForm: boolean;
  chequeDetail: ChequePaymentDetail;
  onChequeDetailChange: (field: keyof ChequePaymentDetail, value: string) => void;
  themeColor?: string;
}

export default function ChequePaymentForm({
  showForm,
  chequeDetail,
  onChequeDetailChange,
  themeColor = '#044bd9',
}: ChequePaymentFormProps) {
  const cardBorder = useColorModeValue('#e2e8f0', 'gray.600');
  const textColor = useColorModeValue('#2d3748', 'white');
  const inputBg = '#F5FAFF';

  const [touched, setTouched] = React.useState({
    chequeNumber: false,
    description: false,
  });

  const [errors, setErrors] = React.useState({
    chequeNumber: '',
    description: '',
  });

  if (!showForm) return null;

  const validateChequeNumber = (value: string) => {
    if (!value.trim()) return 'Cheque number is required';
    return '';
  };

  const inputFocusStyle = {
    borderColor: themeColor,
    boxShadow: `0 0 0 1px ${themeColor}`,
    bg: 'white',
  };

  return (
    <Box p={{ base: 2, md: 2 }}>
      <Text fontWeight="semibold" fontSize={{ base: 'md', md: 'lg' }} color="gray.800" mb={4}>
        Check/Cheque Details
      </Text>
      <VStack spacing={{ base: 3, md: 4 }} align="stretch">
        <FormControl isRequired isInvalid={touched.chequeNumber && !!errors.chequeNumber}>
          <FormLabel fontSize="xs" fontWeight="500" color={textColor} mb={1.5}>
            Check/Cheque Number
          </FormLabel>
          <Input
            placeholder="Enter check/cheque number"
            value={chequeDetail.chequeNumber}
            onChange={(e) => {
              const val = e.target.value;
              onChequeDetailChange('chequeNumber', val);
              if (touched.chequeNumber || val) {
                setErrors((prev) => ({ ...prev, chequeNumber: validateChequeNumber(val) }));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, chequeNumber: true }));
              setErrors((prev) => ({
                ...prev,
                chequeNumber: validateChequeNumber(chequeDetail.chequeNumber),
              }));
            }}
            bg={inputBg}
            borderColor={cardBorder}
            borderRadius="md"
            fontSize="sm"
            _hover={{ borderColor: 'gray.300' }}
            _focus={inputFocusStyle}
          />
          <FormErrorMessage fontSize="xs">{errors.chequeNumber}</FormErrorMessage>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="xs" fontWeight="500" color={textColor} mb={1.5}>
            Description
          </FormLabel>
          <Textarea
            placeholder="Enter description (optional)"
            value={chequeDetail.description}
            onChange={(e) => onChequeDetailChange('description', e.target.value)}
            bg={inputBg}
            borderColor={cardBorder}
            borderRadius="md"
            fontSize="sm"
            rows={3}
            _hover={{ borderColor: 'gray.300' }}
            _focus={inputFocusStyle}
          />
        </FormControl>
      </VStack>
    </Box>
  );
}
