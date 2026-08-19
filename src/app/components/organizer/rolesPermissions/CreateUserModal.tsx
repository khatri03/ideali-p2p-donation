import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  Text,
  HStack,
  VStack,
  Icon,
  Input,
  InputGroup,
  Select,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useColorModeValue,
  useToast,
  IconButton,
  InputRightElement,
} from '@chakra-ui/react';
import {
  MdPerson,
  MdEmail,
  MdLock,
  MdKey,
  MdOutlineAdminPanelSettings,
  MdClose,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';
import permissionCatalogService, {
  RoleListItem,
} from 'app/service/organizer/rolesPermissions/rolesService';
import userListService from 'app/service/organizer/rolesPermissions/usersService';

export interface UserModalInitialData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  mode?: 'create' | 'edit';
  initialData?: UserModalInitialData;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onCreated,
  mode = 'create',
  initialData,
}: CreateUserModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
    role: false,
  });
  const toast = useToast();

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  const subText = useColorModeValue('gray.500', 'gray.400');
  const labelColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    if (isOpen) {
      permissionCatalogService
        .getRoleList()
        .then((data) => setRoles(data.pageData))
        .catch(() => {});
      if (initialData) {
        setFirstName(initialData.firstName);
        setLastName(initialData.lastName);
        setEmail(initialData.email);
        setSelectedRole(initialData.roleId);
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setSelectedRole('');
    setTouched({
      firstName: false,
      lastName: false,
      email: false,
      password: false,
      confirmPassword: false,
      role: false,
    });
    setShowPassword(false);
    setShowConfirm(false);
    onClose();
  };
  const fullName = `${firstName.trim()} ${lastName.trim()}`;
  const errors = {
    firstName: !firstName.trim() ? 'First name is required' : '',
    lastName: !lastName.trim() ? 'Last name is required' : '',
    email: !email.trim()
      ? 'Email address is required'
      : !/\S+@\S+\.\S+/.test(email)
        ? 'Enter a valid email'
        : '',
    password: !password
      ? 'Password is required'
      : password.length < 6
        ? 'Minimum 6 characters'
        : '',
    confirmPassword: !confirmPassword
      ? 'Please confirm your password'
      : confirmPassword !== password
        ? 'Passwords do not match'
        : '',
    role: !selectedRole ? 'Please select a role' : '',
    userName:
      fullName.trim().length > 0 &&
      (fullName.trim().length < 6 || fullName.trim().length > 24)
        ? 'User name must be 6-24 characters.'
        : '',
  };

  const isValid = !Object.values(errors).some(Boolean);

  const handleSubmit = async () => {
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
      role: true,
    });
    if (!isValid) return;
    setSubmitting(true);
    try {
      if (mode === 'edit' && initialData?.userId) {
        const result = await userListService.updateUser(initialData.userId, {
          firstName,
          lastName,
          userName: email,
          roleIds: [selectedRole],
        });
        if (result.success) {
          toast({
            title: 'User updated successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
          });
          onCreated?.();
          handleClose();
        } else {
          throw new Error(result.message || 'Failed to update user');
        }
      } else {
        const result = await userListService.createUser({
          firstName,
          lastName,
          userName: email,
          password,
          confirmPassword,
          roleIds: [selectedRole],
        });
        if (result.success) {
          toast({
            title: 'User created successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
          });
          onCreated?.();
          handleClose();
        } else {
          throw new Error(result.message || 'Failed to create user');
        }
      }
    } catch (error: any) {
      const action = mode === 'edit' ? 'update' : 'create';
      toast({
        title: `Failed to ${action} user`,
        description: error?.response?.data?.message || error?.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(2px)" />
      <ModalContent borderRadius="2xl" boxShadow="xl" mx={4}>
        <ModalBody p={6}>
          {/* Header */}
          <HStack justify="space-between" align="flex-start" mb={5}>
            <HStack spacing={2} align="center">
              <Icon
                as={MdOutlineAdminPanelSettings}
                color="blue.500"
                boxSize={5}
              />
              <Box>
                <Text fontSize="md" fontWeight="bold" color={textColor}>
                  {mode === 'edit' ? 'Edit User' : 'Create New User'}
                </Text>
                <Text fontSize="xs" color={subText}>
                  {mode === 'edit'
                    ? 'Update user information'
                    : 'Add a new user to your organization'}
                </Text>
              </Box>
            </HStack>
            <IconButton
              aria-label="Close"
              icon={<MdClose />}
              size="sm"
              variant="ghost"
              color="gray.400"
              _hover={{ bg: 'gray.100' }}
              onClick={handleClose}
            />
          </HStack>

          <VStack spacing={4}>
            {/* First Name + Last Name */}
            <HStack spacing={3} align="flex-start" w="full">
              <FormControl isInvalid={touched.firstName && !!errors.firstName}>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color={labelColor}
                  mb={1}
                >
                  First Name
                </FormLabel>
                <Input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                  borderColor={borderColor}
                  maxLength={12}
                  borderRadius="md"
                  fontSize="sm"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px #4299e1',
                  }}
                />
                <FormErrorMessage fontSize="xs">
                  {errors.firstName}
                </FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={touched.lastName && !!errors.lastName}>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color={labelColor}
                  mb={1}
                >
                  Last Name
                </FormLabel>
                <Input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                  borderColor={borderColor}
                  maxLength={12}
                  borderRadius="md"
                  fontSize="sm"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px #4299e1',
                  }}
                />
                <FormErrorMessage fontSize="xs">
                  {errors.lastName}
                </FormErrorMessage>
              </FormControl>
            </HStack>
            {touched.firstName &&
              touched.lastName &&
              firstName.trim() &&
              lastName.trim() &&
              errors.userName && (
                <Text fontSize="xs" color="red.500" mt={-2}>
                  {errors.userName}
                </Text>
              )}

            {/* Email */}
            <FormControl isInvalid={touched.email && !!errors.email}>
              <FormLabel
                fontSize="sm"
                fontWeight="medium"
                color={labelColor}
                mb={1}
              >
                <HStack spacing={1}>
                  <Icon as={MdEmail} color="gray.400" boxSize={4} />
                  <Text>Email Address</Text>
                </HStack>
              </FormLabel>
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                borderColor={borderColor}
                borderRadius="md"
                fontSize="sm"
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 1px #4299e1',
                }}
              />
              <FormErrorMessage fontSize="xs">{errors.email}</FormErrorMessage>
            </FormControl>

            {/* Password */}
            <FormControl isInvalid={touched.password && !!errors.password}>
              <FormLabel
                fontSize="sm"
                fontWeight="medium"
                color={labelColor}
                mb={1}
              >
                <HStack spacing={1}>
                  <Icon as={MdLock} color="gray.400" boxSize={4} />
                  <Text>Password</Text>
                </HStack>
              </FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  borderColor={borderColor}
                  borderRadius="md"
                  fontSize="sm"
                  pr="2.5rem"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px #4299e1',
                  }}
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Toggle password"
                    icon={showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    size="xs"
                    variant="ghost"
                    color="gray.400"
                    onClick={() => setShowPassword((v) => !v)}
                  />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage fontSize="xs">
                {errors.password}
              </FormErrorMessage>
            </FormControl>

            {/* Confirm Password */}
            <FormControl
              isInvalid={touched.confirmPassword && !!errors.confirmPassword}
            >
              <FormLabel
                fontSize="sm"
                fontWeight="medium"
                color={labelColor}
                mb={1}
              >
                <HStack spacing={1}>
                  <Icon as={MdLock} color="gray.400" boxSize={4} />
                  <Text>Confirm Password</Text>
                </HStack>
              </FormLabel>
              <InputGroup>
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() =>
                    setTouched((t) => ({ ...t, confirmPassword: true }))
                  }
                  borderColor={borderColor}
                  borderRadius="md"
                  fontSize="sm"
                  pr="2.5rem"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px #4299e1',
                  }}
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Toggle confirm password"
                    icon={showConfirm ? <MdVisibilityOff /> : <MdVisibility />}
                    size="xs"
                    variant="ghost"
                    color="gray.400"
                    onClick={() => setShowConfirm((v) => !v)}
                  />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage fontSize="xs">
                {errors.confirmPassword}
              </FormErrorMessage>
            </FormControl>

            {/* Assign Role */}
            <FormControl isInvalid={touched.role && !!errors.role}>
              <FormLabel
                fontSize="sm"
                fontWeight="medium"
                color={labelColor}
                mb={1}
              >
                <HStack spacing={1}>
                  <Icon as={MdKey} color="gray.400" boxSize={4} />
                  <Text>Assign Role</Text>
                </HStack>
              </FormLabel>
              <Select
                placeholder="Select a role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, role: true }))}
                borderColor={borderColor}
                borderRadius="md"
                fontSize="sm"
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 1px #4299e1',
                }}
              >
                {roles.map((r) => (
                  <option key={r.roleUniqueId} value={r.roleUniqueId}>
                    {r.name}
                  </option>
                ))}
              </Select>
              <FormErrorMessage fontSize="xs">{errors.role}</FormErrorMessage>
            </FormControl>
          </VStack>

          {/* Actions */}
          <HStack justify="flex-end" mt={6} spacing={3}>
            <Button
              variant="ghost"
              color="gray.600"
              _hover={{ bg: 'gray.100' }}
              onClick={handleClose}
              fontSize="sm"
            >
              Cancel
            </Button>
            <Button
              leftIcon={<Icon as={MdPerson} />}
              bg="#044bd9"
              color="white"
              _hover={{ bg: '#033fb6' }}
              fontSize="sm"
              isLoading={submitting}
              onClick={handleSubmit}
            >
              {mode === 'edit' ? 'Save Changes' : '+ Create User'}
            </Button>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
