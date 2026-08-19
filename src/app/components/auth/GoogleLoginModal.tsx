import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Box,
  Button,
  Flex,
  Image,
  Text,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import { useGoogleLogin } from '@react-oauth/google';
import logo from '../../../assets/img/logo/idealiLogo.svg';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

// SVG Google "G" icon
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const bgColor = useColorModeValue('white', '#1B254B');
  const headingColor = useColorModeValue('#1B2559', '#FFFFFF');
  const subtitleColor = useColorModeValue('#A3AED0', '#A3AED0');
  const borderColor = useColorModeValue('#E0E5F2', '#2D3748');
  const cardBorder = useColorModeValue('#E0E5F2', '#2D3748');

  const login = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      setError('');
      try {
        // Send the authorization code to your backend for token exchange.
        // The backend should:
        //   1. Exchange the code for tokens via Google's token endpoint.
        //   2. Verify the id_token.
        //   3. Return the same session payload as /api/identity/account/authenticate.
        //
        // Replace the endpoint below with your actual backend route.
        const { default: HttpClient } = await import('../../service/httpClient/HttpClient');
        const response = await HttpClient.post(
          '/api/identity/account/google-authenticate',
          { code: codeResponse.code },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response?.data?.success) {
          onSuccess(response.data);
          onClose();
        } else {
          setError(response?.data?.message || 'Google sign-in failed. Please try again.');
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Google sign-in failed. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google Login Error:', errorResponse);
      setError('Google sign-in was cancelled or failed. Please try again.');
    },
  });

  const handleGoogleLogin = () => {
    setError('');
    login();
  };

  const handleClose = () => {
    if (!isLoading) {
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      size="sm"
      closeOnOverlayClick={!isLoading}
      closeOnEsc={!isLoading}
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent
        bg={bgColor}
        borderRadius="20px"
        boxShadow="0px 18px 40px rgba(112, 144, 176, 0.20)"
        border={`1px solid ${cardBorder}`}
        mx={4}
      >
        {!isLoading && <ModalCloseButton color={subtitleColor} top={4} right={4} />}
        <ModalBody p={8}>
          {/* Logo */}
          <Flex justify="center" mb={5}>
            <Image
              src={logo}
              alt="Ideali Logo"
              w={{ base: '130px', md: '160px' }}
              h="auto"
            />
          </Flex>

          {/* Google Icon Badge */}
          <Flex justify="center" mb={4}>
            <Flex
              w="56px"
              h="56px"
              borderRadius="full"
              bg={useColorModeValue('gray.100', 'gray.700')}
              align="center"
              justify="center"
              border={`1px solid ${borderColor}`}
            >
              <GoogleIcon />
            </Flex>
          </Flex>

          {/* Heading */}
          <Text
            fontSize={{ base: 'xl', md: '2xl' }}
            fontWeight="bold"
            color={headingColor}
            textAlign="center"
            mb={2}
          >
            Sign in with Google
          </Text>

          {/* Subtitle */}
          <Text
            fontSize="sm"
            color={subtitleColor}
            textAlign="center"
            mb={7}
            lineHeight="tall"
          >
            Click below to sign in using your Google account.
            <br />
            If you're already logged in, your account will appear automatically.
          </Text>

          {/* Error Message */}
          {error && (
            <Box
              bg={useColorModeValue('red.50', 'red.900')}
              border="1px solid"
              borderColor="red.300"
              borderRadius="12px"
              p={3}
              mb={5}
            >
              <Text fontSize="sm" color="red.500" textAlign="center">
                {error}
              </Text>
            </Box>
          )}

          {/* Google Sign-In Button */}
          <Button
            w="100%"
            h="50px"
            fontSize="sm"
            fontWeight="600"
            borderRadius="16px"
            bg={useColorModeValue('white', 'gray.700')}
            color={headingColor}
            border="1px solid"
            borderColor={borderColor}
            leftIcon={isLoading ? undefined : <GoogleIcon />}
            onClick={handleGoogleLogin}
            isDisabled={isLoading}
            _hover={{
              bg: useColorModeValue('gray.50', 'gray.600'),
              borderColor: '#4285F4',
              boxShadow: '0 0 0 1px #4285F4',
            }}
            _active={{ bg: useColorModeValue('gray.100', 'gray.500') }}
            mb={3}
          >
            {isLoading ? (
              <Flex align="center" gap={2}>
                <Spinner size="sm" color="#4285F4" />
                <Text>Signing in...</Text>
              </Flex>
            ) : (
              'Continue with Google'
            )}
          </Button>

          {/* Cancel */}
          {!isLoading && (
            <Button
              w="100%"
              h="44px"
              fontSize="sm"
              fontWeight="500"
              borderRadius="16px"
              variant="ghost"
              color={subtitleColor}
              onClick={handleClose}
              _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
            >
              Cancel
            </Button>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GoogleLoginModal;
