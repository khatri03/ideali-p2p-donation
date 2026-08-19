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

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const ExitConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Exit Campaign Creation?",
  message = "Are you sure you want to exit the campaign? Your changes have been saved as a draft.",
}: ExitConfirmationModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent mx={4}>
        <ModalHeader fontSize="xl" fontWeight="bold">
          {title}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Text color="gray.600">{message}</Text>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            _hover={{ bg: "gray.100" }}
          >
            No, Stay
          </Button>
          <Button 
            colorScheme="red" 
            onClick={onConfirm}
            _hover={{ bg: "red.600" }}
          >
            Yes, Exit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExitConfirmationModal;