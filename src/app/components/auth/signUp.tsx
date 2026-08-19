import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Image } from "@chakra-ui/react";
import { Button,Flex,FormControl,FormLabel,Input,InputGroup,InputRightElement,Select,Text,useColorModeValue,useToast,Box,VStack,Icon,HStack,
} from '@chakra-ui/react';
import { useGoogleLogin } from '@react-oauth/google';
import HttpClient from '../../service/httpClient/HttpClient';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiEyeCloseLine } from 'react-icons/ri';
import { timeZoneResponseDto } from '../../interface/CommonInter/timeZoneResponseDto';
import CommonMethod from 'app/service/helpers/commonMethod';
import TimeZoneService from '../../service/helpers/TimezoneService';
import signUpService, { SignUpRequestDto } from '../../service/auth/signUpService';
import EmailConfirmationModal from './EmailConfirmationModal';
import { SignUpData } from 'app/service/auth/signUpService';
import AddressInfoFields from '../auth/addressInfofields';
import logo from "../../../assets/img/logo/idealiLogo.svg"; 

export default function SignUp() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGooglePrefilled, setIsGooglePrefilled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [timeZoneOptionData, setTimeZoneOptionData] = useState<timeZoneResponseDto | null>(null);

  // Error states
  const [organizerNameError, setOrganizerNameError] = useState('');
  const [timeZoneIdError, setTimeZoneIdError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [streetLine1Error, setStreetLine1Error] = useState('');
  const [streetLine2Error, setStreetLine2Error] = useState('');
  const [zipCodeError, setZipCodeError] = useState('');
  const [countryIdError, setCountryIdError] = useState('');
  const [stateIdError, setStateIdError] = useState('');
  const [cityError, setCityError] = useState('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const [signUpData, setSignUpData] = useState<SignUpData>({
    organizerInfo: {
      organizerName: '',
      shortName: '',
      timeZoneId: 0,
    },
    userInfo: {
      email: '',
      password: '',
    },
    contactDetail: {
      firstName: '',
      lastName: '',
      primaryEmail: '',
      cellPhone: '',
    },
    addressInfo: {
      streetLine1: '',
      streetLine2: '',
      zipCode: '',
      countryId: 0,
      stateId: 0,
      city: '',
    },
  });

  // Color mode values matching SignIn
  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const textColorSecondary = '#A3AED0';
  const textColorBrand = useColorModeValue('#044bd9', '#FFFFFF');
  const brandStars = useColorModeValue('#4318FF', '#044bd9');
  const bgColor = useColorModeValue('#FFFFFF', '#1B254B');
  const borderColor = useColorModeValue('#E0E5F2', '#2D3748');

  useEffect(() => {
    GetTimeZoneOption();
  }, []);

const handleChange = (section: keyof SignUpData, field: string, value: string | number) => {
  setSignUpData(prev => ({
    ...prev,
    [section]: {
      ...prev[section],
      [field]: value
    }
  }));
};

const handleAddressChange = (field: string, value: string | number) => {
  handleChange('addressInfo', field, value);
};


  const GetTimeZoneOption = async () => {
    try {
      const data = await TimeZoneService.fetchTimeZones();
      setTimeZoneOptionData(data);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: CommonMethod.ErrorMessage(error), 
        status: 'error', 
        position: "top-right" 
      });
    }
  };

  const handleSubmit = async () => {
    let valid = true;
    setOrganizerNameError('');
    setTimeZoneIdError('');
    setEmailError('');
    setPasswordError('');
    setFirstNameError('');
    setLastNameError('');
    setPhoneNumberError('');
    setStreetLine1Error('');
    setStreetLine2Error('');
    setZipCodeError('');
    setCountryIdError('');
    setStateIdError('');
    setCityError('');

const organizerError = CommonMethod.ValidateOrganizerName(signUpData.organizerInfo.organizerName);
  if (organizerError) {
    setOrganizerNameError(organizerError);
    valid = false;
  }

    if (!signUpData.organizerInfo.timeZoneId) {
  setTimeZoneIdError('Please Select Time Zone');
  valid = false;
}

  const emailValidation = CommonMethod.ValidateEmail(signUpData.userInfo.email);
if (emailValidation) {
  setEmailError(emailValidation);
  valid = false;
}

    if (!signUpData.userInfo.password) {
      setPasswordError('Please Enter Password');
      valid = false;
    } else if (!CommonMethod.PasswordValidation(signUpData.userInfo.password)) {
      setPasswordError('Password must be 8-20 chars with a number and special character');
      valid = false;
    }

  const firstNameValidation = CommonMethod.ValidateName(signUpData.contactDetail.firstName, 'First Name');
if (firstNameValidation) {
  setFirstNameError(firstNameValidation);
  valid = false;
}

const lastNameValidation = CommonMethod.ValidateName(signUpData.contactDetail.lastName, 'Last Name');
if (lastNameValidation) {
  setLastNameError(lastNameValidation);
  valid = false;
}

const phoneValidation = CommonMethod.ValidatePhone(signUpData.contactDetail.cellPhone);
if (phoneValidation) {
  setPhoneNumberError(phoneValidation);
  valid = false;
}


  const street1Validation = CommonMethod.ValidateStreet(signUpData.addressInfo.streetLine1, 'Address Line 1');
if (street1Validation) {
  setStreetLine1Error(street1Validation);
  valid = false;
}



const zipValidation = CommonMethod.ValidateZipCode(signUpData.addressInfo.zipCode);
if (zipValidation) {
  setZipCodeError(zipValidation);
  valid = false;
}

const cityValidation = CommonMethod.ValidateCity(signUpData.addressInfo.city);
if (cityValidation) {
  setCityError(cityValidation);
  valid = false;
} else {
  setCityError('');
}



    if (!valid) {
      return;
    }

    // If all valid, submit
    try {
      setLoading(true);

      const requestData: SignUpRequestDto = {
        organizer: {
          name: signUpData.organizerInfo.organizerName,
          shortName: null, 
          timezoneId: signUpData.organizerInfo.timeZoneId,
        },
        user: {
          emailAddress: signUpData.userInfo.email,
          password: signUpData.userInfo.password,
        },
        contact: {
          firstName: signUpData.contactDetail.firstName,
          lastName: signUpData.contactDetail.lastName,
          primaryEmail: null, 
          cellPhone: signUpData.contactDetail.cellPhone,
        },
        address: {
  streetLine1: signUpData.addressInfo.streetLine1.trim(),
  streetLine2: signUpData.addressInfo.streetLine2.trim() || null,
  zipCode: signUpData.addressInfo.zipCode.trim(),
  countryId: signUpData.addressInfo.countryId || null,
  stateId: signUpData.addressInfo.stateId || null,
  city: signUpData.addressInfo.city.trim() || null,
},

      };

      const response = await signUpService.signUp(requestData);

      toast({
        status: "success",
        title: "Account Created Successfully",
        description: response.message || "Please sign in to continue",
        position: "top-right",
      });
      
      setIsEmailModalOpen(true);
    } catch (error: any) {
      console.error("Sign-up error:", error);

      toast({
        status: "error",
        title: "Failed to Create Account",
        description: error.message || "An error occurred during sign-up",
        position: "top-right",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailModalClose = () => {
    setIsEmailModalOpen(false);
    navigate('/auth/sign-in/custom');
  };

  // Google OAuth — implicit/token flow (popup, no redirect URI needed)
  const googleSignUp = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        // Populate email
        if (userInfo.email) {
          handleChange('userInfo', 'email', userInfo.email);
        }
        // Populate organizer name (sanitize to letters + spaces only)
        if (userInfo.name) {
          const sanitized = userInfo.name.replace(/[^A-Za-z ]/g, '');
          handleChange('organizerInfo', 'organizerName', sanitized);
        }
        setIsGooglePrefilled(true);
      } catch (err: any) {
        toast({
          description: err?.message || 'Failed to retrieve Google profile.',
          status: 'error',
          duration: 4000,
          isClosable: true,
          position: 'top-right',
        });
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      toast({
        description: 'Google sign-up was cancelled or failed. Please try again.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    },
  });

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
        maxW={{ base: '100%', md: '700px' }}
        w="100%"
        bg={bgColor}
        p={{ base: 6, md: 8 }}
        borderRadius="20px"
        boxShadow="0px 18px 40px rgba(112, 144, 176, 0.12)"
        border={`1px solid ${borderColor}`}
      >
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <Box textAlign="center" mb={2}>
            <Image
              src={logo}
              alt="Ideali Logo"
              w={{ base: "100px", md: "151px" }}
              h="auto"
              display="block"
              mx="auto"
              mb={2}
            />
            <Text
              color={textColorSecondary}
              fontWeight="400"
              fontSize="sm"
            >
              Create your account to get started!
            </Text>
          </Box>

          {/* Form */}
          <VStack spacing={4} align="stretch">
            {/* Organizer Info Section */}
            <Box>
              <Text
                fontSize="17px"
                fontWeight="700"
                color={useColorModeValue('#2563EA', '#7551FF')}
                mb={3}
              >
                Organizer Info
              </Text>
              
              <VStack spacing={4}>
                <FormControl isInvalid={!!organizerNameError}>
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor} mb="8px">
                    Organizer Name<Text as="span" color={brandStars}>*</Text>
                  </FormLabel>
                  <Input
                    placeholder="Company XYZ"
                    maxLength={50}
                    value={signUpData.organizerInfo.organizerName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const value = e.target.value.replace(/[^A-Za-z ]/g, ''); 
                                handleChange('organizerInfo', 'organizerName', value);
                              }}
                    fontSize="sm"
                    fontWeight="500"
                    h="44px"
                    borderRadius="16px"
                    border="1px solid"
                    borderColor={borderColor}
                    bg={useColorModeValue(isGooglePrefilled ? '#F7F9FC' : '#FFFFFF', '#1B254B')}
                    disabled={loading || isGooglePrefilled}
                    _disabled={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                  {organizerNameError && (
                    <Text fontSize="sm" color="red.500" mt={1}>{organizerNameError}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!timeZoneIdError}>
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor} mb="8px">
                    Time Zone<Text as="span" color={brandStars}>*</Text>
                  </FormLabel>
                  <Select
                    placeholder="Please choose an option"
                    value={signUpData.organizerInfo.timeZoneId}
                    onChange={(e) => handleChange('organizerInfo', 'timeZoneId', Number(e.target.value))}
                    fontSize="sm"
                    fontWeight="500"
                    h="44px"
                    borderRadius="16px"
                    border="1px solid"
                    borderColor={borderColor}
                    bg={useColorModeValue('#FFFFFF', '#1B254B')}
                    disabled={loading}
                  >
                    {timeZoneOptionData?.data?.map(timeZoneOption => (
                      <option 
                        key={timeZoneOption.id} 
                        value={timeZoneOption.id}
                      >
                        {TimeZoneService.formatTimeZoneLabel(timeZoneOption.displayName)}
                      </option>
                    ))}
                  </Select>
                  {timeZoneIdError && (
                    <Text fontSize="sm" color="red.500" mt={1}>{timeZoneIdError}</Text>
                  )}
                </FormControl>
              </VStack>
            </Box>

            {/* User Info Section */}
            <Box>
              <Text
                fontSize="17px"
                fontWeight="700"
                color={useColorModeValue('#2563EA', '#7551FF')}
                mb={3}
              >
                User Info
              </Text>

              <VStack spacing={4}>
                <FormControl isInvalid={!!emailError}>
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor} mb="8px">
                    Email Address<Text as="span" color={brandStars}>*</Text>
                  </FormLabel>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={signUpData.userInfo.email}
                    onChange={(e) => handleChange('userInfo', 'email', e.target.value)}
                    fontSize="sm"
                    fontWeight="500"
                    h="44px"
                    borderRadius="16px"
                    border="1px solid"
                    borderColor={borderColor}
                    bg={useColorModeValue(isGooglePrefilled ? '#F7F9FC' : '#FFFFFF', '#1B254B')}
                    disabled={loading || isGooglePrefilled}
                    _disabled={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                  {emailError && (
                    <Text fontSize="sm" color="red.500" mt={1}>{emailError}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!passwordError}>
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor} mb="8px">
                    Password<Text as="span" color={brandStars}>*</Text>
                  </FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={signUpData.userInfo.password}
                      onChange={(e) => handleChange('userInfo', 'password', e.target.value)}
                      fontSize="sm"
                      fontWeight="500"
                      h="44px"
                      borderRadius="16px"
                      border="1px solid"
                      borderColor={borderColor}
                      bg={useColorModeValue('#FFFFFF', '#1B254B')}
                      disabled={loading}
                    />
                    <InputRightElement h="44px" pr="16px">
                      <Icon
                        color={textColorSecondary}
                        _hover={{
                          cursor: 'pointer',
                          color: useColorModeValue('#4318FF', '#7551FF')
                        }}
                        as={showPassword ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                        onClick={() => setShowPassword(!showPassword)}
                        w="20px"
                        h="20px"
                      />
                    </InputRightElement>
                  </InputGroup>
                  {passwordError && (
                    <Text fontSize="sm" color="red.500" mt={1}>{passwordError}</Text>
                  )}
                </FormControl>
              </VStack>
            </Box>

            {/* Contact Detail Section */}
            <Box>
              <Text
                fontSize="17px"
                fontWeight="700"
                color={useColorModeValue('#2563EA', '#7551FF')}
                mb={3}
              >
                Contact Detail
              </Text>

              <VStack spacing={4}>
                <Flex gap={4} w="100%" direction={{ base: 'column', md: 'row' }}>
                  <FormControl flex={1} isInvalid={!!firstNameError}>
                    <FormLabel fontSize="sm" fontWeight="500" color={textColor} mb="8px">
                      First Name<Text as="span" color={brandStars}>*</Text>
                    </FormLabel>
                    <Input
                      placeholder="John"
                      value={signUpData.contactDetail.firstName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value.replace(/[^A-Za-z ]/g, ''); 
                      handleChange('contactDetail', 'firstName', value);
                    }}
                      maxLength={20}
                      fontSize="sm"
                      fontWeight="500"
                      h="44px"
                      borderRadius="16px"
                      border="1px solid"
                      borderColor={borderColor}
                      bg={useColorModeValue('#FFFFFF', '#1B254B')}
                      disabled={loading}
                    />
                    {firstNameError && (
                      <Text fontSize="sm" color="red.500" mt={1}>{firstNameError}</Text>
                    )}
                  </FormControl>

                  <FormControl flex={1} isInvalid={!!lastNameError}>
                    <FormLabel fontSize="sm" fontWeight="500" color={textColor} mb="8px">
                      Last Name<Text as="span" color={brandStars}>*</Text>
                    </FormLabel>
                    <Input
                      placeholder="Doe"
                      value={signUpData.contactDetail.lastName}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value.replace(/[^A-Za-z ]/g, '');
                      handleChange('contactDetail', 'lastName', value);
                    }}
                    maxLength={20}
                      fontSize="sm"
                      fontWeight="500"
                      h="44px"
                      borderRadius="16px"
                      border="1px solid"
                      borderColor={borderColor}
                      bg={useColorModeValue('#FFFFFF', '#1B254B')}
                      disabled={loading}
                    />
                    {lastNameError && (
                      <Text fontSize="sm" color="red.500" mt={1}>{lastNameError}</Text>
                    )}
                  </FormControl>
                </Flex>

                <FormControl isInvalid={!!phoneNumberError}>
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor} mb="8px">
                    Phone Number<Text as="span" color={brandStars}>*</Text>
                  </FormLabel>
                  <Input
                    placeholder="+15551234567"
                    maxLength={15}
                    value={signUpData.contactDetail.cellPhone}
                    onChange={(e) => {
                      const value = CommonMethod.SanitizePhoneInput(e.target.value);
                      handleChange('contactDetail', 'cellPhone', value);
                    }}
                    onKeyDown={(e) => CommonMethod.HandlePhoneKeyDown(e)}
                    onPaste={(e) => {
                      const newValue = CommonMethod.HandlePhonePaste(e, signUpData.contactDetail.cellPhone);
                      handleChange('contactDetail', 'cellPhone', newValue);
                    }}
                    fontSize="sm"
                    fontWeight="500"
                    h="44px"
                    borderRadius="16px"
                    border="1px solid"
                    borderColor={borderColor}
                    bg={useColorModeValue('#FFFFFF', '#1B254B')}
                    disabled={loading}
                  />
                  {phoneNumberError && (
                    <Text fontSize="sm" color="red.500" mt={1}>{phoneNumberError}</Text>
                  )}
                </FormControl>
              </VStack>
            </Box>

            {/* Address Info Section - Using the new component */}
            <AddressInfoFields
              countryId={signUpData.addressInfo.countryId}
              stateId={signUpData.addressInfo.stateId}
              city={signUpData.addressInfo.city}
              streetLine1={signUpData.addressInfo.streetLine1}
              streetLine2={signUpData.addressInfo.streetLine2}
              zipCode={signUpData.addressInfo.zipCode}
              streetLine1Error={streetLine1Error}
              streetLine2Error={streetLine2Error}
              zipCodeError={zipCodeError}
              onChange={handleAddressChange}
              cityError={cityError}
              loading={loading}
            />

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              h="44px"
              fontSize="sm"
              fontWeight="500"
              borderRadius="16px"
              bg={useColorModeValue('#4318FF', '#7551FF')}
              color="white"
              _hover={{
                bg: useColorModeValue('#4318FF', '#6644FF'),
              }}
              isLoading={loading}
              loadingText="Creating Account..."
              disabled={loading}
            >
              Submit to Sign Up 
            </Button>

            {/* Sign In Link */}
            <Text textAlign="center" fontSize="sm" color="gray.600">
              Already have an account?{' '}
              <Link to="/auth/sign-in/custom" style={{ color: '#805AD5', fontWeight: '600' }}>
                Sign In
              </Link>
            </Text>

            {/* Divider
            <HStack my={1}>
              <Box flex={1} h="1px" bg={borderColor} />
              <Text fontSize="xs" color={textColorSecondary} px={2} whiteSpace="nowrap">
                or continue with
              </Text>
              <Box flex={1} h="1px" bg={borderColor} />
            </HStack> */}

            {/* Google Sign Up Button */}
            {/* <Button
              onClick={() => googleSignUp()}
              h="50px"
              fontSize="sm"
              fontWeight="600"
              borderRadius="16px"
              bg={useColorModeValue('white', '#1B254B')}
              color={textColor}
              border="1px solid"
              borderColor={borderColor}
              isLoading={isGoogleLoading}
              loadingText="Loading..."
              leftIcon={
                isGoogleLoading ? undefined :
                <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
              }
              _hover={{
                bg: useColorModeValue('gray.50', '#262f49'),
                borderColor: '#4285F4',
                boxShadow: '0 0 0 1px #4285F4',
              }}
            >
              Sign up with Google
            </Button> */}
          </VStack>
        </VStack>
      </Box>

      <EmailConfirmationModal
        isOpen={isEmailModalOpen}
        onClose={handleEmailModalClose}
        email={signUpData.userInfo.email}
      />
    </Box>
  );
}