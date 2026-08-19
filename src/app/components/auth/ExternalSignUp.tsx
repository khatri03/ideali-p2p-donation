import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Image } from '@chakra-ui/react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
  useColorModeValue,
  useToast,
  VStack,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import HttpClient from '../../service/httpClient/HttpClient';
import logo from '../../../assets/img/logo/idealiLogo.svg';

interface LocationState {
  email?: string;
  name?: string;
  externalUserId?: string;
}

export default function ExternalSignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Get pre-filled values passed from the Google login flow
  const state = (location.state as LocationState) || {};
  const googleEmail = state.email || '';
  const googleName = state.name || '';
  const externalUserId = state.externalUserId || '';

  // Split Google name into first/last as a best-effort pre-fill
  const nameParts = googleName.trim().split(' ');
  const defaultFirstName = nameParts[0] || '';
  const defaultLastName = nameParts.slice(1).join(' ') || '';

  const [organizerName, setOrganizerName] = useState('');
  const [firstName, setFirstName] = useState(defaultFirstName.replace(/[^A-Za-z ]/g, ''));
  const [lastName, setLastName] = useState(defaultLastName.replace(/[^A-Za-z ]/g, ''));
  const [isLoading, setIsLoading] = useState(false);

  // Validation errors
  const [organizerNameError, setOrganizerNameError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');

  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const textColorSecondary = '#A3AED0';
  const brandStars = useColorModeValue('#4318FF', '#044bd9');
  const bgColor = useColorModeValue('#FFFFFF', '#1B254B');
  const borderColor = useColorModeValue('#E0E5F2', '#2D3748');
  const sectionColor = useColorModeValue('#2563EA', '#7551FF');
  const disabledBg = useColorModeValue('#F7F9FC', '#232b4d');

  const validate = (): boolean => {
    let valid = true;
    setOrganizerNameError('');
    setFirstNameError('');
    setLastNameError('');

    if (!organizerName.trim()) {
      setOrganizerNameError('Organizer name is required');
      valid = false;
    } else if (organizerName.trim().length < 2) {
      setOrganizerNameError('Organizer name must be at least 2 characters');
      valid = false;
    }

    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      valid = false;
    }

    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload = {
        organizerName: organizerName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: googleEmail,
        providerTokenId: externalUserId,
        provider: 'Google',
      };

      const res = await HttpClient.post('/api/organizer/public/external-signup', payload);
      const resData = res.data;

      if (resData?.success) {
        toast({
          status: 'success',
          title: 'Account Created!',
          description: resData.message || 'Your account has been created. Please sign in.',
          position: 'top-right',
          duration: 4000,
        });
        // Redirect to sign-in after success
        setTimeout(() => navigate('/auth/sign-in/custom'), 2000);
      } else {
        toast({
          status: 'error',
          description: resData?.message || 'Failed to create account. Please try again.',
          position: 'top-right',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        status: 'error',
        title: 'Failed to Create Account',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'An error occurred. Please try again.',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      background="linear-gradient(135deg, #6246afff 0%, #7349e8ff 35%, #2563EA 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={{ base: 4, md: 8 }}
      py={8}
    >
      <Box
        maxW={{ base: '100%', md: '560px' }}
        w="100%"
        bg={bgColor}
        p={{ base: 6, md: 8 }}
        borderRadius="20px"
        boxShadow="0px 18px 40px rgba(112, 144, 176, 0.12)"
        border={`1px solid ${borderColor}`}
      >
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <Image
              src={logo}
              alt="Ideali Logo"
              w={{ base: '100px', md: '151px' }}
              h="auto"
              display="block"
              mx="auto"
              mb={2}
            />
            <Text color={textColorSecondary} fontWeight="400" fontSize="sm">
              Complete your profile to finish signing up with Google
            </Text>

            {/* Google badge */}
            <Flex align="center" justify="center" mt={3} gap={2}>
              <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <Badge colorScheme="purple" borderRadius="full" px={3} fontSize="xs">
                Signing up with Google
              </Badge>
            </Flex>
          </Box>

          {/* Form */}
          <VStack spacing={5} align="stretch">
            {/* Organizer Info */}
            <Box>
              <Text fontSize="15px" fontWeight="700" color={sectionColor} mb={3}>
                Organizer Info
              </Text>
              <FormControl isInvalid={!!organizerNameError}>
                <FormLabel fontSize="sm" fontWeight="500" color={textColor} mb="8px">
                  Organizer Name<Text as="span" color={brandStars}>*</Text>
                </FormLabel>
                <Input
                  placeholder="Company XYZ"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value.replace(/[^A-Za-z ]/g, ''))}
                  maxLength={50}
                  fontSize="sm"
                  fontWeight="500"
                  h="44px"
                  borderRadius="16px"
                  border="1px solid"
                  borderColor={borderColor}
                  bg={useColorModeValue('#FFFFFF', '#1B254B')}
                  disabled={isLoading}
                />
                {organizerNameError && (
                  <Text fontSize="sm" color="red.500" mt={1}>{organizerNameError}</Text>
                )}
              </FormControl>
            </Box>

            {/* Account Info — email pre-filled & locked */}
            <Box>
              <Text fontSize="15px" fontWeight="700" color={sectionColor} mb={3}>
                Account Info
              </Text>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500" color={textColor} mb="8px">
                  Email Address
                  <Badge ml={2} colorScheme="blue" fontSize="10px" borderRadius="full">
                    From Google
                  </Badge>
                </FormLabel>
                <Input
                  type="email"
                  value={googleEmail}
                  isReadOnly
                  fontSize="sm"
                  fontWeight="500"
                  h="44px"
                  borderRadius="16px"
                  border="1px solid"
                  borderColor={borderColor}
                  bg={disabledBg}
                  color={textColorSecondary}
                  _readOnly={{ cursor: 'not-allowed', opacity: 0.8 }}
                />
              </FormControl>
            </Box>

            {/* Contact Detail */}
            <Box>
              <Text fontSize="15px" fontWeight="700" color={sectionColor} mb={3}>
                Contact Detail
              </Text>
              <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
                <FormControl flex={1} isInvalid={!!firstNameError}>
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor} mb="8px">
                    First Name
                  </FormLabel>
                  <Input
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value.replace(/[^A-Za-z ]/g, ''))}
                    isReadOnly={!!defaultFirstName}
                    maxLength={20}
                    fontSize="sm"
                    fontWeight="500"
                    h="44px"
                    borderRadius="16px"
                    border="1px solid"
                    borderColor={borderColor}
                    bg={defaultFirstName ? disabledBg : bgColor}
                    color={defaultFirstName ? textColorSecondary : undefined}
                    _readOnly={{ cursor: 'not-allowed', opacity: 0.8 }}
                    disabled={isLoading}
                  />
                  {firstNameError && (
                    <Text fontSize="sm" color="red.500" mt={1}>{firstNameError}</Text>
                  )}
                </FormControl>

                <FormControl flex={1} isInvalid={!!lastNameError}>
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor} mb="8px">
                    Last Name
                  </FormLabel>
                  <Input
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value.replace(/[^A-Za-z ]/g, ''))}
                    isReadOnly={!!defaultLastName}
                    maxLength={20}
                    fontSize="sm"
                    fontWeight="500"
                    h="44px"
                    borderRadius="16px"
                    border="1px solid"
                    borderColor={borderColor}
                    bg={defaultLastName ? disabledBg : bgColor}
                    color={defaultLastName ? textColorSecondary : undefined}
                    _readOnly={{ cursor: 'not-allowed', opacity: 0.8 }}
                    disabled={isLoading}
                  />
                  {lastNameError && (
                    <Text fontSize="sm" color="red.500" mt={1}>{lastNameError}</Text>
                  )}
                </FormControl>
              </Flex>
            </Box>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              h="50px"
              fontSize="sm"
              fontWeight="500"
              borderRadius="16px"
              bg={useColorModeValue('#4318FF', '#7551FF')}
              color="white"
              _hover={{ bg: useColorModeValue('#3311EE', '#6644FF') }}
              isLoading={isLoading}
              loadingText="Creating Account..."
              disabled={isLoading}
              leftIcon={isLoading ? <Spinner size="sm" /> : undefined}
              mt={2}
            >
              Create Account
            </Button>

            <Text textAlign="center" fontSize="sm" color="gray.500">
              Already have an account?{' '}
              <Link to="/auth/sign-in/custom" style={{ color: '#805AD5', fontWeight: '600' }}>
                Sign In
              </Link>
            </Text>
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
}
