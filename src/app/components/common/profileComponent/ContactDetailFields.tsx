import React from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Text,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
interface ContactDetailFieldsProps {
  firstName: string;
  lastName: string;
  middleName: string;
  primaryEmail: string;
  cellPhone: string;
  firstNameError?: string;
  lastNameError?: string;
  middleNameError?: string;
  primaryEmailError?: string;
  cellPhoneError?: string;
  onChange: (field: string, value: string) => void;
  onBlur: (field: string) => void;
  isEditing: boolean;
}

export default function ContactDetailFields({
  firstName,
  lastName,
  middleName,
  primaryEmail,
  cellPhone,
  firstNameError,
  lastNameError,
  middleNameError,
  primaryEmailError,
  cellPhoneError,
  onChange,
  onBlur,
  isEditing,
}: ContactDetailFieldsProps) {
  const inputBg = useColorModeValue('gray.50', 'navy.900');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.100');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const textColor = useColorModeValue('gray.700', 'white');

  return (
    <SimpleGrid columns={{ sm: 1, md: 4 }} spacing={6}>
      
      <FormControl>
        <FormLabel fontWeight="600" fontSize="sm" color={labelColor}>
          First Name <Text as="span" color="red.500">*</Text>
        </FormLabel>
        {isEditing ? (
          <>
            <Input
              placeholder="John"
              maxLength={20}
              value={firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              onBlur={() => onBlur('firstName')}
              bg={inputBg}
              border="1px solid"
              borderColor={inputBorder}
              _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
              _focus={{
                borderColor: useColorModeValue('blue.500', 'blue.400'),
                boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
              }}
            />
            {firstNameError && (
              <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>
                {firstNameError}
              </Text>
            )}
          </>
        ) : (
          <Text color={textColor} fontWeight="medium">{firstName || '-'}</Text>
        )}
      </FormControl>

      <FormControl>
        <FormLabel fontWeight="600" fontSize="sm" color={labelColor}>
          Last Name <Text as="span" color="red.500">*</Text>
        </FormLabel>
        {isEditing ? (
          <>
            <Input
              placeholder="Doe"
              maxLength={20}
              value={lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              onBlur={() => onBlur('lastName')}
              bg={inputBg}
              border="1px solid"
              borderColor={inputBorder}
              _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
              _focus={{
                borderColor: useColorModeValue('blue.500', 'blue.400'),
                boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
              }}
            />
            {lastNameError && (
              <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>
                {lastNameError}
              </Text>
            )}
          </>
        ) : (
          <Text color={textColor} fontWeight="medium">{lastName || '-'}</Text>
        )}
      </FormControl>

      <FormControl>
        <FormLabel fontWeight="600" fontSize="sm" color={labelColor}>
          Primary Email <Text as="span" color="red.500">*</Text>
        </FormLabel>
        {isEditing ? (
          <>
            <Input
              placeholder="primary@example.com"
              maxLength={254}
              type="email"
              value={primaryEmail}
              onChange={(e) => onChange('primaryEmail', e.target.value)}
              onBlur={() => onBlur('primaryEmail')}
              bg={inputBg}
              border="1px solid"
              borderColor={inputBorder}
              _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
              _focus={{
                borderColor: useColorModeValue('blue.500', 'blue.400'),
                boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
              }}
            />
            {primaryEmailError && (
              <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>
                {primaryEmailError}
              </Text>
            )}
          </>
        ) : (
          <Text color={textColor} fontWeight="medium">{primaryEmail || '-'}</Text>
        )}
      </FormControl>

      <FormControl>
        <FormLabel fontWeight="600" fontSize="sm" color={labelColor}>
          Cell Phone
        </FormLabel>
        {isEditing ? (
          <>
            <Input
              placeholder="+15551234567"
              maxLength={16}
              type="tel"
              value={cellPhone}
              onChange={(e) => onChange('cellPhone', e.target.value)}
              onBlur={() => onBlur('cellPhone')}
              bg={inputBg}
              border="1px solid"
              borderColor={inputBorder}
              _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
              _focus={{
                borderColor: useColorModeValue('blue.500', 'blue.400'),
                boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
              }}
            />
            {cellPhoneError && (
              <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>
                {cellPhoneError}
              </Text>
            )}
          </>
        ) : (
          <Text color={textColor} fontWeight="medium">{cellPhone || '-'}</Text>
        )}
      </FormControl>
    </SimpleGrid>
  );
}