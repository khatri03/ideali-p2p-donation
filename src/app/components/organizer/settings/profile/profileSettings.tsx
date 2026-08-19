import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Flex,
  useColorModeValue,
  Input,
  useToast,
  Center,
  FormControl,
  FormLabel,
  Select,
  SimpleGrid,
  IconButton,
  Tooltip,
  Switch,
  HStack,
} from '@chakra-ui/react';
import { MdEdit, MdSave } from 'react-icons/md';
import {
  fetchOrganizerProfile,
  updateOrganizerProfile,
  enable2FA,
  disable2FA,
} from '../../../../service/organizer/Settings/profileService';
import Loader from '../../../common/Loader';
import {timeZoneResponseDto} from '../../../../interface/CommonInter/timeZoneResponseDto';
import TimeZoneService from '../../../../service/helpers/TimezoneService';
import Card from 'themeComponents/card/Card';
import ImageUpload from '../../../common/ImageUpload';
import { uploadLogo } from '../../../../service/admin/profileService';
import AddressInfoFields from '../../../common/profileComponent/addressInfofields';
import ConfirmationModal from '../../../common/ConfirmationModal';
import { useAppDispatch } from '../../../../../store/hooks';
import { setLogoUrl } from '../../../../../store/slices/profileSlice';

interface ProfileSettingsProps {
  organizerUniqueId?: string;
}

interface ValidationErrors {
  organizerName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  primaryEmail?: string;
  cellPhone?: string;
  streetLine1?: string;
  zipCode?: string;
  city?: string;         
  countryId?: string;    
  stateId?: string; 
}

const OPTIONAL_FIELDS = ['middleName', 'streetLine2'];

export default function ProfileSettings({ organizerUniqueId }: ProfileSettingsProps) {
  const toast = useToast();
  const dispatch = useAppDispatch();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [timeZoneOptionData, setTimeZoneOptionData] = useState<timeZoneResponseDto | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isToggling2FA, setIsToggling2FA] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [pending2FAState, setPending2FAState] = useState(false);

  const [formData, setFormData] = useState({
    organizerName: '',
    shortName: '',
    timeZoneId: 10,
    firstName: '',
    middleName: '',
    lastName: '',
    primaryEmail: '',
    cellPhone: '',
    streetLine1: '',
    streetLine2: '',
    zipCode: '',
    countryId: 0,
    stateId: 0,
    city: '',
    countryName: '',
    stateName: '',
    isTwoFactorEnabled: false,
  });

  const [originalData, setOriginalData] = useState({ ...formData });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [profileData, timeZoneData] = await Promise.all([
        fetchOrganizerProfile(organizerUniqueId),
        TimeZoneService.fetchTimeZones()
      ]);

      // Extract country and state info from nested objects
      const countryId = profileData.address?.countryInfo?.countryId || 
                       profileData.address?.countryId || 0;
      const countryName = profileData.address?.countryInfo?.name || 
                         profileData.address?.countryName || '';
      
      const stateId = profileData.address?.stateInfo?.stateId || 
                     profileData.address?.stateId || 0;
      const stateName = profileData.address?.stateInfo?.name || 
                       profileData.address?.stateName || '';

      const loadedData = {
        organizerName: profileData.organizer.name ,
        shortName: profileData.organizer.shortName ,
        timeZoneId: profileData.organizer.timeZoneId || 10,
        firstName: profileData.contact.firstName ,
        middleName: profileData.contact.middleName ,
        lastName: profileData.contact.lastName ,
        primaryEmail: profileData.contact.primaryEmail ,
        cellPhone: profileData.contact.cellPhone ,
        streetLine1: profileData.address?.streetLine1 ,
        streetLine2: profileData.address?.streetLine2 ,
        zipCode: profileData.address?.zipCode ,
        countryId: countryId,
        stateId: stateId,
        city: profileData.address?.city ,
        countryName: countryName,
        stateName: stateName,
        isTwoFactorEnabled: profileData.organizer.enableTwoFa ?? false,
      };
      
      console.log('📥 Loaded profile data:', {
        countryId,
        countryName,
        stateId,
        stateName
      });

      setFormData(loadedData);
      setOriginalData(loadedData);
      setTimeZoneOptionData(timeZoneData);

      // Set existing logo if available
      if (profileData.organizer.logoUrl) {
        setLogoPreview(profileData.organizer.logoUrl);
      }
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message || 'Failed to load profile data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoSelect = (file: File) => {
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const validateField = (field: string, value: string | number): string | undefined => {
    const trimmedValue = typeof value === 'string' ? value.trim() : String(value);
    
    if (OPTIONAL_FIELDS.includes(field) && !trimmedValue) {
      return undefined;
    }

    const validations: Record<string, () => string | undefined> = {
      organizerName: () => !trimmedValue ? 'Organizer Name is required' : undefined,
      firstName: () => !trimmedValue ? 'First Name is required' : undefined,
      lastName: () => !trimmedValue ? 'Last Name is required' : undefined,
      primaryEmail: () => {
        if (!trimmedValue) return 'Primary Email is required';
        if (trimmedValue.length < 6 || trimmedValue.length > 80)
          return 'Email must be 6-80 characters';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue))
          return 'Please enter a valid email address';
        return undefined;
      },
      streetLine1: () => {
        if (!trimmedValue) return 'Street Line 1 is required';
        if (trimmedValue.length < 3 || trimmedValue.length > 80)
          return 'Address line 1 must be 3-80 characters';
        return undefined;
      },
      city: () => {
     if (!trimmedValue) return 'City is required';
      if (trimmedValue.length < 2 || trimmedValue.length > 80)
        return 'City must be 2-80 characters';
      return undefined;
      

    },
     cellPhone: () => {
      if (!trimmedValue) return 'Cell Phone is required';
      if (trimmedValue.length < 6 || trimmedValue.length > 24)
        return 'Cell phone must be 6-24 characters';
      return undefined;
    },
    countryId: () => {
      const numValue = Number(value);
      if (!numValue || numValue === 0) return 'Country is required';
      return undefined;
    },
    stateId: () => {
      const numValue = Number(value);
      if (!numValue || numValue === 0) return 'State/Province is required';
      return undefined;
    },
    zipCode: () => {
      if (!trimmedValue) return 'Zip/Postal Code is required';
      if (trimmedValue.length < 5 || trimmedValue.length > 10)
        return 'Zip code must be 5-10 characters';
      return undefined;
    },
      middleName: () => trimmedValue && (trimmedValue.length < 3 || trimmedValue.length > 24)
        ? 'Middle name must be 3-24 characters' : undefined,
        streetLine2: () => trimmedValue && (trimmedValue.length < 3 || trimmedValue.length > 80)
          ? 'Street line 2 must be 3-80 characters' : undefined,
    };

    return validations[field]?.();
  };

  const validateForm = () => {
    const errors: ValidationErrors = {};
    const fieldsToValidate = Object.keys(formData).filter(k => 
      k !== 'shortName' &&
      k !== 'timeZoneId' &&    
    k !== 'countryName' &&   
    k !== 'stateName'   &&
    k !== 'streetLine2'
    );

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field as keyof typeof formData] as string);
      if (error) errors[field as keyof ValidationErrors] = error;
    });

    setValidationErrors(errors);
    setTouchedFields(new Set(fieldsToValidate));

    if (Object.keys(errors).length > 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fix all validation errors before saving',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  const getValueOrNull = (value: string | undefined | null): string | null => {
    if (!value) return null;
    const trimmed = String(value).trim();
    return (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') ? null : trimmed;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const storedId = organizerUniqueId ||
        localStorage.getItem('organizerUniqueId') ||
        localStorage.getItem('organizerId');

      if (!storedId || storedId === 'undefined' || storedId === 'null') {
        throw new Error('Organizer ID not found. Please log in again.');
      }

      const updatePayload = {
        organizer: {
          name: formData.organizerName.trim(),
          shortName: getValueOrNull(formData.shortName),
          timeZoneId: Number(formData.timeZoneId) || 10,
          isTwoFactorEnabled: formData.isTwoFactorEnabled,
        },
        contact: {
          firstName: formData.firstName.trim(),
          middleName: getValueOrNull(formData.middleName),
          lastName: formData.lastName.trim(),
          primaryEmail: formData.primaryEmail.trim(),
          cellPhone: getValueOrNull(formData.cellPhone),
        },
        address: {
          streetLine1: formData.streetLine1.trim(),
          streetLine2: formData.streetLine2,
          zipCode: getValueOrNull(formData.zipCode),
          countryId: formData.countryId || null,
          stateId: formData.stateId || null,
          city: getValueOrNull(formData.city),
          countryName: formData.countryName || '',
          stateName: formData.stateName || '',
        },
      };

      await updateOrganizerProfile(storedId, updatePayload);

      // Upload logo if selected
      if (logoFile) {
        try {
          await uploadLogo(storedId, logoFile);
          // Update Redux so navbar avatar updates instantly
          dispatch(setLogoUrl(logoPreview));
          setLogoFile(null);
        } catch (logoError) {
          console.error('Logo upload failed:', logoError);
          toast({
            title: 'Warning',
            description: 'Profile updated but logo upload failed.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      }

      setIsEditing(false);
      setOriginalData({ ...formData });
      setValidationErrors({});
      setTouchedFields(new Set());

      toast({
        title: 'Profile updated',
        description: 'Your profile settings have been saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ||
        error?.message ||
        'Failed to update profile. Please try again.';

      toast({
        title: 'Error saving profile',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData({ ...formData, [field]: value });
    setTouchedFields(prev => new Set(prev).add(field));

    const error = validateField(field, String(value));
    setValidationErrors(prev => ({ ...prev, [field]: error }));
  };

  // Dedicated handler for address fields
  const handleAddressChange = (field: string, value: string | number, additionalData?: { countryName?: string; stateName?: string }) => {
    console.log('Address field changed:', field, value, additionalData);
    
    const updates: any = { [field]: value };
    
    // If country or state is changed, also update the name
    if (additionalData) {
      if (additionalData.countryName !== undefined) {
        updates.countryName = additionalData.countryName;
      }
      if (additionalData.stateName !== undefined) {
        updates.stateName = additionalData.stateName;
      }
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
    setTouchedFields(prev => new Set(prev).add(field));

    const error = validateField(field, String(value));
    setValidationErrors(prev => ({ ...prev, [field]: error }));

  };

  const handleBlur = (field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateField(field, formData[field as keyof typeof formData] as string);
    setValidationErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleEdit = () => {
    setOriginalData({ ...formData });
    setValidationErrors({});
    setTouchedFields(new Set());
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({ ...originalData });
    setValidationErrors({});
    setTouchedFields(new Set());
    setIsEditing(false);
  };

  const open2FAModal = (enabled: boolean) => {
    setPending2FAState(enabled);
    setIs2FAModalOpen(true);
  };

  const handle2FAConfirm = async () => {
    setIsToggling2FA(true);
    setIs2FAModalOpen(false);
    try {
      const response = pending2FAState ? await enable2FA() : await disable2FA();
      if (response.success) {
        setFormData(prev => ({ ...prev, isTwoFactorEnabled: pending2FAState }));
        setOriginalData(prev => ({ ...prev, isTwoFactorEnabled: pending2FAState }));
        toast({
          title: `2FA ${pending2FAState ? 'Enabled' : 'Disabled'}`,
          description: `Two Factor Authentication has been ${pending2FAState ? 'enabled' : 'disabled'} successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: `Failed to ${pending2FAState ? 'enable' : 'disable'} 2FA`,
        description: error.message || 'Something went wrong. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsToggling2FA(false);
    }
  };

  const shouldShowError = (field: string): boolean => {
    return isEditing && touchedFields.has(field) && !!validationErrors[field as keyof ValidationErrors];
  };

  const inputBg = useColorModeValue('gray.50', 'navy.900');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.100');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const textColor = useColorModeValue('gray.700', 'white');
  const disabledBg = useColorModeValue('gray.100', 'gray.700');

  if (isLoading) {
    return (
      <Flex direction="column" pt={{ sm: '25px', lg: '5px' }} mt={14}>
        <Card p='10px'>
          <Center py={10}>
            <Loader message="Loading Profile Settings" subtitle="Please wait while we fetch your data..." />
          </Center>
        </Card>
      </Flex>
    );
  }

  return (
    <Flex direction="column" pt={{ sm: '25px', lg: '5px' }} mt={14}>
      <Card p='10px'>
         {/* Top Section: Logo Upload */}
          <Box mb={6}>
            <FormLabel
              fontWeight="600"
              fontSize="sm"
              textAlign='left'
              color={labelColor}
              mb={2}
            >
              Upload photo or logo
            </FormLabel>
            <Box width="100%" display="flex" justifyContent="flex-start">
              {isEditing ? (
                <ImageUpload
                  onFileSelect={handleLogoSelect}
                  previewUrl={logoPreview}
                  onError={(msg) => toast({ title: 'Error', description: msg, status: 'error', position: 'top-right' })}
                />
              ) : (
                <Flex justify="center" align="center" direction="column" mb={4}>
                  <Box
                    w="150px"
                    h="150px"
                    borderRadius="full"
                    border="2px solid"
                    borderColor={inputBorder}
                    overflow="hidden"
                    bg={inputBg}
                  >
                    {logoPreview ? (
                      <Box
                        as="img"
                        src={logoPreview}
                        alt="Logo"
                        w="100%"
                        h="100%"
                        objectFit="cover"
                      />
                    ) : (
                      <Flex w="100%" h="100%" justify="center" align="center" direction="column" color="gray.400" p={2}>
                        <Text fontSize="xs" textAlign="center" fontWeight="medium">No Logo</Text>
                      </Flex>
                    )}
                  </Box>
                  
                </Flex>
              )}
            </Box>
          </Box>
        {/* Organizer Info Section */}
        <Box mb={6}>
          <Box mb={6}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text
                  fontSize="2xl"
                  fontWeight="700"
                  mb={2}
                  color={useColorModeValue('blue.700', 'blue.200')}
                >
                  Organizer Info
                </Text>
                <Text
                  fontSize="sm"
                  color={useColorModeValue('gray.600', 'gray.400')}
                >
                  View and manage your organizer information
                </Text>
              </Box>
              {!isEditing ? (
                <Tooltip label="Edit Profile" placement="left" hasArrow>
                  <IconButton
                    aria-label="Edit Profile"
                    icon={<MdEdit size={24} />}
                    size="lg"
                    onClick={handleEdit}
                    variant="ghost"
                    color="gray.800"
                    _hover={{
                      color: 'blue.600',
                      transform: 'scale(1.1)'
                    }}
                    _active={{
                      color: 'blue.700',
                      transform: 'scale(0.95)'
                    }}
                    transition="all 0.2s ease"
                  />
                </Tooltip>
              ) : (
                <Tooltip label="Cancel" placement="left" hasArrow>
                  <IconButton
                    aria-label="Cancel"
                    icon={<Text fontSize="xl" fontWeight="bold">✕</Text>}
                    size="md"
                    onClick={handleCancel}
                    isDisabled={isSaving}
                    variant="ghost"
                    color="gray.800"
                    _hover={{
                      color: 'red.500',
                      transform: 'scale(1.1)'
                    }}
                    _active={{
                      color: 'red.600',
                      transform: 'scale(0.95)'
                    }}
                    transition="all 0.2s ease"
                  />
                </Tooltip>
              )}
            </Flex>
          </Box>

          <Box w="100%">
            <SimpleGrid columns={{ sm: 1, md: 4 }} spacing={6}>
                <FormControl>
                  <FormLabel
                    fontWeight="600"
                    fontSize="sm"
                    color={labelColor}
                  >
                    Organizer Name <Text as="span" color="red.500">*</Text>
                  </FormLabel>
                  {isEditing ? (
                    <>
                      <Input
                        placeholder="Company XYZ"
                        maxLength={100}
                        value={formData.organizerName}
                        onChange={(e) => handleChange('organizerName', e.target.value)}
                        onBlur={() => handleBlur('organizerName')}
                        bg={inputBg}
                        border="1px solid"
                        borderColor={inputBorder}
                        _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                        _focus={{
                          borderColor: useColorModeValue('blue.500', 'blue.400'),
                          boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                        }}
                      />
                      {shouldShowError('organizerName') && (
                        <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{validationErrors.organizerName}</Text>
                      )}
                    </>
                  ) : (
                    <Text color={textColor} fontWeight="medium">{formData.organizerName || '-'}</Text>
                  )}
                </FormControl>
                <FormControl>
                  <FormLabel
                    fontWeight="600"
                    fontSize="sm"
                    color={labelColor}
                  >
                    Time Zone <Text as="span" color="red.500">*</Text>
                  </FormLabel>
                  {isEditing ? (
                    <Select
                      value={formData.timeZoneId}
                      onChange={(e) => handleChange('timeZoneId', Number(e.target.value))}
                      bg={inputBg}
                      border="1px solid"
                      borderColor={inputBorder}
                      _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                      _focus={{
                        borderColor: useColorModeValue('blue.500', 'blue.400'),
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                      }}
                    >
                      <option value="">--Please choose a timezone--</option>
                      {timeZoneOptionData?.data?.map(tz => {
                        const timezoneName = tz.displayName.split(') ')[1] || tz.displayName;
                        return (
                          <option
                            key={tz.id}
                            value={tz.id}
                            label={`${timezoneName} ${tz.displayName.split(')')[0]})`}
                          >
                            {tz.displayName}
                          </option>
                        );
                      })}
                    </Select>
                  ) : (
                    <Text color={textColor} fontWeight="medium">
                      {TimeZoneService.getTimeZoneDisplay(formData.timeZoneId, timeZoneOptionData)}
                    </Text>
                  )}
                </FormControl>
                <FormControl>
                  <FormLabel
                    fontWeight="600"
                    fontSize="sm"
                    color={labelColor}
                  >
                    Two Factor Authentication
                  </FormLabel>
                  <HStack spacing={3} mt={2}>
                    <Switch
                      id="two-factor-auth"
                      isChecked={formData.isTwoFactorEnabled}
                      onChange={(e) => open2FAModal(e.target.checked)}
                      colorScheme="blue"
                      size="md"
                      isDisabled={isToggling2FA}
                    />
                    <Text fontSize="sm" color={textColor} fontWeight="medium">
                      {isToggling2FA ? 'Updating...' : formData.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </HStack>
                </FormControl>
              </SimpleGrid>

          </Box>
        </Box>

        {/* Contact Detail Section */}
        <Box mb={6}>
          <Box mb={6}>
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
              Your contact information
            </Text>
          </Box>

          <SimpleGrid columns={{ sm: 1, md: 4 }} spacing={6}>
            <FormControl>
              <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={labelColor}
              >
                First Name <Text as="span" color="red.500">*</Text>
              </FormLabel>
              {isEditing ? (
                <>
                  <Input
                    placeholder="John"
                    maxLength={20}
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    onBlur={() => handleBlur('firstName')}
                    bg={inputBg}
                    border="1px solid"
                    borderColor={inputBorder}
                    _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                    _focus={{
                      borderColor: useColorModeValue('blue.500', 'blue.400'),
                      boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                    }}
                  />
                  {shouldShowError('firstName') && (
                    <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{validationErrors.firstName}</Text>
                  )}
                </>
              ) : (
                <Text color={textColor} fontWeight="medium">{formData.firstName || '-'}</Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={labelColor}
              >
                Last Name <Text as="span" color="red.500">*</Text>
              </FormLabel>
              {isEditing ? (
                <>
                  <Input
                    placeholder="Doe"
                    maxLength={20}
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    onBlur={() => handleBlur('lastName')}
                    bg={inputBg}
                    border="1px solid"
                    borderColor={inputBorder}
                    _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                    _focus={{
                      borderColor: useColorModeValue('blue.500', 'blue.400'),
                      boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                    }}
                  />
                  {shouldShowError('lastName') && (
                    <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{validationErrors.lastName}</Text>
                  )}
                </>
              ) : (
                <Text color={textColor} fontWeight="medium">{formData.lastName || '-'}</Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={labelColor}
              >
                Primary Email <Text as="span" color="red.500">*</Text>
              </FormLabel>
              {isEditing ? (
                <>
                  <Input
                    placeholder="primary@example.com"
                    maxLength={254}
                    type="email"
                    value={formData.primaryEmail}
                    onChange={(e) => handleChange('primaryEmail', e.target.value)}
                    onBlur={() => handleBlur('primaryEmail')}
                    bg={inputBg}
                    border="1px solid"
                    borderColor={inputBorder}
                    _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                    _focus={{
                      borderColor: useColorModeValue('blue.500', 'blue.400'),
                      boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                    }}
                  />
                  {shouldShowError('primaryEmail') && (
                    <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{validationErrors.primaryEmail}</Text>
                  )}
                </>
              ) : (
                <Text color={textColor} fontWeight="medium">{formData.primaryEmail || '-'}</Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel
                fontWeight="600"
                fontSize="sm"
                color={labelColor}
              >
                Cell Phone
              </FormLabel>
              {isEditing ? (
                <>
                  <Input
                    placeholder="+15551234567"
                    maxLength={16}
                    type="tel"
                    value={formData.cellPhone}
                    onChange={(e) => handleChange('cellPhone', e.target.value)}
                    onBlur={() => handleBlur('cellPhone')}
                    bg={inputBg}
                    border="1px solid"
                    borderColor={inputBorder}
                    _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
                    _focus={{
                      borderColor: useColorModeValue('blue.500', 'blue.400'),
                      boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                    }}
                  />
                  {shouldShowError('cellPhone') && (
                    <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{validationErrors.cellPhone}</Text>
                  )}
                </>
              ) : (
                <Text color={textColor} fontWeight="medium">{formData.cellPhone || '-'}</Text>
              )}
            </FormControl>
          </SimpleGrid>
        </Box>

        {/* Address Info Section */}
        <Box mb={6}>
          <Box mb={6}>
            <Text
              fontSize="2xl"
              fontWeight="700"
              mb={2}
              color={useColorModeValue('blue.700', 'blue.200')}
            >
              Address Info
            </Text>
            <Text
              fontSize="sm"
              color={useColorModeValue('gray.600', 'gray.400')}
            >
              Your physical address details
            </Text>
          </Box>

          {isEditing ? (
            <AddressInfoFields
              countryId={formData.countryId}
              stateId={formData.stateId}
              city={formData.city}
              streetLine1={formData.streetLine1}
              streetLine2={formData.streetLine2}
              zipCode={formData.zipCode}
              streetLine1Error={validationErrors.streetLine1 || ''}
              zipCodeError={validationErrors.zipCode || ''}
              cityError={validationErrors.city || ''}        
              countryError={validationErrors.countryId || ''}   
             stateError={validationErrors.stateId || ''}  

              onChange={handleAddressChange}
              loading={isSaving}
            />
          ) : (
            <SimpleGrid columns={{ sm: 1, md: 4 }} spacing={6}>

               <FormControl>
                <FormLabel fontWeight="600" fontSize="sm" color={labelColor}>
                  Address Line 1 <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <Text color={textColor} fontWeight="medium">{formData.streetLine1 || '-'}</Text>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="600" fontSize="sm" color={labelColor}>
                  Address Line 2 <Text as="span" color="red.500"></Text>
                </FormLabel>
                <Text color={textColor} fontWeight="medium">{formData.streetLine2 || '-'}</Text>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="600" fontSize="sm" color={labelColor}>
                  City <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <Text color={textColor} fontWeight="medium">{formData.city || '-'}</Text>
              </FormControl>
              <FormControl>
                <FormLabel fontWeight="600" fontSize="sm" color={labelColor}>
                  Country <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <Text color={textColor} fontWeight="medium">{formData.countryName || '-'}</Text>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="600" fontSize="sm" color={labelColor}>
                  State/Province <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <Text color={textColor} fontWeight="medium">{formData.stateName || '-'}</Text>
              </FormControl>

              
               <FormControl>
                <FormLabel fontWeight="600" fontSize="sm" color={labelColor}>
                  Zip/Postal Code <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <Text color={textColor} fontWeight="medium">{formData.zipCode || '-'}</Text>
              </FormControl>
              
            </SimpleGrid>
          )}
        </Box>

        {/* Save Button at Bottom */}
        {isEditing && (
          <Flex justify="flex-end" mt={6} mr={8} pt={4} pb={4} borderTopWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.600')}>
            <Button
              leftIcon={<MdSave size={14} />}
              size="sm"
              fontSize={14}
              onClick={handleSave}
              isLoading={isSaving}
              loadingText="Saving..."
              bg="green.500"
              color="white"
              borderRadius="lg"
              px={4}
              _hover={{
                bg: 'green.600',
                transform: 'translateY(-1px)'
              }}
              _active={{
                bg: 'green.700',
                transform: 'translateY(0)'
              }}
              transition="all 0.2s ease"
            >
              Save
            </Button>
          </Flex>
        )}
      </Card>

      <ConfirmationModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        onConfirm={handle2FAConfirm}
        title={`${pending2FAState ? 'Enable' : 'Disable'} Two-Factor Authentication`}
        message={pending2FAState
          ? 'Enabling 2FA adds an extra layer of security to your account. You will need to verify your identity using a second method when signing in.'
          : 'Disabling 2FA will remove the additional security layer from your account. Your account will only be protected by your password.'}
        confirmText={pending2FAState ? 'Enable 2FA' : 'Disable 2FA'}
        type={pending2FAState ? 'info' : 'warning'}
        isLoading={isToggling2FA}
      />
    </Flex>
  );
}