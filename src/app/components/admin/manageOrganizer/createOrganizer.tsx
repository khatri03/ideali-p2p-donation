import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  SimpleGrid,
  Text,
  useColorModeValue,
  useToast,
  Box
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import Card from 'themeComponents/card/Card';
import HttpClient from '../../../service/httpClient/HttpClient';
import { organizerCategoriesResponseDto } from '../../../interface/organizerCategoriesInter/organizerCategoriesResponseDto';
import { moduleResponseDto } from '../../../interface/moduleInter/moduleResponseDto';
import { createOrganizerDto } from '../../../interface/organizerInter/createOrganizerDto';
import { timeZoneResponseDto } from '../../../interface/CommonInter/timeZoneResponseDto';
import CommonMethod from 'app/service/helpers/commonMethod';
import { BsRobot } from 'react-icons/bs';
import { CheckIcon, CloseIcon, SpinnerIcon } from '@chakra-ui/icons';
import adminService from '../../../service/admin/adminService';
import { isRealAdmin } from '../../../service/organizer/rolesPermissions/permissionsService';
import ImageUpload from 'app/components/common/ImageUpload';
import AddressInfoFields from '../../auth/addressInfofields';


export default function CreateOrganizer() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isRealAdmin()) {
      navigate('/auth/sign-in/custom');
      return;
    }
    
    // Fetch initial data in parallel
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          GetOrganizerCategories(),
          GetTimeZoneOption()
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    
    fetchInitialData();
  }, [navigate]);

  const textColorPrimary = useColorModeValue('secondaryGray.900', 'white');
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [timeZoneOptionData, setTimeZoneOptionData] = useState<timeZoneResponseDto | null>(null);
  const [organizeCategory, setOrganizeCategoryData] = useState<organizerCategoriesResponseDto | null>(null);

  const [organizerNameError, setOrganizerNameError] = useState('');
  const [shortNameError, setShortNameError] = useState('');
  const [categoryIdError, setCategoryIdError] = useState('');
  const [timeZoneIdError, setTimeZoneIdError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [prefixError, setPrefixError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [primaryEmailError, setPrimaryEmailError] = useState('');
  const [streetLine1Error, setStreetLine1Error] = useState('');
  const [streetLine2Error, setStreetLine2Error] = useState('');
  const [zipCodeError, setZipCodeError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Short name availability check state
  const [isCheckingShortName, setIsCheckingShortName] = useState(false);
  const [shortNameAvailable, setShortNameAvailable] = useState<boolean | null>(null);
  const shortNameCheckTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [createOrganizerDate, setCreateOrganizerData] = useState<createOrganizerDto>({
    organizerInfo: {
      organizerName: '',
      shortName: '',
      categoryId: 0,
      dateFormatId: 0,
      use24Hours: false,
      modules: [],
      paymentMerchants: [],
      timeZoneId: 0,
      website: '',
    },
    userInfo: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    contactDetail: {
      prefix: 0,
      firstName: '',
      middleName: '',
      lastName: '',
      gender: 0,
      maritalStatus: 0,
      ssn: '',
      dob: '',
      primaryEmail: '',
      secondaryEmail: '',
      workEmail: '',
      cellPhone: '',
      workPhone: '',
      homePhone: '',
    },
   addressInfo: {
  streetLine1: '',
  streetLine2: '',
  zipCode: '',
  countryId: 0,
  stateId: 0,
  city: '',
}
  });

  const handleChange = (
    section: string,
    field: string,
    value: string | number | boolean
  ) => {
    try {
      setCreateOrganizerData((prev) => ({
        ...prev!,
        [section]: {
          ...prev![section as keyof createOrganizerDto],
          [field]: value,
        },
      }));
    } catch (error) {
      toast({ title: 'Error', description: CommonMethod.ErrorMessage(error), status: 'error', position: "top-right", });
    }
  };

  // Validate short name format (alphanumeric only, no spaces, min 3 characters)
  const validateShortNameFormat = (shortName: string): string | null => {
    if (!shortName) return null;

    // Check for spaces
    if (/\s/.test(shortName)) {
      return 'Short name cannot contain spaces';
    }

    // Check for alphanumeric only (letters and numbers)
    if (!/^[a-zA-Z0-9]+$/.test(shortName)) {
      return 'Short name can only contain letters and numbers';
    }

    // Check minimum length (3 characters)
    if (shortName.length < 3) {
      return 'Short name must be at least 3 characters';
    }

    return null; // No validation errors
  };

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoSelect = (file: File) => {
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // Check short name availability with debounce
  const checkShortNameAvailability = async (shortName: string) => {
    // Clear any existing timeout
    if (shortNameCheckTimeoutRef.current) {
      clearTimeout(shortNameCheckTimeoutRef.current);
    }

    // Reset state if short name is empty
    if (!shortName) {
      setShortNameAvailable(null);
      setIsCheckingShortName(false);
      return;
    }

    // First validate format before API call
    const formatError = validateShortNameFormat(shortName);
    if (formatError) {
      setShortNameError(formatError);
      setShortNameAvailable(null);
      setIsCheckingShortName(false);
      return;
    }

    // Debounce the API call
    shortNameCheckTimeoutRef.current = setTimeout(async () => {
      setIsCheckingShortName(true);
      setShortNameAvailable(null);

      try {
        const response = await adminService.checkShortNameAvailability(shortName);

        // Check if short name is available (response.data === true means available)
        const isAvailable = response.data === true;
        setShortNameAvailable(isAvailable);

        if (!isAvailable) {
          // Short name is not available - show error immediately
          const errorMessage = response.message || 'Short name is not available';
          setShortNameError(errorMessage);
        } else {
          setShortNameError('');
        }
      } catch (error) {
        console.error('Error checking short name availability:', error);
        setShortNameAvailable(null);
        setShortNameError('Name is already taken. Please choose a different one.');
      } finally {
        setIsCheckingShortName(false);
      }
    }, 500); // 500ms debounce
  };

  // Handle short name change with availability check
  const handleShortNameChange = (value: string) => {
    handleChange('organizerInfo', 'shortName', value);
    setShortNameAvailable(null);

    // Validate format immediately and show error
    const formatError = validateShortNameFormat(value);
    if (formatError) {
      setShortNameError(formatError);
      return; // Don't check availability if format is invalid
    }

    setShortNameError(''); // Clear error if format is valid
    checkShortNameAvailability(value);
  };

  const GetTimeZoneOption = async () => {
    try {
      const response = await HttpClient.get<timeZoneResponseDto>('/api/admin/list-items/time-zones');
      if (response.status === 200 && response.data.success) {
        setTimeZoneOptionData(response.data);
      } else {
        toast({ title: 'Error', description: response.statusText, status: 'error', position: "top-right", });
      }
    } catch (error) {
      toast({ title: 'Error', description: CommonMethod.ErrorMessage(error), status: 'error', position: "top-right", });
    }
  };

  const GetOrganizerCategories = async () => {
    try {
      const response = await HttpClient.get<organizerCategoriesResponseDto>('/api/admin/list-items/organizer-categories');
      if (response.status === 200 && response.data.success) {
        setOrganizeCategoryData(response.data);
      } else {
        toast({ title: 'Error', description: response.statusText, status: 'error', position: "top-right", });
      }
    } catch (error) {
      toast({ title: 'Error', description: CommonMethod.ErrorMessage(error), status: 'error', position: "top-right", });
    }
  };

  const handleSubmit = async () => {
    let valid = true;
    let firstErrorField: string | null = null;

    // Organizer Name validation
    if (!createOrganizerDate.organizerInfo.organizerName) {
      setOrganizerNameError('Please Enter Organizer Name');
      valid = false;
      if (!firstErrorField) firstErrorField = 'organizerName';
    } else if (!CommonMethod.MaxLengthValidation(createOrganizerDate.organizerInfo.organizerName, 100)) {
      setOrganizerNameError('Organizer Name cannot exceed 100 characters');
      valid = false;
      if (!firstErrorField) firstErrorField = 'organizerName';
    } else {
      setOrganizerNameError('');
    }

 if (!createOrganizerDate.organizerInfo.shortName) {
  setShortNameError('Please Enter Short Name');
  valid = false;
  if (!firstErrorField) firstErrorField = 'ShortName';
} else if (!CommonMethod.MaxLengthValidation(createOrganizerDate.organizerInfo.shortName, 18)) {
  setShortNameError('Short Name cannot exceed 18 characters');
  valid = false;
  if (!firstErrorField) firstErrorField = 'ShortName';
} else if (shortNameAvailable === false) {
  setShortNameError('Short name is not available. Please choose a different one.');
  valid = false;
  if (!firstErrorField) firstErrorField = 'ShortName';
} else if (isCheckingShortName) {
  toast({ title: 'Please Wait', description: 'Checking short name availability...', status: 'info', position: "top-right" });
  return;
} else {
  setShortNameError('');
}
    // Short Name validation
    if (!createOrganizerDate.organizerInfo.shortName) {
      setShortNameError('Please Enter Short Name');
      valid = false;
      if (!firstErrorField) firstErrorField = 'shortName';
    } else if (createOrganizerDate.organizerInfo.shortName.length < 6) {
      setShortNameError('Short Name must be at least 6 characters');
      valid = false;
      if (!firstErrorField) firstErrorField = 'shortName';
    } else if (!CommonMethod.MaxLengthValidation(createOrganizerDate.organizerInfo.shortName, 18)) {
      setShortNameError('Short Name cannot exceed 18 characters');
      valid = false;
      if (!firstErrorField) firstErrorField = 'shortName';
    } else {
      setShortNameError('');
    }

    // Category validation
    if (!createOrganizerDate.organizerInfo.categoryId) {
      setCategoryIdError('Please Select Category');
      valid = false;
      if (!firstErrorField) firstErrorField = 'categoryId';
    } else {
      setCategoryIdError('');
    }

    // Time Zone validation
    if (!createOrganizerDate.organizerInfo.timeZoneId) {
      setTimeZoneIdError('Please Select Time Zone');
      valid = false;
      if (!firstErrorField) firstErrorField = 'timeZoneId';
    } else {
      setTimeZoneIdError('');
    }

    // Email validation
    if (!createOrganizerDate.userInfo.email) {
      setEmailError('Please Enter Email');
      valid = false;
      if (!firstErrorField) firstErrorField = 'userEmail';
    } else if (!CommonMethod.EmailValidation(createOrganizerDate.userInfo.email)) {
      setEmailError('Please Enter Valid Email');
      valid = false;
      if (!firstErrorField) firstErrorField = 'userEmail';
    } else {
      setEmailError('');
    }

    // Password validation
    if (!createOrganizerDate.userInfo.password) {
      setPasswordError('Please Enter Password');
      valid = false;
      if (!firstErrorField) firstErrorField = 'password';
    } else {
      setPasswordError('');
    }

    // Confirm Password validation
    if (!createOrganizerDate.userInfo.confirmPassword) {
      setConfirmPasswordError('Please Confirm Password');
      valid = false;
      if (!firstErrorField) firstErrorField = 'confirmPassword';
    } else if (createOrganizerDate.userInfo.password !== createOrganizerDate.userInfo.confirmPassword) {
      setConfirmPasswordError('Password and Confirm Password must match');
      valid = false;
      if (!firstErrorField) firstErrorField = 'confirmPassword';
    } else {
      setConfirmPasswordError('');
    }

    // Prefix validation
    if (!createOrganizerDate.contactDetail.prefix) {
      setPrefixError('Please Select Prefix');
      valid = false;
      if (!firstErrorField) firstErrorField = 'prefix';
    } else {
      setPrefixError('');
    }

    // First Name validation
    if (!createOrganizerDate.contactDetail.firstName) {
      setFirstNameError('Please Enter First Name');
      valid = false;
      if (!firstErrorField) firstErrorField = 'firstName';
    } else {
      setFirstNameError('');
    }

    // Last Name validation
    if (!createOrganizerDate.contactDetail.lastName) {
      setLastNameError('Please Enter Last Name');
      valid = false;
      if (!firstErrorField) firstErrorField = 'lastName';
    } else {
      setLastNameError('');
    }

    // Primary Email validation
    if (!createOrganizerDate.contactDetail.primaryEmail) {
      setPrimaryEmailError('Please Enter Primary Email');
      valid = false;
      if (!firstErrorField) firstErrorField = 'primaryEmail';
    } else if (!CommonMethod.EmailValidation(createOrganizerDate.contactDetail.primaryEmail)) {
      setPrimaryEmailError('Please Enter Valid Primary Email');
      valid = false;
      if (!firstErrorField) firstErrorField = 'primaryEmail';
    } else {
      setPrimaryEmailError('');
    }

    // Street Line 1 validation
    if (!createOrganizerDate.addressInfo.streetLine1) {
      setStreetLine1Error('Please Enter Street Line 1');
      valid = false;
      if (!firstErrorField) firstErrorField = 'streetLine1';
    } else {
      setStreetLine1Error('');
    }

    // Street Line 2 validation
    if (!createOrganizerDate.addressInfo.streetLine2) {
      setStreetLine2Error('Please Enter Street Line 2');
      valid = false;
      if (!firstErrorField) firstErrorField = 'streetLine2';
    } else {
      setStreetLine2Error('');
    }

    // Zip Code validation
    if (!createOrganizerDate.addressInfo.zipCode) {
      setZipCodeError('Please Enter Zip Code');
      valid = false;
      if (!firstErrorField) firstErrorField = 'zipCode';
    } else {
      setZipCodeError('');
    }

    // Scroll to first error field
    if (!valid && firstErrorField) {
      setTimeout(() => {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          element.focus();
        }
      }, 100);
      return;
    }

    // If all valid, submit
    if (valid) {
      const submitData: createOrganizerDto = {
        organizerInfo: {
          ...createOrganizerDate.organizerInfo,
          dateFormatId: 1, // Set a default date format ID
          website: createOrganizerDate.organizerInfo.website || '',
          modules: [], // Empty modules array
          paymentMerchants: [] // Empty payment merchants array
        },
        userInfo: {
          ...createOrganizerDate.userInfo
        },
        contactDetail: {
          ...createOrganizerDate.contactDetail,
          middleName: createOrganizerDate.contactDetail.middleName || '',
          cellPhone: createOrganizerDate.contactDetail.cellPhone || '',
          ssn: null, 
          secondaryEmail: null, 
          workEmail: null, 
          workPhone: '', 
          homePhone: '',
          dob: '' 
        },
        addressInfo: {
          ...createOrganizerDate.addressInfo
        }
      };

      console.log('Form Submitted', JSON.stringify(submitData, null, 2));

      try {
        setLoading(true);

        const response = await HttpClient.post(
          "/api/admin/organizer/create",
          submitData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status == 200) {
          console.log("API Response 🙌🙌🙌:", response.data);
          console.log("orgId:", response.data.data);
          if (response.data.success) {
            const organizerId = response.data.data;
            
            // Upload logo if selected
            if (logoFile && organizerId) {
              try {
                await adminService.uploadLogo(organizerId, logoFile);
              } catch (logoError) {
                console.error("Logo upload failed:", logoError);
                toast({
                  title: "Warning",
                  description: "Organizer created but logo upload failed.",
                  status: "warning",
                  position: "top-right",
                  duration: 5000,
                });
              }
            }

            toast({
              status: "success",
              title: "Organizer Created Successfully",
              position: "top-right",
            });

            navigate('/admin/manage-organizer/list');
            return;
          } else {
            toast({ 
              title: 'Error', 
              description: response.data.message, 
              status: 'error', 
              position: "top-right" 
            });
          }
        } else {
          toast({
            status: "error",
            title: "Failed to Create Organizer",
            description: response.statusText,
            position: "top-right",
          });
        }

      } catch (error: any) {
        console.error("Full API Error:", error);
        
        let errorMessage = "An error occurred";
        if (error?.response?.data?.errors) {
          const validationErrors = error.response.data.errors;
          errorMessage = Object.keys(validationErrors)
            .map(key => `${key}: ${validationErrors[key].join(', ')}`)
            .join('\n');
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast({
          status: "error",
          title: "Failed to Create Organizer",
          description: errorMessage,
          position: "top-right",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    }
  };
  
  const BackToList = () => {
    navigate('/admin/manage-organizer/list');
  }; 

  return (
    <Flex direction="column" pt={{ sm: '25px', lg: '5px' }} mt={14}>
      <Card p='10px'>
        {/* Top Section: Logo Upload */}
        <Box mb={1}>
            <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={useColorModeValue('gray.700', 'gray.300')}
                mb={2}
            >
                Upload photo or logo
            </FormLabel>
            <Box width="100%" display="flex" justifyContent="flex-start">
             <ImageUpload 
                onFileSelect={handleLogoSelect}
                previewUrl={logoPreview}
                onError={(msg) => toast({ title: 'Error', description: msg, status: 'error', position: 'top-right' })}
            />
            </Box>
        </Box>

        {/* Organizer Info Section */}
        <Box mb={6}>
          <Box mb={3}>
            <Text
              fontSize="2xl"
              fontWeight="700"
              mb={1}
              color={useColorModeValue('blue.700', 'blue.200')}
            >
              Organizer Info
            </Text>
            <Text
              fontSize="sm"
              color={useColorModeValue('gray.600', 'gray.400')}
            >
              Enter the basic information about the organizer
            </Text>
          </Box>
            
          <Box w="100%">
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
                <FormControl>
                  <FormLabel
                    fontWeight="600"
                    fontSize="sm"
                    color={useColorModeValue('gray.700', 'gray.300')}
                  >
                    Organizer Name <Text as="span" color="red.500">*</Text>
                  </FormLabel>
                  <Input
                    placeholder="Company XYZ"
                    maxLength={100}
                    id="organizerName"
                    onChange={(e) => handleChange('organizerInfo', 'organizerName', e.target.value)}
                    bg={useColorModeValue('gray.50', 'navy.900')}
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
                    _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                    _focus={{
                      borderColor: useColorModeValue('blue.500', 'blue.400'),
                      boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                    }}
                  />
                  {organizerNameError && (
                    <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{organizerNameError}</Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel
                    fontWeight="600"
                    fontSize="sm"
                    color={useColorModeValue('gray.700', 'gray.300')}
                  >
                    Short Name <Text as="span" color="red.500">*</Text>
                  </FormLabel>
                  <InputGroup>
                  <Input
                      placeholder="XYZ"
                      id='shortName'
                      maxLength={18}
                      value={createOrganizerDate.organizerInfo.shortName}
                    onChange={(e) => handleShortNameChange(e.target.value)}
                      bg={useColorModeValue('gray.50', 'navy.900')}
                      border="1px solid"
                      borderColor={
                      shortNameAvailable === true
                        ? 'green.400'
                        : shortNameAvailable === false
                        ? 'red.400'
                        : useColorModeValue('gray.200', 'whiteAlpha.100')
                    }
                      _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                      _focus={{
                        borderColor: useColorModeValue('blue.500', 'blue.400'),
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                      }}
                    />
                    <InputRightElement>
                    {isCheckingShortName ? (
                      <Box
                        as="span"
                        className="chakra-spinner"
                        borderWidth="2px"
                        borderStyle="solid"
                        borderColor="blue.500"
                        borderTopColor="transparent"
                        borderRadius="50%"
                        w="16px"
                        h="16px"
                        animation="spin 0.6s linear infinite"
                        sx={{
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                          },
                        }}
                      />
                    ) : shortNameAvailable === true ? (
                      <CheckIcon color="green.500" />
                    ) : shortNameAvailable === false ? (
                      <CloseIcon color="red.500" boxSize={3} />
                    ) : null}
                  </InputRightElement>
                </InputGroup>
                {shortNameError && (
                    <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{shortNameError}</Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel
                    fontWeight="600"
                    fontSize="sm"
                    color={useColorModeValue('gray.700', 'gray.300')}
                  >
                    Category <Text as="span" color="red.500">*</Text>
                  </FormLabel>
                  <Select
                    id="categoryId"
                    onChange={(e) => handleChange('organizerInfo', 'categoryId', Number(e.target.value))}
                    bg={useColorModeValue('gray.50', 'navy.900')}
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
                    _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                    _focus={{
                      borderColor: useColorModeValue('blue.500', 'blue.400'),
                      boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                    }}
                  >
                    <option value="">--Please choose an option--</option>
                    {organizeCategory?.data?.map(organizeCategory => (
                      <option key={organizeCategory.id} value={organizeCategory.id}>
                        {organizeCategory.name}
                      </option>
                    ))}
                  </Select>
                  {categoryIdError && (
                    <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{categoryIdError}</Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel
                    fontWeight="600"
                    fontSize="sm"
                    color={useColorModeValue('gray.700', 'gray.300')}
                  >
                    Time Zone <Text as="span" color="red.500">*</Text>
                  </FormLabel>
                  <Select
                    id="timeZoneId"
                    value={createOrganizerDate.organizerInfo.timeZoneId}
                    onChange={(e) => handleChange('organizerInfo', 'timeZoneId', Number(e.target.value))}
                    bg={useColorModeValue('gray.50', 'navy.900')}
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
                    _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                    _focus={{
                      borderColor: useColorModeValue('blue.500', 'blue.400'),
                      boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                    }}
                  >
                    <option value="">--Please choose an option--</option>
                    {timeZoneOptionData?.data?.map(timeZoneOption => {
                      const timezoneName = timeZoneOption.displayName.split(') ')[1] || timeZoneOption.displayName;
                      
                      return (
                        <option 
                          key={timeZoneOption.id} 
                          value={timeZoneOption.id}
                          label={`${timezoneName} ${timeZoneOption.displayName.split(')')[0]})`}
                        >
                          {timeZoneOption.displayName}
                        </option>
                      );
                    })}
                  </Select>
                  {timeZoneIdError && (
                    <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{timeZoneIdError}</Text>
                  )}
                </FormControl>
              </SimpleGrid>
              </Box>


        </Box>

        {/* User Info Section */}
        <Box mb={6}>
          <Box mb={3}>
            <Text
              fontSize="2xl"
              fontWeight="700"
              mb={2}
              color={useColorModeValue('blue.700', 'blue.200')}
            >
              User Info
            </Text>
            <Text
              fontSize="sm"
              color={useColorModeValue('gray.600', 'gray.400')}
            >
              Set up the login credentials for the organizer
            </Text>
          </Box>

          <SimpleGrid columns={{ sm: 1, md: 4 }} spacing={6}>
            <FormControl>
              <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={useColorModeValue('gray.700', 'gray.300')}
              >
                Email <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <Input
                id="userEmail"
                placeholder="user@example.com"
                maxLength={254}
                onChange={(e) => handleChange('userInfo', 'email', e.target.value)}
                bg={useColorModeValue('gray.50', 'navy.900')}
                border="1px solid"
                borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
                _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                _focus={{
                  borderColor: useColorModeValue('blue.500', 'blue.400'),
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                }}
              />
              {emailError && (
                <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{emailError}</Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={useColorModeValue('gray.700', 'gray.300')}
              >
                Password <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  maxLength={128}
                  onChange={(e) => handleChange('userInfo', 'password', e.target.value)}
                  bg={useColorModeValue('gray.50', 'navy.900')}
                  border="1px solid"
                  borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
                  _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                  _focus={{
                    borderColor: useColorModeValue('blue.500', 'blue.400'),
                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                  }}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    color={useColorModeValue('gray.600', 'gray.400')}
                  />
                </InputRightElement>
              </InputGroup>
              {passwordError && (
                <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{passwordError}</Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={useColorModeValue('gray.700', 'gray.300')}
              >
                Confirm Password <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <InputGroup>
                <Input
                  id="confirmPassword"
                  maxLength={128}
                  type={showConfirmPassword ? "text" : "password"}
                  onChange={(e) => handleChange('userInfo', 'confirmPassword', e.target.value)}
                  bg={useColorModeValue('gray.50', 'navy.900')}
                  border="1px solid"
                  borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
                  _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                  _focus={{
                    borderColor: useColorModeValue('blue.500', 'blue.400'),
                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                  }}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    color={useColorModeValue('gray.600', 'gray.400')}
                  />
                </InputRightElement>
              </InputGroup>
              {confirmPasswordError && (
                <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{confirmPasswordError}</Text>
              )}
            </FormControl>
          </SimpleGrid>
        </Box>

        {/* Contact Detail Section */}
        <Box mb={6}>
          <Box mb={3}>
            <Text
              fontSize="2xl"
              fontWeight="700"
              mb={2}
              color={useColorModeValue('blue.700', 'blue.200')}
            >
              Contact Detail
            </Text>
            <Text
              fontSize="sm"
              color={useColorModeValue('gray.600', 'gray.400')}
            >
              Provide the contact information for the organizer representative
            </Text>
          </Box>

          <SimpleGrid columns={{ sm: 1, md: 4 }} spacing={6}>
            <FormControl>
              <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={useColorModeValue('gray.700', 'gray.300')}
              >
                Prefix <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <Select
                id="prefix"
                onChange={(e) => handleChange('contactDetail', 'prefix', Number(e.target.value))}
                bg={useColorModeValue('gray.50', 'navy.900')}
                border="1px solid"
                borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
                _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                _focus={{
                  borderColor: useColorModeValue('blue.500', 'blue.400'),
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                }}
              >
                <option value="">--Please choose an option--</option>
                <option value="1">Mr.</option>
                <option value="2">Mrs.</option>
                <option value="3">Ms.</option>
                <option value="4">Dr.</option>
              </Select>
              {prefixError && (
                <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{prefixError}</Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={useColorModeValue('gray.700', 'gray.300')}
              >
                First Name <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <Input
                id="firstName"
                placeholder="John"
                maxLength={20}
                onChange={(e) => handleChange('contactDetail', 'firstName', e.target.value)}
                bg={useColorModeValue('gray.50', 'navy.900')}
                border="1px solid"
                borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
                _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                _focus={{
                  borderColor: useColorModeValue('blue.500', 'blue.400'),
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                }}
              />
              {firstNameError && (
                <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{firstNameError}</Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={useColorModeValue('gray.700', 'gray.300')}
              >
                Middle Name
              </FormLabel>
              <Input
                id="middleName"
                placeholder="A."
                maxLength={20}
                onChange={(e) => handleChange('contactDetail', 'middleName', e.target.value)}
                bg={useColorModeValue('gray.50', 'navy.900')}
                border="1px solid"
                borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
                _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                _focus={{
                  borderColor: useColorModeValue('blue.500', 'blue.400'),
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={useColorModeValue('gray.700', 'gray.300')}
              >
                Last Name <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <Input
                id="lastName"
                placeholder="Doe"
                maxLength={20}
                onChange={(e) => handleChange('contactDetail', 'lastName', e.target.value)}
                bg={useColorModeValue('gray.50', 'navy.900')}
                border="1px solid"
                borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
                _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                _focus={{
                  borderColor: useColorModeValue('blue.500', 'blue.400'),
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                }}
              />
              {lastNameError && (
                <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{lastNameError}</Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={useColorModeValue('gray.700', 'gray.300')}
              >
                Primary Email <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <Input
                id="primaryEmail"
                placeholder="primary@example.com"
                maxLength={254}
                onChange={(e) => handleChange('contactDetail', 'primaryEmail', e.target.value)}
                bg={useColorModeValue('gray.50', 'navy.900')}
                border="1px solid"
                borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
                _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                _focus={{
                  borderColor: useColorModeValue('blue.500', 'blue.400'),
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                }}
              />
              {primaryEmailError && (
                <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{primaryEmailError}</Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={useColorModeValue('gray.700', 'gray.300')}
              >
                Cell Phone
              </FormLabel>
              <Input
                id="cellPhone"
                maxLength={16}
                placeholder="+15551234567"
                value={createOrganizerDate.contactDetail.cellPhone}
                onChange={(e) => {
                  const value = CommonMethod.SanitizePhoneInput(e.target.value);
                  handleChange('contactDetail', 'cellPhone', value); 
                }}
                onKeyDown={(e) => CommonMethod.HandlePhoneKeyDown(e)}
                onPaste={(e) => {
                  const newValue = CommonMethod.HandlePhonePaste(e, createOrganizerDate.contactDetail.cellPhone);
                  handleChange('contactDetail', 'cellPhone', newValue);
                }}
                bg={useColorModeValue('gray.50', 'navy.900')}
                border="1px solid"
                borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
                _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                _focus={{
                  borderColor: useColorModeValue('blue.500', 'blue.400'),
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                }}
              />
            </FormControl>
          </SimpleGrid>
        </Box>

        {/* Address Info Section */}
<AddressInfoFields
  streetLine1={createOrganizerDate.addressInfo.streetLine1}
  streetLine2={createOrganizerDate.addressInfo.streetLine2}
  zipCode={createOrganizerDate.addressInfo.zipCode}
  countryId={createOrganizerDate.addressInfo.countryId || 0}
  stateId={createOrganizerDate.addressInfo.stateId || 0}
  city={createOrganizerDate.addressInfo.city || ''}
  streetLine1Error={streetLine1Error}
  streetLine2Error={streetLine2Error}
  zipCodeError={zipCodeError}
  onChange={(field, value) => handleChange('addressInfo', field, value)}
  loading={loading}
/>

        <Flex justify="flex-end" mt={8} gap={3}>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            size="md"
            px={8}
            isLoading={loading}
            boxShadow="sm"
            _hover={{
              boxShadow: 'md',
              transform: 'translateY(-1px)'
            }}
            transition="all 0.2s"
          >
            Submit
          </Button>
          <Button
            variant="outline"
            onClick={BackToList}
            size="md"
            px={8}
            borderColor={useColorModeValue('gray.300', 'whiteAlpha.300')}
            color={useColorModeValue('gray.700', 'gray.300')}
            _hover={{
              bg: useColorModeValue('gray.50', 'whiteAlpha.100'),
              borderColor: useColorModeValue('gray.400', 'whiteAlpha.400')
            }}
          >
            Back To List
          </Button>
        </Flex>
      </Card>
    </Flex>
  );
}