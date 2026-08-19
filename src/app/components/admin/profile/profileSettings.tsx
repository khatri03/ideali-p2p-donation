import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Flex,
  useColorModeValue,
  useToast,
  Center,
  FormControl,
  FormLabel,
  SimpleGrid,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { MdEdit, MdSave } from 'react-icons/md';
import {
  fetchOrganizerProfile,
  updateOrganizerProfile,
  ValidationErrors,
  ProfileSettingsProps,
  activateOrganizer,
  deactivateOrganizer
} from '../../../service/admin/profileService';
import ConfirmationModal from '../../common/ConfirmationModal';
import Loader from '../../common/Loader';
import { timeZoneResponseDto } from '../../../interface/CommonInter/timeZoneResponseDto';
import TimeZoneService from '../../../service/helpers/TimezoneService';
import Card from 'themeComponents/card/Card';
import ImageUpload from '../../common/ImageUpload';
import { uploadLogo } from '../../../service/admin/profileService';
import AddressInfoFields from '../../common/profileComponent/addressInfofields';
import { useAppDispatch } from '../../../../store/hooks';
import { setLogoUrl } from '../../../../store/slices/profileSlice';
import ContactDetailFields from '../../common/profileComponent/ContactDetailFields';
import OrganizerInfoFields from 'app/components/common/profileComponent/OrganizerInfoFields';

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
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [pendingStatusState, setPendingStatusState] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

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
    status: true,
  });

  const [originalData, setOriginalData] = useState({ ...formData });

  // ALL useColorModeValue calls at top level - never inside JSX
  const inputBg = useColorModeValue('gray.50', 'navy.900');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.100');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const textColor = useColorModeValue('gray.700', 'white');
  const headingColor = useColorModeValue('blue.700', 'blue.200');
  const subTextColor = useColorModeValue('gray.600', 'gray.400');
  const sectionBorderColor = useColorModeValue('gray.200', 'gray.600');

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

      const countryId = profileData.address?.countryInfo?.countryId ||
                       profileData.address?.countryId || 0;
      const countryName = profileData.address?.countryInfo?.name ||
                         profileData.address?.countryName || '';

      const stateId = profileData.address?.stateInfo?.stateId ||
                     profileData.address?.stateId || 0;
      const stateName = profileData.address?.stateInfo?.name ||
                       profileData.address?.stateName || '';

      const loadedData = {
        organizerName: profileData.organizer.name,
        shortName: profileData.organizer.shortName,
        timeZoneId: profileData.organizer.timeZoneId || 10,
        firstName: profileData.contact.firstName,
        middleName: profileData.contact.middleName,
        lastName: profileData.contact.lastName,
        primaryEmail: profileData.contact.primaryEmail,
        cellPhone: profileData.contact.cellPhone,
        streetLine1: profileData.address?.streetLine1,
        streetLine2: profileData.address?.streetLine2,
        zipCode: profileData.address?.zipCode,
        countryId: countryId,
        stateId: stateId,
        city: profileData.address?.city,
        countryName: countryName,
        stateName: stateName,
        status: profileData.organizer.status === 'Active',
      };

      console.log('📥 Loaded profile data:', {
        countryId,
        countryName,
        stateId,
        stateName,
        city: profileData.address?.city,
  rawAddress: profileData.address,
      });

      setFormData(loadedData);
      setOriginalData(loadedData);
      setTimeZoneOptionData(timeZoneData);

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
      k !== 'stateName' &&
      k !== 'streetLine2' &&
      k !== 'status'
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
    return (trimmed === '' || trimmed === 'null') ? null : trimmed;
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
          status: formData.status,
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
     console.log('🚀 Save payload address:', {
  countryId: formData.countryId,
  stateId: formData.stateId,
  city: formData.city,
  countryName: formData.countryName,
  stateName: formData.stateName,
});
      await updateOrganizerProfile(storedId, updatePayload);

      if (logoFile) {
        try {
          await uploadLogo(storedId, logoFile);
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

  const openStatusModal = (active: boolean) => {
    setPendingStatusState(active);
    setIsStatusModalOpen(true);
  };

  const handleStatusConfirm = async () => {
    setIsTogglingStatus(true);
    setIsStatusModalOpen(false);
    try {
      const storedId = organizerUniqueId ||
        localStorage.getItem('organizerUniqueId') ||
        localStorage.getItem('organizerId');

      if (pendingStatusState) {
        await activateOrganizer(storedId);
      } else {
        await deactivateOrganizer(storedId);
      }

      setFormData(prev => ({ ...prev, status: pendingStatusState }));
      setOriginalData(prev => ({ ...prev, status: pendingStatusState }));

      toast({
        title: `Organizer ${pendingStatusState ? 'Activated' : 'Deactivated'}`,
        description: `Organizer has been ${pendingStatusState ? 'activated' : 'deactivated'} successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: `Failed to ${pendingStatusState ? 'activate' : 'deactivate'} organizer`,
        description: error.message || 'Something went wrong. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData({ ...formData, [field]: value });
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateField(field, String(value));
    setValidationErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleAddressChange = (field: string, value: string | number, additionalData?: { countryName?: string; stateName?: string }) => {
    console.log('Address field changed:', field, value, additionalData);

    const updates: any = { [field]: value };

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

  const shouldShowError = (field: string): boolean => {
    return isEditing && touchedFields.has(field) && !!validationErrors[field as keyof ValidationErrors];
  };

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
                <Text fontSize="2xl" fontWeight="700" mb={2} color={headingColor}>
                  Organizer Info
                </Text>
                <Text fontSize="sm" color={subTextColor}>
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
                    _hover={{ color: 'blue.600', transform: 'scale(1.1)' }}
                    _active={{ color: 'blue.700', transform: 'scale(0.95)' }}
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
                    _hover={{ color: 'red.500', transform: 'scale(1.1)' }}
                    _active={{ color: 'red.600', transform: 'scale(0.95)' }}
                    transition="all 0.2s ease"
                  />
                </Tooltip>
              )}
            </Flex>
          </Box>

          <Box w="100%">
            <OrganizerInfoFields
              organizerName={formData.organizerName}
              timeZoneId={formData.timeZoneId}
              timeZoneOptionData={timeZoneOptionData}
              organizerNameError={shouldShowError('organizerName') ? validationErrors.organizerName : undefined}
              onChange={handleChange}
              onBlur={handleBlur}
              isEditing={isEditing}
              status={formData.status}
              isTogglingStatus={isTogglingStatus}
              onStatusChange={openStatusModal}
            />
          </Box>
        </Box>

        {/* Contact Detail Section */}
        <Box mb={6}>
          <Box mb={6}>
            <Text fontSize="2xl" fontWeight="700" mb={2} color={headingColor}>
              Contact Detail
            </Text>
            <Text fontSize="sm" color={subTextColor}>
              Your contact information
            </Text>
          </Box>

          <ContactDetailFields
            firstName={formData.firstName}
            lastName={formData.lastName}
            middleName={formData.middleName}
            primaryEmail={formData.primaryEmail}
            cellPhone={formData.cellPhone}
            firstNameError={shouldShowError('firstName') ? validationErrors.firstName : undefined}
            lastNameError={shouldShowError('lastName') ? validationErrors.lastName : undefined}
            middleNameError={shouldShowError('middleName') ? validationErrors.middleName : undefined}
            primaryEmailError={shouldShowError('primaryEmail') ? validationErrors.primaryEmail : undefined}
            cellPhoneError={shouldShowError('cellPhone') ? validationErrors.cellPhone : undefined}
            onChange={handleChange}
            onBlur={handleBlur}
            isEditing={isEditing}
          />
        </Box>

        {/* Address Info Section */}
        <Box mb={6}>
          <Box mb={6}>
            <Text fontSize="2xl" fontWeight="700" mb={2} color={headingColor}>
              Address Info
            </Text>
            <Text fontSize="sm" color={subTextColor}>
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
                  Address Line 2
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
          <Flex justify="flex-end" mt={6} mr={8} pt={4} pb={4} borderTopWidth="1px" borderColor={sectionBorderColor}>
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
              _hover={{ bg: 'green.600', transform: 'translateY(-1px)' }}
              _active={{ bg: 'green.700', transform: 'translateY(0)' }}
              transition="all 0.2s ease"
            >
              Save
            </Button>
          </Flex>
        )}
      </Card>

      <ConfirmationModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleStatusConfirm}
        title={`${pendingStatusState ? 'Activate' : 'Deactivate'} Organizer`}
        message={pendingStatusState
          ? 'Are you sure you want to activate this organizer? They will regain access to the platform.'
          : 'Are you sure you want to deactivate this organizer? They will lose access to the platform.'}
        confirmText={pendingStatusState ? 'Activate' : 'Deactivate'}
        type={pendingStatusState ? 'info' : 'warning'}
        isLoading={isTogglingStatus}
      />
    </Flex>
  );
}