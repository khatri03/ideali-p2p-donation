import React, { useState } from 'react';
import {
  Box, Button, Flex, Icon, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, useToast,
} from '@chakra-ui/react';
import { MdWifi, MdWifiOff } from 'react-icons/md';
import membershipWizardService from '../../services/membershipWizardService';

interface Props {
  isOpen: boolean;
  membershipId: string;
  targetStatus: boolean; // true = go online, false = go offline
  onClose: () => void;
  onSuccess: (newStatus: boolean) => void;
}

export default function MembershipStatusModal({
  isOpen,
  membershipId,
  targetStatus,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const isOnline = targetStatus;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await membershipWizardService.saveReviewData(membershipId, targetStatus);
      onSuccess(targetStatus);
      toast({
        title: isOnline ? 'Membership is now Online' : 'Membership is now Offline',
        status: isOnline ? 'success' : 'warning',
        position: 'top-right',
        duration: 3000,
      });
      onClose();
    } catch (err: any) {
      toast({
        title: 'Failed to update status',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(3px)" />
      <ModalContent borderRadius="2xl" mx={4} overflow="hidden">

        {/* Accent bar */}
        <Box h="4px" bg={isOnline ? 'green.400' : 'red.400'} />

        <ModalHeader pt={5} pb={2} fontSize="lg" fontWeight="bold" color="gray.900">
          {isOnline ? 'Go Online?' : 'Go Offline?'}
        </ModalHeader>
        <ModalCloseButton top={4} right={4} isDisabled={saving} />

        <ModalBody pb={2}>
          <Flex
            align="center"
            gap={3}
            bg={isOnline ? 'green.50' : 'red.50'}
            border="1px solid"
            borderColor={isOnline ? 'green.200' : 'red.200'}
            borderRadius="xl"
            p={4}
          >
            <Flex
              w="44px"
              h="44px"
              borderRadius="full"
              bg={isOnline ? 'green.100' : 'red.100'}
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Icon
                as={isOnline ? MdWifi : MdWifiOff}
                boxSize={5}
                color={isOnline ? 'green.600' : 'red.500'}
              />
            </Flex>
            <Text fontSize="sm" color={isOnline ? 'green.700' : 'red.700'} lineHeight="tall">
              {isOnline
                ? 'This will make the membership publicly available for sign-up. Members will be able to register immediately.'
                : 'This will close sign-up. Members will no longer be able to register for this membership.'}
            </Text>
          </Flex>
        </ModalBody>

        <ModalFooter gap={2} pt={4}>
          <Button
            size="sm"
            variant="ghost"
            color="gray.600"
            borderRadius="lg"
            onClick={onClose}
            isDisabled={saving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            bg={isOnline ? 'green.500' : 'red.500'}
            color="white"
            borderRadius="lg"
            px={5}
            isLoading={saving}
            loadingText="Saving..."
            onClick={handleConfirm}
            _hover={{ bg: isOnline ? 'green.600' : 'red.600' }}
            _active={{ bg: isOnline ? 'green.700' : 'red.700' }}
          >
            {isOnline ? 'Yes, Go Online' : 'Yes, Go Offline'}
          </Button>
        </ModalFooter>

      </ModalContent>
    </Modal>
  );
}
