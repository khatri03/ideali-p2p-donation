import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
} from '@chakra-ui/react';

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  title?: string;
  message?: string;
  confirmButtonText?: string;
}

/**
 * Delete Confirmation Modal
 * Reusable modal for confirming delete actions
 */
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  title = 'Delete Campaign',
  message = 'Do you want to delete this campaign? This action cannot be undone.',
  confirmButtonText = 'Yes, Delete',
}: DeleteConfirmationModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>{message}</Text>
        </ModalBody>

        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose} isDisabled={isDeleting}>
            Cancel
          </Button>
          <Button
            colorScheme="red"
            onClick={onConfirm}
            isLoading={isDeleting}
            loadingText="Deleting..."
          >
            {confirmButtonText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteConfirmationModal;
