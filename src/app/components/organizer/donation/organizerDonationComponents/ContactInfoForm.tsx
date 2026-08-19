import CommonMethod from "../../../../service/helpers/commonMethod";
import { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  VStack,
  Text,
  FormErrorMessage,
  useColorModeValue,
} from '@chakra-ui/react';
import { ContactInfo } from '../../../../interface/donationInter/donationFormDto';

interface ContactInfoFormProps {
  contact: ContactInfo;
  onContactChange: (field: keyof ContactInfo, value: string | number) => void;
  themeColor?: string;
}

export default function ContactInfoForm({
  contact,
  onContactChange,
  themeColor = '#044bd9',
}: ContactInfoFormProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    primaryEmail: '',
    cellPhone: '',
  });

 const handleFirstNameChange = (value: string) => {
  // 🔒 HARD LIMIT: 20 se aage typing ruk jaaye
  if (value.length > 20) {
    value = value.slice(0, 20);
  }

  
  CommonMethod.MaxLengthValidation(value, 20);

  // State update trimmed value se
  onContactChange('firstName', value);

  if (!value.trim()) {
    setErrors(prev => ({ ...prev, firstName: 'First name is required' }));
    return;
  }

  if (value.trim().length < 4) {
    setErrors(prev => ({ ...prev, firstName: 'First name must be at least 4 characters' }));
    return;
  }

  if (!/^[a-zA-Z\s]+$/.test(value)) {
    setErrors(prev => ({ ...prev, firstName: 'First name can only contain letters' }));
    return;
  }

  setErrors(prev => ({ ...prev, firstName: '' }));
};


// Validate last name with max length 20
const handleLastNameChange = (value: string) => {
  // 🔒 HARD LIMIT: 20 characters
  if (value.length > 20) {
    value = value.slice(0, 20);
  }

  // Call CommonMethod.MaxLengthValidation (same as first/middle name)
  CommonMethod.MaxLengthValidation(value, 20);

  // State update
  onContactChange('lastName', value);

  // Validation
  if (!value.trim()) {
    setErrors(prev => ({ ...prev, lastName: 'Last name is required' }));
  } else if (value.trim().length < 2) {
    setErrors(prev => ({
      ...prev,
      lastName: 'Last name must be at least 2 characters',
    }));
  } else if (!/^[a-zA-Z\s]+$/.test(value)) {
    setErrors(prev => ({
      ...prev,
      lastName: 'Last name can only contain letters',
    }));
  } else {
    setErrors(prev => ({ ...prev, lastName: '' }));
  }
};


  // Validate email
  const handleEmailChange = (value: string) => {
  onContactChange('primaryEmail', value);

  if (!value.trim()) {
    setErrors(prev => ({ ...prev, primaryEmail: 'Email address is required' }));
  } else if (!CommonMethod.EmailValidation(value)) {   // yaha function call ho raha hai
    setErrors(prev => ({ ...prev, primaryEmail: 'Please enter a valid email address' }));
  } else {
    setErrors(prev => ({ ...prev, primaryEmail: '' }));
  }
};

// Validate phone (required, min 10, max 15 digits, optional + at start)
const handlePhoneChange = (value: string) => {
  let sanitizedValue = value;

  // Allow only digits and + at start
  if (sanitizedValue.startsWith('+')) {
    sanitizedValue = '+' + sanitizedValue.slice(1).replace(/\D/g, '');
  } else {
    sanitizedValue = sanitizedValue.replace(/\D/g, '');
  }

  // Hard limit: max 15 digits (excluding +)
  let digitsOnly = sanitizedValue.startsWith('+') ? sanitizedValue.slice(1) : sanitizedValue;
  if (digitsOnly.length > 15) {
    digitsOnly = digitsOnly.slice(0, 15);
    sanitizedValue = sanitizedValue.startsWith('+') ? '+' + digitsOnly : digitsOnly;
  }

  // Update state
  onContactChange('cellPhone', sanitizedValue);

  // Validation
  if (!digitsOnly) {
    setErrors(prev => ({ ...prev, cellPhone: 'Phone number is required' }));
  } else if (digitsOnly.length < 10) {
    setErrors(prev => ({ ...prev, cellPhone: 'Phone number must be at least 10 digits' }));
  } else {
    setErrors(prev => ({ ...prev, cellPhone: '' }));
  }
};



  return (
    <Box
      bg={cardBg}
      p={0}
      borderColor={cardBorder}
    >
      <VStack spacing={6} align="stretch">

        {/* First Name, Last Name */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired isInvalid={!!errors.firstName}>
             <FormLabel fontSize="xs" color={textColor}>First Name</FormLabel>
            <Input
              placeholder="John"
              value={contact.firstName}
              onChange={(e) => handleFirstNameChange(e.target.value)}
              size="md"
              bg="#F5FAFF"
              borderColor={cardBorder}
              borderRadius="md"
              fontSize="sm"
              _hover={{ borderColor: 'gray.300' }}
              _focus={{
                borderColor: themeColor,
                boxShadow: `0 0 0 1px ${themeColor}`,
                bg: 'white',
              }}
            />
            <FormErrorMessage fontSize="xs">{errors.firstName}</FormErrorMessage>
          </FormControl>


          <FormControl isRequired isInvalid={!!errors.lastName}>
             <FormLabel fontSize="xs" color={textColor}>Last Name</FormLabel>
            <Input
              placeholder="Doe"
              value={contact.lastName}
              onChange={(e) => handleLastNameChange(e.target.value)}
              size="md"
              bg="#F5FAFF"
              borderColor={cardBorder}
              borderRadius="md"
              fontSize="sm"
              _hover={{ borderColor: 'gray.300' }}
              _focus={{
                borderColor: themeColor,
                boxShadow: `0 0 0 1px ${themeColor}`,
                bg: 'white',
              }}
            />
            <FormErrorMessage fontSize="xs">{errors.lastName}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>

        {/* Email and Phone */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired isInvalid={!!errors.primaryEmail}>
            <FormLabel fontSize="xs" color={textColor}>Email</FormLabel>
            <Input
              type="email"
              placeholder="your.email@example.com" 
              value={contact.primaryEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              size="md"
              bg="#F5FAFF"
              borderColor={cardBorder}
              borderRadius="md"
              fontSize="sm"
              _hover={{ borderColor: 'gray.300' }}
              _focus={{
                borderColor: themeColor,
                boxShadow: `0 0 0 1px ${themeColor}`,
                bg: 'white',
              }}
            />
            <FormErrorMessage fontSize="xs">{errors.primaryEmail}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.cellPhone}>
             <FormLabel fontSize="xs" color={textColor}>Phone Number</FormLabel>
            <Input
              type="tel"
              placeholder="+15551234567"
              value={contact.cellPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              size="md"
              bg="#F5FAFF"
              borderColor={cardBorder}
              borderRadius="md"
              fontSize="sm"
              _hover={{ borderColor: 'gray.300' }}
              _focus={{
                borderColor: themeColor,
                boxShadow: `0 0 0 1px ${themeColor}`,
                bg: 'white',
              }}
            />
            <FormErrorMessage fontSize="xs">{errors.cellPhone}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>
      </VStack>
    </Box>
  );
}
