import React from 'react';
import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Textarea,
  Text,
} from '@chakra-ui/react';
import { MdCheckCircleOutline } from 'react-icons/md';

type ApprovalModalProps = {
  isOpen: boolean;
  memberName: string;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  isSubmitting?: boolean;
};

function ModalShell({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="3xl" overflow="hidden" boxShadow="2xl">
        <ModalCloseButton top={4} right={4} borderRadius="full" />
        {children}
      </ModalContent>
    </Modal>
  );
}

export function ApproveMemberModal({
  isOpen,
  memberName,
  onClose,
  onConfirm,
  isSubmitting = false,
}: ApprovalModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose}>
      <ModalBody px={8} pt={8} pb={2}>
        <Box
          w="46px"
          h="46px"
          borderRadius="xl"
          bg="green.50"
          color="green.500"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mb={4}
        >
          <MdCheckCircleOutline size={24} />
        </Box>
        <Text fontSize="2xl" fontWeight="800" color="gray.800" mb={3}>
          Approve member
        </Text>
        <Text fontSize="sm" color="gray.600" lineHeight="1.7">
          You are about to approve {memberName || 'this member'}. This will move
          the member to Active status.
        </Text>
        <Text fontSize="sm" color="gray.600" lineHeight="1.7" mt={2}>
          Please confirm this action.
        </Text>
      </ModalBody>
      <ModalFooter px={8} pb={8} pt={6}>
        <Flex w="full" justify="space-between" gap={4}>
          <Button
            variant="outline"
            borderRadius="full"
            px={6}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            bg="green.500"
            color="white"
            borderRadius="full"
            px={6}
            _hover={{ bg: 'green.600' }}
            _active={{ bg: 'green.700' }}
            isLoading={isSubmitting}
            loadingText="Approving"
            onClick={() => onConfirm()}
          >
            Confirm
          </Button>
        </Flex>
      </ModalFooter>
    </ModalShell>
  );
}

export function RejectMemberModal({
  isOpen,
  memberName,
  onClose,
  onConfirm,
  isSubmitting = false,
}: ApprovalModalProps) {
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const canConfirm = reason.trim().length > 0;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}>
      <ModalBody px={8} pt={10} pb={2}>
        <Text fontSize="2xl" fontWeight="800" color="gray.800" mb={3}>
          Reject member
        </Text>
        <Text fontSize="sm" color="gray.600" lineHeight="1.7">
          You are about to reject {memberName || 'this member'}. This will move
          the member to Rejected status.
        </Text>
        <Text fontSize="sm" color="gray.600" lineHeight="1.7" mt={2}>
          Please confirm this action.
        </Text>
        <Text fontSize="sm" color="gray.600" lineHeight="1.7" mt={2}>
          After rejection, the paid amount will be refunded to the original
          payment method, subject to payment processing.
        </Text>
        <Text fontSize="sm" fontWeight="600" color="gray.700" mt={5} mb={2}>
          Reason
        </Text>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter the reason for rejection and refund"
          minH="120px"
          resize="vertical"
          borderRadius="xl"
        />
      </ModalBody>
      <ModalFooter px={8} pb={8} pt={6}>
        <Flex w="full" justify="space-between" gap={4}>
          <Button
            variant="outline"
            borderRadius="full"
            px={6}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            bg="red.500"
            color="white"
            borderRadius="full"
            px={6}
            _hover={{ bg: 'red.600' }}
            _active={{ bg: 'red.700' }}
            isLoading={isSubmitting}
            loadingText="Rejecting"
            isDisabled={!canConfirm || isSubmitting}
            onClick={() => onConfirm(reason.trim())}
          >
            Confirm Reject
          </Button>
        </Flex>
      </ModalFooter>
    </ModalShell>
  );
}
