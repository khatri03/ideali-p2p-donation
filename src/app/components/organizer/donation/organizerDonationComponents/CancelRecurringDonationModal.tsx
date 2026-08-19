import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Textarea,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';

interface CancelRecurringDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  donationId: string | null;
}

export default function CancelRecurringDonationModal({
  isOpen,
  onClose,
  onConfirm,
  donationId,
}: CancelRecurringDonationModalProps) {
  const [cancellationNotes, setCancellationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!donationId) return;

    setIsSubmitting(true);
    try {
      await onConfirm(cancellationNotes);
      // Reset notes after successful cancellation
      setCancellationNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCancellationNotes('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Cancel Recurring Donation</ModalHeader>
        <ModalCloseButton isDisabled={isSubmitting} />
        <ModalBody>
          <Text mb={3}>
            Are you sure you want to cancel this recurring donation? Please provide a reason for cancellation:
          </Text>
          <Textarea
            placeholder="Enter cancellation notes..."
            value={cancellationNotes}
            onChange={(e) => setCancellationNotes(e.target.value)}
            rows={4}
            isDisabled={isSubmitting}
          />
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={handleClose} 
            isDisabled={isSubmitting}
          >
            Close
          </Button>
          <Button
            colorScheme="red"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            loadingText="Cancelling..."
          >
            Confirm Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}