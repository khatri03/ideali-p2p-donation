import React, { useRef } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  Text,
  Icon,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { MdWarning, MdError, MdInfo, MdCheckCircle } from 'react-icons/md';

export type ConfirmationModalType = 'warning' | 'danger' | 'info' | 'success';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationModalType;
  isLoading?: boolean;
  showIcon?: boolean;
}

const typeConfig: Record<ConfirmationModalType, {
  icon: React.ElementType;
  colorScheme: string;
  iconColor: string;
}> = {
  warning: {
    icon: MdWarning,
    colorScheme: 'orange',
    iconColor: 'orange.500',
  },
  danger: {
    icon: MdError,
    colorScheme: 'red',
    iconColor: 'red.500',
  },
  info: {
    icon: MdInfo,
    colorScheme: 'blue',
    iconColor: 'blue.500',
  },
  success: {
    icon: MdCheckCircle,
    colorScheme: 'green',
    iconColor: 'green.500',
  },
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
  showIcon = true,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const config = typeConfig[type];

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
      motionPreset="slideInBottom"
    >
      <AlertDialogOverlay bg="blackAlpha.600">
        <AlertDialogContent
          mx={4}
          borderRadius="xl"
          boxShadow="xl"
        >
          <AlertDialogHeader fontSize="lg" fontWeight="bold" pb={2}>
            <HStack spacing={3}>
              {showIcon && (
                <Icon as={config.icon} boxSize={6} color={config.iconColor} />
              )}
              <Text>{title}</Text>
            </HStack>
          </AlertDialogHeader>

          <AlertDialogBody>
            <Text color="gray.600" fontSize="md">
              {message}
            </Text>
          </AlertDialogBody>

          <AlertDialogFooter pt={4}>
            <Button
              ref={cancelRef}
              onClick={onClose}
              variant="outline"
              borderRadius="lg"
              isDisabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              colorScheme={config.colorScheme}
              onClick={onConfirm}
              ml={3}
              borderRadius="lg"
              isLoading={isLoading}
              loadingText="Processing..."
            >
              {confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default ConfirmationModal;
