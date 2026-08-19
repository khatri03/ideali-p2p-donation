import React from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalCloseButton,
  Box, Button, Flex, Icon, Text,
} from '@chakra-ui/react';
import { MdAutoAwesome } from 'react-icons/md';

interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPublishing: boolean;
}

export default function PublishConfirmModal({
  isOpen, onClose, onConfirm, isPublishing,
}: PublishConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="blackAlpha.400" />
      <ModalContent borderRadius="2xl" px={0} overflow="hidden">
        <ModalCloseButton top={4} right={4} size="sm" />

        <Box px={6} pt={6} pb={5}>
          <Text fontSize="10px" fontWeight="bold" color="blue.500"
            textTransform="uppercase" letterSpacing="widest" mb={2}
          >
            Review Membership
          </Text>

          <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>
            Confirm & Publish
          </Text>
          <Text fontSize="sm" color="gray.500" mb={5}>
            You are about to publish this membership and make it available for sign-up.
          </Text>

          <Text fontSize="xs" color="gray.400" mb={6}>
            Please confirm before saving the membership review.
          </Text>

          <Flex justify="space-between" align="center">
            <Button
              variant="outline" size="sm" borderRadius="lg"
              borderColor="gray.300" color="gray.700" px={5}
              onClick={onClose} isDisabled={isPublishing}
              _hover={{ bg: 'gray.50' }}
            >
              Cancel
            </Button>
            <Button
              size="sm" bg="#044bd9" color="white" borderRadius="lg" px={5}
              leftIcon={<Icon as={MdAutoAwesome} boxSize={3.5} />}
              onClick={onConfirm}
              isLoading={isPublishing}
              loadingText="Publishing..."
              _hover={{ bg: 'blue.500' }}
              _active={{ bg: '#0235a0' }}
            >
              Save & Publish
            </Button>
          </Flex>
        </Box>
      </ModalContent>
    </Modal>
  );
}
