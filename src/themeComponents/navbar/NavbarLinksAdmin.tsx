// Chakra Imports
import {
  Avatar,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
  Badge,
  useToast,
  HStack,
  Divider,
  Icon,
  Button,
  useMediaQuery,
  Box,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Textarea,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { MdSwapHoriz } from 'react-icons/md';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProfileLogo } from '../../store/slices/profileSlice';
import SubProfileService from '../../app/service/admin/SubProfileService';
import SubProfileMenu from './SubProfileMenu';
import { getStoredPermissions, isMainOrganizer, isRealAdmin } from '../../app/service/organizer/rolesPermissions/permissionsService';


import { MdEmail, MdBusiness, MdHome, MdCameraAlt, MdPeople, MdChevronRight, MdExpandMore, MdAdd } from 'react-icons/md';
import ChangePasswordDialog from '../../app/components/organizer/donation/organizerDonationComponents/changePasswordDialog';
import NotificationBell from './NotificationBell';
import MemberNotificationBell from '../../app/components/member/notifications/NotificationBell';
// Placeholder profile image (generic person silhouette as data URI)
const PLACEHOLDER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Ccircle cx='64' cy='64' r='64' fill='%23e2e8f0'/%3E%3Ccircle cx='64' cy='50' r='22' fill='%23a0aec0'/%3E%3Cellipse cx='64' cy='114' rx='38' ry='32' fill='%23a0aec0'/%3E%3C/svg%3E";

// Helper: get user info from JWT
const getUserInfo = () => {
  try {
    const token = localStorage.getItem('AuthToken');
    if (!token) return null;

    const decoded = jwtDecode(token) as Record<string, any>;
    const roleKey = Object.keys(decoded).find((key) =>
      key.toLowerCase().includes('role'),
    );
    const userRoles =
      roleKey && decoded[roleKey]
        ? Array.isArray(decoded[roleKey])
          ? decoded[roleKey]
          : [decoded[roleKey]]
        : [];

    // Safely handle allowedModules - ensure it's always an array
    let allowedModules: string[] = [];
    if (decoded.allowedModules) {
      if (Array.isArray(decoded.allowedModules)) {
        allowedModules = decoded.allowedModules;
      } else if (typeof decoded.allowedModules === 'string') {
        allowedModules = decoded.allowedModules.includes(',')
          ? decoded.allowedModules.split(',').map((m: string) => m.trim())
          : [decoded.allowedModules];
      }
    }

    return {
      userName: decoded.userName || 'User',
      userEmail: decoded.userEmail || '',
      userOrg: decoded.userOrg || '',
      roles: userRoles,
      allowedModules: allowedModules,
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export default function HeaderLinks(props: {
  secondary: boolean;
  [x: string]: any;
}) {
  const { secondary } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isSubProfileOpen, onOpen: onSubProfileOpen, onClose: onSubProfileClose } = useDisclosure();
  const [subProfileName, setSubProfileName] = useState('');
  const [subProfileDescription, setSubProfileDescription] = useState('');
  const [subProfileLoading, setSubProfileLoading] = useState(false);
  const dispatch = useAppDispatch();
  const logoUrl = useAppSelector((state) => state.profile.logoUrl);
  const profileFetched = useAppSelector((state) => state.profile.fetched);
  const [showSubProfiles, setShowSubProfiles] = useState(false);
  const [subProfiles, setSubProfiles] = useState<any[]>([]);
  const toast = useToast();

  const isGoogleLogin = localStorage.getItem('loginProvider') === 'google';

  const [userInfo, setUserInfo] = useState({
    userName: 'User',
    userEmail: '',
    userOrg: '',
    roles: [] as string[],
    allowedModules: [] as string[],
  });

  const [subProfileNameError, setSubProfileNameError] = useState('');

  const isOrganizerPage = location.pathname.startsWith('/organizer');
  const isMemberPage = location.pathname.startsWith('/member');
  // Notification bell on the member portal is restricted to the "Member" role
  // (not "Donor") — matches the same currentRole check used in memberRoutes.tsx.
  const isMemberRole = localStorage.getItem('currentRole') === 'Member';

const validateSubProfileName = (value: string) => {
  if (value.length >= 0 && value.length < 3) {
    return 'Name must be between 3 and 40 characters.';
  }
  if (value.length > 40) {
    return 'Name must be between 3 and 40 characters.';
  }
  return '';
};

  // Determine if we're on admin or organizer dashboard
  const isOnAdminDashboard = location.pathname.includes('/admin');
  const dashboardButtonText = isOnAdminDashboard ? 'Switch to Organizer' : 'Switch to Admin';
  const dashboardButtonPath = isOnAdminDashboard ? '/organizer/organizer-dashboard' : '/admin/admin-dashboard';
  const dashboardButtonColor = isOnAdminDashboard ? 'blue' : 'purple';

  // Real admin: userId === organizerId AND has system 'Admin' role in JWT
  const hasAdminRole = isRealAdmin();

  // Determine if switch button should be shown
  const showSwitchButton = isOnAdminDashboard ? true : hasAdminRole;

  // Sub-profile permission checks
  // Main organizer: carries the system-assigned "Organizer" role in the JWT
  const _storedPermissions = getStoredPermissions();
  const _isMainOrganizer = isMainOrganizer();
  const _noRestrictions = _isMainOrganizer;
  const canViewSubProfile = _noRestrictions || _storedPermissions.includes('Donation.SubProfile.View') || _storedPermissions.includes('Donation.SubProfile.Create') || _storedPermissions.includes('Donation.SubProfile.Edit');
  const canCreateSubProfile = _noRestrictions || _storedPermissions.includes('Donation.SubProfile.Create');
  const canEditSubProfile = _noRestrictions || _storedPermissions.includes('Donation.SubProfile.Edit');

  useEffect(() => {
    const info = getUserInfo();
    if (info) {
      setUserInfo({
        userName: info.userName,
        userEmail: info.userEmail,
        userOrg: info.userOrg,
        roles: Array.isArray(info.roles) ? info.roles : [],
        allowedModules: Array.isArray(info.allowedModules) ? info.allowedModules : [],
      });
    }

    // Organizer-only concepts: skip entirely on the member/donor portal.
    if (isMemberPage) return;

    // Fetch organizer profile logo into Redux
    dispatch(fetchProfileLogo());

    // Only fetch sub-profiles if user has permission (avoids 403 for users without access)
    const isMainOrg = isMainOrganizer();
    const permissions = getStoredPermissions();
    const hasSubProfileAccess = isMainOrg ||
      permissions.includes('Donation.SubProfile.View') ||
      permissions.includes('Donation.SubProfile.Create') ||
      permissions.includes('Donation.SubProfile.Edit');

    if (hasSubProfileAccess) {
      fetchSubProfiles();
    }
  }, []);

  const handleSubProfileModalClose = () => {
  setSubProfileName('');
  setSubProfileDescription('');
  setSubProfileNameError('');
  onSubProfileClose();
};
  const fetchSubProfiles = async () => {
    try {
      const response = await SubProfileService.getSubProfiles();
      if (response.success && response.data?.pageData) {
        setSubProfiles(response.data.pageData);
      }
    } catch (error) {
      console.error('Failed to fetch sub profiles:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();

    localStorage.removeItem('AuthToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('sidebarType');
    localStorage.removeItem('currentRole');

    navigate('/auth/sign-in/custom');
  };

  const handleCreateSubProfile = async () => {
  try {
    setSubProfileLoading(true);
    const response = await SubProfileService.createSubProfile({
      name: subProfileName.trim(),
      description: subProfileDescription.trim(),
    });

    if (!response.success) {
      toast({
        title: 'Failed to create sub profile',
        description: response.message || 'Something went wrong. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    setSubProfileName('');
    setSubProfileDescription('');
    onSubProfileClose();
    fetchSubProfiles();
    toast({
      title: 'Sub profile created successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong. Please try again.';
    toast({
      title: 'Failed to create sub profile',
      description: backendMessage,
      status: 'error',
      duration: 5000,
      isClosable: true,
      position: 'top-right',
    });
  } finally {
    setSubProfileLoading(false);
  }
};

  // Chakra Color Mode
  const menuBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('#E6ECFA', 'rgba(135, 140, 189, 0.3)');
  const shadow = useColorModeValue(
    '14px 17px 40px 4px rgba(112, 144, 176, 0.18)',
    '14px 17px 40px 4px rgba(112, 144, 176, 0.06)',
  );

  return (
    <Box>
      <Flex
        w="auto"
        h="auto"
        alignItems="center"
        justifyContent="center"
        flexDirection="row"
        bg="transparent"
        flexWrap={secondary ? { base: 'wrap', md: 'nowrap' } : 'unset'}
        p="0px"
        borderRadius={{ base: 'none', md: '999px' }}
        boxShadow="none"
        gap={3}
      >
        {/* Notification bell — organizer pages only */}
        {isOrganizerPage && <Box order={2}><NotificationBell /></Box>}

        {/* Notification bell — member portal, "Member" role only (not "Donor") */}
        {isMemberPage && isMemberRole && <Box order={1}><MemberNotificationBell /></Box>}

        {/* Member/donor portal: no organizer branding/profile image, just account actions */}
        {isMemberPage && (
          <Menu>
            <MenuButton
              as={Box}
              order={0}
              p="0px"
              bg="transparent"
              _hover={{ bg: 'transparent' }}
              _focus={{ bg: 'transparent' }}
              _active={{ bg: 'transparent' }}
              cursor="pointer"
              transition="transform 0.18s ease"
              sx={{ '&:hover .avatar-ring': { transform: 'scale(1.08)', boxShadow: '0 0 0 3px rgba(4, 75, 217, 0.25)' } }}
            >
              <Avatar
                className="avatar-ring"
                name={userInfo.userName}
                size="sm"
                bg="brand.500"
                color="white"
                fontWeight="700"
                transition="transform 0.18s ease, box-shadow 0.18s ease"
              />
            </MenuButton>
            <MenuList
              boxShadow={shadow}
              p="0px"
              mt={{ base: '8px', md: '10px' }}
              borderRadius="20px"
              bg={menuBg}
              border="none"
              minW={{ base: '200px', md: '220px' }}
            >
              <Flex flexDirection="column" p={{ base: '8px', md: '10px' }}>
                <MenuItem
                  _hover={{ bg: 'blue.50' }}
                  _focus={{ bg: 'blue.50' }}
                  transition="background 0.15s ease"
                  borderRadius="8px"
                  px={{ base: '12px', md: '14px' }}
                  py={{ base: '8px', md: '10px' }}
                  onClick={onOpen}
                  isDisabled={isGoogleLogin}
                >
                  <Text fontSize={{ base: 'xs', md: 'sm' }}>Change password</Text>
                </MenuItem>
                <MenuItem
                  _hover={{ bg: 'blue.50' }}
                  _focus={{ bg: 'red.50' }}
                  transition="background 0.15s ease"
                  color="red.400"
                  borderRadius="8px"
                  px={{ base: '12px', md: '14px' }}
                  py={{ base: '8px', md: '10px' }}
                  onClick={handleLogout}
                >
                  <Text fontSize={{ base: 'xs', md: 'sm' }}>Log out</Text>
                </MenuItem>
              </Flex>
            </MenuList>
          </Menu>
        )}

        {/* Profile menu — organizer/admin only (shows the organization's logo) */}
        {!isMemberPage && (
        <Box
          order={1}
          position="relative"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            '@keyframes pulseArc': {
              '0%, 100%': { opacity: 0.4, boxShadow: '0 0 0 0 rgba(4, 75, 217, 0.2)' },
              '50%': { opacity: 1, boxShadow: '0 0 10px 3px rgba(4, 75, 217, 0.4)' },
            },
            '@keyframes fadeArc': {
              '0%, 100%': { opacity: 0.3 },
              '50%': { opacity: 1 },
            },
            '@keyframes popBounce': {
              '0%, 100%': { transform: 'translateY(-50%) scale(0.85)', opacity: 0.6 },
              '50%': { transform: 'translateY(-50%) scale(1.1)', opacity: 1 },
            },
          }}
        >
          {/* Upload profile image animation - only when no image is set */}
          {profileFetched && !logoUrl && (
            <>
              {/* Round pulsing shadow glow behind avatar */}
              <Box
                position="absolute"
                top="-4px"
                left="-4px"
                w={{ base: 'calc(52px + 8px)', md: 'calc(56px + 8px)' }}
                h={{ base: 'calc(52px + 8px)', md: 'calc(56px + 8px)' }}
                borderRadius="full"
                animation="pulseArc 2s ease-in-out infinite"
                pointerEvents="none"
                zIndex={1}
              />
              {/* Left-arc border fading light/dark */}
              <Box
                position="absolute"
                top="-4px"
                left="-4px"
                w={{ base: 'calc(52px + 8px)', md: 'calc(56px + 8px)' }}
                h={{ base: 'calc(52px + 8px)', md: 'calc(56px + 8px)' }}
                borderRadius="full"
                border="3px solid #044bd9"
                clipPath="inset(0 50% 0 0)"
                animation="fadeArc 2s ease-in-out infinite"
                pointerEvents="none"
                zIndex={2}
              />
              {/* Text with arrow pointing right towards avatar — main organizer only */}
              {_isMainOrganizer && (
                <Box
                  as={Link}
                  to="/organizer/setting/profile-settings"
                  position="absolute"
                  right={{ base: 'calc(100% + 6px)', md: 'calc(100% + 8px)' }}
                  top="50%"
                  transform="translateY(-50%)"
                  animation="popBounce 2s ease-in-out infinite"
                  zIndex={3}
                  cursor="pointer"
                  _hover={{ textDecoration: 'none' }}
                >
                  <Flex alignItems="center" gap="4px" whiteSpace="nowrap">
                    <Icon as={MdCameraAlt} w={{ base: '12px', md: '14px' }} h={{ base: '12px', md: '14px' }} color="#044bd9" />
                    <Text
                      fontSize={{ base: '10px', md: '11px' }}
                      fontWeight="600"
                      color="#044bd9"
                    >
                      Set up the logo
                    </Text>
                    <Text color="#044bd9" fontSize={{ base: '14px', md: '16px' }} lineHeight="1">
                      &#8594;
                    </Text>
                  </Flex>
                </Box>
              )}
            </>
          )}
        <Menu>
           <MenuButton
    as={Box}
    p="0px"
    bg="transparent"
    _hover={{ bg: 'transparent' }}
    _focus={{ bg: 'transparent' }}
    _active={{ bg: 'transparent' }}
    cursor="pointer"
    position="relative"
    zIndex={5}
    sx={{ '&:hover .navbar-avatar-circle': { transform: 'scale(1.06)', boxShadow: '0 4px 14px rgba(4, 75, 217, 0.25)' } }}
  >
    <Flex alignItems="center">
      {/* Avatar Circle */}
      <Box
        className="navbar-avatar-circle"
        bg={{ base: 'white', md: 'white' }}
        borderRadius="999px"
        w={{ base: '52px', md: '56px' }}
        h={{ base: '52px', md: '56px' }}
        display="flex"
        alignItems="center"
        justifyContent="center"
        border={{ base: '2px solid white', md: '2px solid white' }}
        boxShadow={{ base: '0 2px 8px rgba(0,0,0,0.15)', md: '0 2px 6px rgba(0,0,0,0.1)' }}
        transition="transform 0.18s ease, box-shadow 0.18s ease"
      >
        <Avatar
          color="white"
          name={logoUrl ? userInfo.userName : undefined}
          src={logoUrl || undefined}
          icon={!logoUrl ? <Icon as={MdCameraAlt} w="50%" h="50%" color="gray.400" /> : undefined}
          bg={!logoUrl ? 'gray.100' : '#e2e8f0'}
          size="sm"
          w={{ base: '44px', md: '48px' }}
          h={{ base: '44px', md: '48px' }}
          position="relative"
          zIndex={0}
        />
      </Box>

      {/* Name pill extending to the right from avatar circle */}
<Flex
  display={{ base: 'none', md: 'flex' }}
  ml="-25px"
  pl="28px"
  pr="16px"
  h="50px"
  alignItems="center"
  bg="white"
  borderRightRadius="full"
  boxShadow="0 2px 8px rgba(0,0,0,0.15)"
  border="1px solid"
  borderColor="gray.100"
  zIndex={-1} // Change from 0 to -1
>
  <Box maxW="130px">
    <Text fontSize="sm" fontWeight="600" color={textColor} whiteSpace="nowrap" lineHeight="1.2" overflow="hidden" textOverflow="ellipsis" maxW="130px">
      {userInfo.userName.length > 15 ? userInfo.userName.slice(0, 15) + '..' : userInfo.userName}
    </Text>
    {/* <Text fontSize="xs" color="gray.500" whiteSpace="nowrap" lineHeight="1.5" overflow="hidden" textOverflow="ellipsis" maxW="130px">
      {userInfo.userOrg.length > 15 ? userInfo.userOrg.slice(0, 15) + '..' : userInfo.userOrg}
    </Text> */}

    <Text fontSize="xs" color="gray.500" whiteSpace="nowrap" lineHeight="1.5" overflow="hidden" textOverflow="ellipsis" maxW="130px">
  {(() => {
    const activeProfileId = localStorage.getItem('currentSubProfile');
    if (activeProfileId && activeProfileId !== 'default') {
      const activeProfile = subProfiles.find(p => p.uniqueId === activeProfileId);
      if (activeProfile) {
        return activeProfile.name.length > 15 ? activeProfile.name.slice(0, 15) + '..' : activeProfile.name;
      }
    }
    return userInfo.userName.length > 15 ? userInfo.userName.slice(0, 15) + '..' : userInfo.userName;
  })()}
</Text>
  </Box>

</Flex>
    </Flex>
  </MenuButton>

          <MenuList
            boxShadow={shadow}
            p="0px"
            mt={{ base: '8px', md: '10px' }}
            borderRadius="20px"
            bg={menuBg}
            border="none"
            minW={{ base: '280px', sm: '300px', md: '320px' }}
            maxW={{ base: 'calc(100vw - 40px)', md: '320px' }}
          >
            {/* Greeting */}
            <Flex w="100%" mb="0px">
              <Text
                ps={{ base: '16px', md: '20px' }}
                pt={{ base: '12px', md: '16px' }}
                pb={{ base: '8px', md: '10px' }}
                w="100%"
                borderBottom="1px solid"
                borderColor={borderColor}
                fontSize={{ base: 'xs', md: 'sm' }}
                fontWeight="700"
                color={textColor}
                noOfLines={1}
              >
                👋&nbsp; Hey, {userInfo.userName}
              </Text>
            </Flex>
            {/* Profile-only actions */}
            <Flex flexDirection="column" p={{ base: '8px', md: '10px' }}>
              {/* Dynamic Dashboard Switch Button - Only show if user has appropriate permissions */}
              {showSwitchButton && (
                <>
                  <MenuItem
                    _hover={{ bg: 'blue.50' }}
                    _focus={{ bg: 'blue.50' }}
                    transition="background 0.15s ease"
                    borderRadius="8px"
                    px={{ base: '12px', md: '14px' }}
                    py={{ base: '8px', md: '10px' }}
                    onClick={() => navigate(dashboardButtonPath)}
                    icon={
                      <Icon
                        as={MdSwapHoriz}
                        width={{ base: '18px', md: '20px' }}
                        height={{ base: '18px', md: '20px' }}
                        color={dashboardButtonColor + '.500'}
                      />
                    }
                  >
                    <Text fontSize={{ base: 'xs', md: 'sm' }}>{dashboardButtonText}</Text>
                  </MenuItem>
                  <Divider my={{ base: '6px', md: '8px' }} />
                </>
              )}

            
              {/* Switch Sub Profile */}
            {canViewSubProfile && (
              <SubProfileMenu
                subProfiles={subProfiles}
                onCreateClick={onSubProfileOpen}
                onRefresh={fetchSubProfiles}
                canCreate={canCreateSubProfile}
                canEdit={canEditSubProfile}
              />
            )}
{/* <Divider my={{ base: '4px', md: '6px' }} /> */}
              {/* Sub profile options */}
              {showSubProfiles && (
                <Box pl={{ base: '20px', md: '24px' }} pr={{ base: '8px', md: '10px' }}>
                  {/* Default (Parent) profile */}
                  <MenuItem
                    _hover={{ bg: 'blue.50' }}
                    _focus={{ bg: 'blue.50' }}
                    transition="background 0.15s ease"
                    borderRadius="8px"
                    px={{ base: '12px', md: '14px' }}
                    py={{ base: '6px', md: '8px' }}
                    bg="gray.50"
                    onClick={async () => {
                      try {
                        await SubProfileService.setDefaultSubProfile();
                        window.location.reload();
                      } catch (error) {
                        console.error('Failed to switch to default profile:', error);
                      }
                    }}
                  >
                    <Flex alignItems="center" gap="6px">
                      <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600" color="gray.700">Default</Text>
                      <Badge colorScheme="blue" fontSize="9px" borderRadius="4px" px="6px">Parent</Badge>
                    </Flex>
                  </MenuItem>
                  <Divider my="4px" />
                  {subProfiles.map((profile) => (
                    <MenuItem
                      key={profile.uniqueId}
                      _hover={{ bg: 'gray.50' }}
                      _focus={{ bg: 'gray.50' }}
                      transition="background 0.15s ease"
                      borderRadius="8px"
                      px={{ base: '12px', md: '14px' }}
                      py={{ base: '6px', md: '8px' }}
                      onClick={async () => {
                        try {
                          await SubProfileService.switchSubProfile(profile.uniqueId);
                          window.location.reload();
                        } catch (error) {
                          console.error('Failed to switch sub profile:', error);
                        }
                      }}
                    >
                      <Text fontSize={{ base: 'xs', md: 'sm' }}>{profile.name}</Text>
                    </MenuItem>
                  ))}
                  {canCreateSubProfile && (
                    <>
                      <Divider my="4px" />
                      <MenuItem
                        _hover={{ bg: 'blue.50' }}
                        _focus={{ bg: 'blue.50' }}
                        transition="background 0.15s ease"
                        borderRadius="8px"
                        px={{ base: '12px', md: '14px' }}
                        py={{ base: '6px', md: '8px' }}
                        onClick={onSubProfileOpen}
                      >
                        <Flex alignItems="center" gap="6px">
                          <Icon as={MdAdd} w="14px" h="14px" color="#044bd9" />
                          <Text fontSize={{ base: 'xs', md: 'sm' }} color="#044bd9" fontWeight="500">Create Sub Profile</Text>
                        </Flex>
                      </MenuItem>
                    </>
                  )}
                </Box>
              )}
              {_isMainOrganizer && (
                <>
                  <Divider my={{ base: '4px', md: '6px' }} />
                  <MenuItem
                    _hover={{ bg: 'blue.50' }}
                    _focus={{ bg: 'blue.50' }}
                    transition="background 0.15s ease"
                    borderRadius="8px"
                    px={{ base: '12px', md: '14px' }}
                    py={{ base: '8px', md: '10px' }}
                  >
                    <Link to="/organizer/setting/profile-settings">
                      <Text fontSize={{ base: 'xs', md: 'sm' }}>Profile Settings</Text>
                    </Link>
                  </MenuItem>
                </>
              )}
              <MenuItem
                _hover={{ bg: 'blue.50' }}
                _focus={{ bg: 'blue.50' }}
                transition="background 0.15s ease"
                borderRadius="8px"
                px={{ base: '12px', md: '14px' }}
                py={{ base: '8px', md: '10px' }}
                onClick={onOpen}
                isDisabled={isGoogleLogin}
              >
                <Text fontSize={{ base: 'xs', md: 'sm' }}>Change password</Text>



              </MenuItem>

              <MenuItem
                _hover={{ bg: 'red.50' }}
                _focus={{ bg: 'red.50' }}
                transition="background 0.15s ease"
                color="red.400"
                borderRadius="8px"
                px={{ base: '12px', md: '14px' }}
                py={{ base: '8px', md: '10px' }}
                onClick={handleLogout}
              >
                <Text fontSize={{ base: 'xs', md: 'sm' }}>Log out</Text>
              </MenuItem>
            </Flex>

          </MenuList>
        </Menu>
        </Box>
        )}

        {/* Name pill extending to the right from avatar circle */}
      </Flex>
      <ChangePasswordDialog isOpen={isOpen} onClose={onClose} />

      {/* Create Sub Profile Modal */}
      <Modal isOpen={isSubProfileOpen} onClose={handleSubProfileModalClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="16px" mx="16px" minH="450px">
          <ModalHeader fontSize="lg" fontWeight="700" pb="4px" pt="24px">
            Create Sub Profile
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pt="0" pb="12px" flex="1">
            <Text fontSize="sm" color="gray.500" mb="16px">
              Set up a sub profile to manage campaigns and events separately.
            </Text>
            <FormControl mb="16px" isInvalid={!!subProfileNameError}>
  <FormLabel fontSize="sm" fontWeight="600">Sub Profile Name</FormLabel>
  <Input
    placeholder="Enter sub profile name"
    value={subProfileName}
    onChange={(e) => {
      // Block special characters — allow only letters, numbers, spaces, hyphens, underscores
      const filtered = e.target.value.replace(/[^a-zA-Z0-9 _-]/g, '');
      setSubProfileName(filtered);
      setSubProfileNameError(validateSubProfileName(filtered));
    }}
    borderRadius="10px"
    fontSize="sm"
    maxLength={40}
  />
  {subProfileNameError && (
    <Text fontSize="xs" color="red.500" mt="4px">{subProfileNameError}</Text>
  )}
</FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600">Description</FormLabel>
              <Textarea
               maxLength={150}
                placeholder="Enter description"
                value={subProfileDescription}
                onChange={(e) => setSubProfileDescription(e.target.value)}
                borderRadius="10px"
                fontSize="sm"
                rows={6}
                minH="140px"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter px="24px" pb="20px">
            <Button
              w="100%"
              bg="#044bd9"
              color="white"
              _hover={{ bg: '#0340b5' }}
              fontSize="sm"
              borderRadius="10px"
              isLoading={subProfileLoading}
             isDisabled={!subProfileName.trim() || !!subProfileNameError || subProfileName.trim().length < 3}
              onClick= {handleCreateSubProfile}
            >
              Create Sub Profile
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
