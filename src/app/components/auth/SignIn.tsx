import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Image } from "@chakra-ui/react";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  useToast,
  Spinner,
} from '@chakra-ui/react';

import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiEyeCloseLine } from 'react-icons/ri';
import HttpClient from '../../service/httpClient/HttpClient';
import { campaignFromReturnPath, fundraiserJoinPath, sanitiseReturnPath } from 'app/utils/returnPath';
import {
  LoginResponse,
  completeLogin as establishSession,
  completeTwoFactorLogin,
} from './completeLogin';
import CampaignContextBanner from 'app/components/organizer/donation/peerToPeer/join/CampaignContextBanner';
import logo from "../../../assets/img/logo/idealiLogo.svg";
import TwoFactorAuthModal from './TwoFactorAuthModal';
import signUpService from '../../service/auth/signUpService';
import { isGoogleAuthEnabled } from '../../../utils/env';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  // Where this sign-in came from, when it came from somewhere. Validated on read, and again before
  // it is navigated to, because it arrives in the address bar.
  const returnPath = sanitiseReturnPath(new URLSearchParams(location.search).get('returnPath'));
  const returnCampaignUniqueId = campaignFromReturnPath(returnPath);

  // useEffect(() => {
  //   localStorage.clear();
  // }, []); // empty dependency array = run once on mount

  const [show, setShow] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [show2FA, setShow2FA] = React.useState(false);
  const [twoFaToken, setTwoFaToken] = React.useState('');
  const [isVerifying2FA, setIsVerifying2FA] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const toast = useToast();

  // Pre-populate email from URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location.search]);
  const handleClick = () => setShow(!show);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      SignInUser();
    }
  };

  const SignInUser = async () => {
    // Close any existing toasts when starting sign-in
    try {
      toast.closeAll();
    } catch (e) {
      // ignore if closeAll is not available in this environment
    }

    // Basic validation

    if (!email || !password) {
      toast({
        // title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        // title: 'Invalid Email',
        description: 'Please enter a valid email address',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData as per API requirement
      const formData = new FormData();
      formData.append('userName', email);
      formData.append('password', password);

      const response = await HttpClient.post('/api/identity/account/authenticate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response received:', response);

      // Check if authentication was successful
      if (response != null && response.data != null && response.status == 200 && response.data.success) {

        // Check if 2FA is required
        if (response.data.data.requiresTwoFactor) {
          setTwoFaToken(response.data.data.twoFaToken);
          setShow2FA(true);
          return;
        }

        // Complete login (no 2FA required)
        completeLogin(response.data, 'ideali');
      } else {
        toast({
          // title: 'Authentication Failed',
          description: response.data.message || 'Please check your credentials',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
      }

    } catch (error: any) {
      console.error('Authentication error:', error);
      console.log('Error details:', {
        message: error.message,
        code: error.code,
        request: error.request,
        response: error.response,
        config: error.config
      });

      let errorMessage = 'An error occurred during authentication';

      // Type guard to check if it's an Axios error
      if (typeof error === 'object' && error !== null) {
        if ('response' in error && error.response) {
          // Server responded with error status
          console.log('Server response error:', error.response);
          console.log('Response status:', error.response.status);
          console.log('Response data:', error.response.data);
          console.log('Response headers:', error.response.headers);
          errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        } else if ('request' in error && error.request) {
          // Request made but no response received
          console.log('No response received:', error.request);
          console.log('This could be a CORS, SSL certificate, or network connectivity issue');
          errorMessage = `Network error: ${error.message || 'No response from server. This could be due to CORS, SSL certificate, or connectivity issues.'}`;
        } else if ('message' in error && typeof error.message === 'string') {
          // Something else happened
          console.log('Other error:', error.message);
          errorMessage = error.message;
        }

        // Check for SSL/Certificate errors
        if (error.code === 'ERR_CERT_AUTHORITY_INVALID' || error.code === 'CERT_HAS_EXPIRED') {
          console.error('SSL Certificate Error detected!');
          errorMessage = 'SSL Certificate Error: The server certificate cannot be validated. Please contact your administrator.';
        }
      }

      toast({
        // title: 'Authentication Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = (responseData: LoginResponse, provider: string = 'ideali') =>
    establishSession(responseData, provider, returnPath);

  const handle2FAVerify = async (code: string) => {
    setIsVerifying2FA(true);
    let succeeded = false;
    try {
      const response = await signUpService.verify2FA(twoFaToken, code);
      if (response.success) {
        succeeded = true;
        // Keep modal open and in loading state until redirect fires
        completeTwoFactorLogin(response, returnPath);
      } else {
        throw new Error(response.message || 'Invalid verification code. Please try again.');
      }
    } catch (error: any) {
      throw error;
    } finally {
      if (!succeeded) {
        setIsVerifying2FA(false);
      }
    }
  };

  const handleBackToSignIn = () => {
    setShow2FA(false);
    setTwoFaToken('');
  };

  const handleGoogleSuccess = async (tokenResponse: { access_token: string }) => {
      setIsGoogleLoading(true);
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        }).then(r => r.json());

        console.log('userInfo', userInfo);

        const formData = new FormData();
        formData.append('externalUserId', userInfo.sub);

        const res = await HttpClient.post('/api/identity/account/authenticate/external-login/google',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );

        const resData = res.data;
        console.log('Google login response:', resData);

        // Case 1: New user — needs to complete organizer info
        if (resData?.data?.requiresOrganizerInfo) {
          navigate('/auth/sign-up/external', {
            state: {
              email: userInfo.email,
              name: userInfo.name,
              externalUserId: userInfo.sub,
            }
          });
          return;
        }

        // Case 2: Existing user — JWT token received, run normal login flow
        if (resData?.data?.accessToken) {
          const d = resData.data;
          // The Google external-login endpoint returns nested userDetail/organizerDetail.
          // Normalize to the flat shape that completeLogin() expects.
          const normalized = {
            ...resData,
            data: {
              ...d,
              accessToken: d.accessToken,
              refreshToken: d.refreshToken ?? d.userDetail?.refreshToken ?? '',
              userId: d.userId ?? d.userDetail?.userId,
              organizerId: d.organizerId ?? d.organizerDetail?.organizerId,
              userEmail: d.userEmail ?? d.userDetail?.email,
              userName: d.userName ?? d.userDetail?.name,
              userOrg: d.userOrg ?? d.organizerDetail?.name,
              roleValue: d.roleValue ?? d.userDetail?.roles?.[0],
              organizerDetail: d.organizerDetail,
            },
          };
          console.log('[Google Login] Normalized data:', normalized.data);
          completeLogin(normalized, 'google');
          return;
        }

        // Fallback: unexpected response
        toast({
          description: resData?.message || 'Google sign-in failed. Please try again.',
          status: 'error',
          duration: 4000,
          isClosable: true,
          position: 'top-right',
        });
      } catch (error: any) {
        console.error('Google login error:', error);
        toast({
          description: error?.response?.data?.message || 'Google sign-in failed. Please try again.',
          status: 'error',
          duration: 4000,
          isClosable: true,
          position: 'top-right',
        });
      } finally {
        setIsGoogleLoading(false);
      }
  };

  const handleGoogleError = () => {
    setIsGoogleLoading(false);
    toast({
      description: 'Google sign-in was cancelled or failed.',
      status: 'error',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
  };


  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const textColorSecondary = '#A3AED0';
  const textColorBrand = useColorModeValue('#044bd9', '#FFFFFF');
  const brandStars = useColorModeValue('#4318FF', '#044bd9');
  const bgColor = useColorModeValue('#FFFFFF', '#1B254B');
  const borderColor = useColorModeValue('#E0E5F2', '#2D3748');

  return (
    <Box
      minH="100vh"
      background="linear-gradient(135deg, #6246afff 0%, #7349e8ff 35%, #2563EA 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={{ base: 4, md: 8 }}
    >
      <Box
        maxW={{ base: '100%', md: '500px' }}
        w="100%"
        bg={bgColor}
        p={{ base: 6, md: 8 }}
        borderRadius="20px"
        boxShadow="0px 18px 40px rgba(112, 144, 176, 0.12)"
        border={`1px solid ${borderColor}`}
      >
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box textAlign="center" >
            <Image
              src={logo}
              alt="Ideali Logo"
              w={{ base: "160px", md: "250px" }}
              h="auto"
              display="block"
              mx="auto"
              mb="8px"
            />

            <Text
              color={textColorSecondary}
              fontWeight="400"
              fontSize="md"
              marginLeft={6}
            >
              Enter your email and password to sign in!
            </Text>
          </Box>

          <CampaignContextBanner campaignUniqueId={returnCampaignUniqueId} />

          {/* Form */}
          <VStack spacing={4} align="stretch">
            {/* Email Field */}
            <FormControl>
              <FormLabel
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="8px"
              >
                Email<Text as="span" color={brandStars}>*</Text>
              </FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="mail@example.com"
                fontSize="sm"
                fontWeight="500"
                h="50px"
                borderRadius="16px"
                border="1px solid"
                borderColor={borderColor}
                bg={useColorModeValue('#FFFFFF', '#1B254B')}
                disabled={isLoading}
              />
            </FormControl>

            {/* Password Field */}
            <FormControl>
              <FormLabel
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="8px"
              >
                Password<Text as="span" color={brandStars}>*</Text>
              </FormLabel>
              <InputGroup>
                <Input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Min. 8 characters"
                  fontSize="sm"
                  fontWeight="500"
                  h="50px"
                  borderRadius="16px"
                  border="1px solid"
                  borderColor={borderColor}
                  bg={useColorModeValue('#FFFFFF', '#1B254B')}
                  disabled={isLoading}
                />
                <InputRightElement h="50px" pr="16px">
                  <Icon
                    color={textColorSecondary}
                    _hover={{
                      cursor: 'pointer',
                      color: useColorModeValue('#4318FF', '#7551FF')
                    }}
                    as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                    onClick={handleClick}
                    w="20px"
                    h="20px"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {/* Forgot password */}
            <Flex justify="space-between" align="center">
              <Text
                color={textColorBrand}
                fontSize="sm"
                fontWeight="500"
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
                onClick={() => {
                  if (email) {
                    navigate("/auth/forgot-password/default", { state: { email } });
                  } else {
                    navigate("/auth/forgot-password/default");
                  }
                }}
              >
                Forgot password?
              </Text>
            </Flex>

            {/* Sign In Button */}
            <Button
              onClick={SignInUser}
              h="50px"
              fontSize="sm"
              fontWeight="500"
              borderRadius="16px"
              bg={useColorModeValue('#4318FF', '#7551FF')}
              color="white"
              _hover={{
                bg: useColorModeValue('#4318FF', '#6644FF'),
              }}
              disabled={isLoading}
              leftIcon={isLoading ? <Spinner size="sm" /> : undefined}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Two different accounts sit behind one prompt. Someone who arrived here to fundraise
                is offered the supporter form; the organiser form asks for an organisation name and
                provisions the account as an organiser, which is not what they came for. */}
            <Text textAlign="center" fontSize="sm" color="gray.600">
              Don't have an account?{' '}
              {returnCampaignUniqueId ? (
                <Link
                  to={fundraiserJoinPath(returnCampaignUniqueId)}
                  style={{ color: '#805AD5', fontWeight: '600' }}
                >
                  Create a supporter account
                </Link>
              ) : (
                <Link to="/auth/sign-up/default" style={{ color: '#805AD5', fontWeight: '600' }}>
                  Create new account
                </Link>
              )}
            </Text>

            {isGoogleAuthEnabled && (
              <>
                <HStack my={1}>
                  <Box flex={1} h="1px" bg={borderColor} />
                  <Text fontSize="xs" color={textColorSecondary} px={2} whiteSpace="nowrap">
                    or continue with
                  </Text>
                  <Box flex={1} h="1px" bg={borderColor} />
                </HStack>

                <GoogleSignInButton
                  label="Login with Google"
                  loadingText="Signing in..."
                  isLoading={isGoogleLoading}
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
              </>
            )}
          </VStack>
        </VStack>
      </Box>

      <TwoFactorAuthModal
        isOpen={show2FA}
        onClose={() => setShow2FA(false)}
        onVerify={handle2FAVerify}
        onBackToSignIn={handleBackToSignIn}
        isVerifying={isVerifying2FA}
      />

    </Box>
  );
}

export default SignIn;