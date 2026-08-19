import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { useState } from 'react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import PasswordService from '../../../../service/helpers/changePasswordService';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordDialog({
  isOpen,
  onClose,
}: ChangePasswordDialogProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = (): boolean => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    let isValid = true;

    // Validate current password
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
      isValid = false;
    }

    // Validate new password
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
      isValid = false;
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Validate confirm password
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for the field being edited
    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await PasswordService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      toast({
        title: 'Success',
        description: response.message || 'Password changed successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });

      // Reset form and close dialog
      handleClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.message || 'Failed to change password. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form data and errors
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Change Password</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            {/* Current Password */}
            <FormControl isInvalid={!!errors.currentPassword}>
              <FormLabel fontSize="sm" fontWeight="500">
                Current Password *
              </FormLabel>
              <InputGroup>
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    handleInputChange('currentPassword', e.target.value)
                  }
                  disabled={isLoading}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={
                      showCurrentPassword ? 'Hide password' : 'Show password'
                    }
                    icon={showCurrentPassword ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                  />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
            </FormControl>

            {/* New Password */}
            <FormControl isInvalid={!!errors.newPassword}>
              <FormLabel fontSize="sm" fontWeight="500">
                New Password *
              </FormLabel>
              <InputGroup>
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    handleInputChange('newPassword', e.target.value)
                  }
                  disabled={isLoading}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={
                      showNewPassword ? 'Hide password' : 'Show password'
                    }
                    icon={showNewPassword ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                  />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
            </FormControl>

            {/* Confirm Password */}
            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel fontSize="sm" fontWeight="500">
                Confirm Password *
              </FormLabel>
              <InputGroup>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  disabled={isLoading}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                    icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                  />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText="Changing..."
          >
            Change Password
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}