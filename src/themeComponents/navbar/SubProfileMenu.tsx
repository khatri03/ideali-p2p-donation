import {
  Box,
  Flex,
  Text,
  Icon,
  Badge,
  Divider,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Input,
  Textarea,
  Button,
  FormLabel,
  FormControl,
  IconButton,
  Spinner,
} from '@chakra-ui/react';
import { MdPeople, MdChevronRight, MdAdd, MdCheck, MdEdit, MdClose } from 'react-icons/md';
import { useState, useEffect, useRef } from 'react';
import SubProfileService from '../../app/service/admin/SubProfileService';
import Loader from 'app/components/common/Loader';
import { useToast } from '@chakra-ui/react';

interface SubProfile {
  uniqueId: string;
  name: string;
}

interface SubProfileMenuProps {
  subProfiles: SubProfile[];
  onCreateClick: () => void;
  onRefresh: () => void;
  canCreate?: boolean;
  canEdit?: boolean;
}

export default function SubProfileMenu({ subProfiles, onCreateClick, onRefresh, canCreate = true, canEdit = true }: SubProfileMenuProps) {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  // Edit modal state
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const bgHover = useColorModeValue('gray.50', 'gray.700');
  const submenuBg = useColorModeValue('white', 'navy.700');
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editNameError, setEditNameError] = useState('');

const validateEditName = (value: string) => {
  if (value.length >= 0 && value.length < 3) {
    return 'Name must be between 3 and 40 characters.';
  }
  if (value.length > 40) {
    return 'Name must be between 3 and 40 characters.';
  }
  return '';
};

  const handleMouseEnter = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setShowSubmenu(true);
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => {
      setShowSubmenu(false);
    }, 150);
  };

  useEffect(() => {
    const currentProfile = localStorage.getItem('currentSubProfile');
    setActiveProfileId(currentProfile);
  }, []);

  // Fetch profile detail when edit modal opens
  useEffect(() => {
    if (!editingProfileId) return;

    const fetchDetail = async () => {
      setIsFetching(true);
      setFetchError(null);
      try {
        const res = await SubProfileService.getSubProfileDetail(editingProfileId);
        if (res.success && res.data) {
          setEditName(res.data.name || '');
          setEditDescription(res.data.description || '');
        } else {
          setFetchError('Failed to load profile details.');
        }
      } catch (error) {
        console.error('Failed to fetch sub profile detail:', error);
        setFetchError('An error occurred while loading profile details.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchDetail();
  }, [editingProfileId]);

  const isDefaultActive = !activeProfileId || activeProfileId === 'default';

  const handleEditClick = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation(); // prevent triggering profile switch
    setEditName('');
    setEditDescription('');
    setFetchError(null);
    setEditingProfileId(profileId);
     setEditNameError('');
    setShowSubmenu(false);
  };

  const handleCloseModal = () => {
    setEditingProfileId(null);
    setEditName('');
    setEditDescription('');
    setFetchError(null);
    setEditNameError('');
  };

  // Add this with other hooks at the top:
const toast = useToast();

// Replace handleEditSubmit with:
const handleEditSubmit = async () => {
  if (!editingProfileId) return;
  setIsSaving(true);
  try {
    const response = await SubProfileService.updateSubProfile(editingProfileId, {
      name: editName,
      description: editDescription,
    });

    if (!response.success) {
      toast({
        title: 'Failed to update sub profile',
        description: response.message || 'Something went wrong. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    toast({
      title: 'Sub profile updated successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
    handleCloseModal();
    onRefresh();
  } catch (error: any) {
    const errorData = error?.response?.data;
const validationErrors = errorData?.errors
  ? Object.entries(errorData.errors)
      .map(([field, messages]) => `${field.charAt(0).toUpperCase() + field.slice(1)}: ${(messages as string[]).join(', ')}`)
      .join('\n')
  : null;
const backendMessage =
  validationErrors ||
  errorData?.title ||
  error?.message ||
  'Something went wrong. Please try again.';
    toast({
      title: 'Failed to update sub profile',
      description: backendMessage,
      status: 'error',
      duration: 5000,
      isClosable: true,
      position: 'top-right',
    });
  } finally {
    setIsSaving(false);
  }
};

  return (
    <>
      <Box
        position="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Main Menu Item */}
        <Flex
          w="100%"
          alignItems="center"
          justifyContent="space-between"
          px={{ base: '12px', md: '14px' }}
          py={{ base: '8px', md: '10px' }}
          borderRadius="8px"
          cursor="pointer"
          _hover={{ bg: bgHover }}
          transition="background 0.15s ease"
        >
          <Flex alignItems="center" gap="8px">
            <Icon as={MdPeople} w="16px" h="16px" color="gray.500" />
            <Text fontSize={{ base: 'xs', md: 'sm' }}>Switch Sub Profile</Text>
          </Flex>
          <Icon as={MdChevronRight} w="18px" h="18px" color="gray.400" />
        </Flex>

        {/* Submenu */}
        {showSubmenu && (
          <Box
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            position="absolute"
            right="100%"
            top="0"
            mr="8px"
            minW="220px"
            bg={submenuBg}
            borderRadius="12px"
            boxShadow="0 4px 12px rgba(0,0,0,0.15)"
            py="8px"
            zIndex={1000}
          >
            {/* Default (Parent) profile */}
            <Flex
              px="14px"
              py="8px"
              cursor="pointer"
              bg={isDefaultActive ? 'blue.50' : 'transparent'}
              _hover={{ bg: 'blue.50' }}
              transition="background 0.15s ease"
              onClick={async () => {
                try {
                  await SubProfileService.setDefaultSubProfile();
                  localStorage.setItem('currentSubProfile', 'default');
                  window.location.reload();
                } catch (error) {
                  console.error('Failed to switch to default profile:', error);
                }
              }}
              alignItems="center"
              justifyContent="space-between"
            >
              <Flex alignItems="center" gap="6px">
                <Text fontSize="sm" fontWeight="600" color="gray.700">
                  Default
                </Text>
                <Badge colorScheme="blue" fontSize="9px" borderRadius="4px" px="6px">
                  Parent
                </Badge>
              </Flex>
              {isDefaultActive && (
                <Icon as={MdCheck} w="18px" h="18px" color="blue.500" />
              )}
            </Flex>

            <Divider my="4px" />

            {/* Sub profiles list */}
            {subProfiles.map((profile) => {
              const isActive = activeProfileId === profile.uniqueId;
              return (
                <Flex
                  key={profile.uniqueId}
                  px="14px"
                  py="8px"
                  cursor="pointer"
                  bg={isActive ? 'blue.50' : 'transparent'}
                  _hover={{ bg: bgHover }}
                  transition="background 0.15s ease"
                  onClick={async () => {
                    try {
                      await SubProfileService.switchSubProfile(profile.uniqueId);
                      localStorage.setItem('currentSubProfile', profile.uniqueId);
                      window.location.reload();
                    } catch (error) {
                      console.error('Failed to switch sub profile:', error);
                    }
                  }}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Flex alignItems="center" gap="6px">
  <Text fontSize="sm">{profile.name}</Text>
  {isActive && (
    <Icon as={MdCheck} w="18px" h="18px" color="blue.500" />
  )}
</Flex>

                  {canEdit && (
                    <Flex alignItems="center" gap="6px">
                      {/* Edit Button */}
                      <IconButton
                        aria-label="Edit sub profile"
                        icon={<Icon as={MdEdit} w="14px" h="14px" />}
                        size="xs"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={(e) => handleEditClick(e, profile.uniqueId)}
                        _hover={{ bg: 'blue.100' }}
                        transition="background 0.15s ease"
                      />
                    </Flex>
                  )}
                </Flex>
              );
            })}

            {canCreate && (
              <>
                <Divider my="4px" />
                {/* Create Sub Profile */}
                <Flex
                  px="14px"
                  py="8px"
                  cursor="pointer"
                  _hover={{ bg: 'blue.50' }}
                  transition="background 0.15s ease"
                  onClick={onCreateClick}
                >
                  <Flex alignItems="center" gap="6px">
                    <Icon as={MdAdd} w="14px" h="14px" color="#044bd9" />
                    <Text fontSize="sm" color="#044bd9" fontWeight="500">
                      Create Sub Profile
                    </Text>
                  </Flex>
                </Flex>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Edit Sub Profile Modal */}
      <Modal isOpen={!!editingProfileId} onClose={handleCloseModal} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="16px" maxW="460px" mx="16px">
          <ModalBody p="28px">
            {/* Header */}
            <Flex justifyContent="space-between" alignItems="flex-start" mb="4px">
              <Text fontSize="lg" fontWeight="700" color="gray.800">
                Edit Sub Profile
              </Text>
              <IconButton
                aria-label="Close modal"
                icon={<Icon as={MdClose} w="18px" h="18px" />}
                size="sm"
                variant="outline"
                borderRadius="8px"
                onClick={handleCloseModal}
              />
            </Flex>

            <Text fontSize="sm" color="gray.500" mb="24px">
              Update your sub profile details for managing campaigns and events separately.
            </Text>

            {/* Loading state */}
            {isFetching ? (
               <Loader message="Loading Profile..." subtitle="Please wait" />
            ) : fetchError ? (
              <Flex justifyContent="center" alignItems="center" py="40px">
                <Text fontSize="sm" color="red.500">{fetchError}</Text>
              </Flex>
            ) : (
              <>
                {/* Sub Profile Name */}
                <FormControl mb="16px" isInvalid={!!editNameError}>
  <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb="6px">
    Sub Profile Name
  </FormLabel>
  <Input
    placeholder="Enter sub profile name"
    value={editName}
    onChange={(e) => {
      const filtered = e.target.value.replace(/[^a-zA-Z0-9 _-]/g, '');
      setEditName(filtered);
      setEditNameError(validateEditName(filtered));
    }}
    borderRadius="10px"
    fontSize="sm"
    borderColor="gray.200"
    maxLength={40}
    _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9' }}
  />
  {editNameError && (
    <Text fontSize="xs" color="red.500" mt="4px">{editNameError}</Text>
  )}
</FormControl>

                {/* Description */}
                <FormControl mb="24px">
                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb="6px">
                    Description
                  </FormLabel>
                  <Textarea
                   maxLength={150}
                    placeholder="Enter description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    borderRadius="10px"
                    fontSize="sm"
                    borderColor="gray.200"
                    rows={4}
                    resize="vertical"
                    _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9' }}
                  />
                </FormControl>

                {/* Submit Button */}
                <Button
                  w="100%"
                  bg="#044bd9"
                  color="white"
                  borderRadius="10px"
                  fontSize="sm"
                  fontWeight="600"
                  py="14px"
                  _hover={{ bg: '#0339a8' }}
                  _active={{ bg: '#022d8a' }}
                  onClick={handleEditSubmit}
                  isLoading={isSaving}
                  loadingText="Saving..."
                 isDisabled={!editName.trim() || !!editNameError || editName.trim().length < 3 || isFetching}
                >
                  Save Sub Profile
                </Button>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}