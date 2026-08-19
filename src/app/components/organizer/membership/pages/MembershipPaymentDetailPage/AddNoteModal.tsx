import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import { useToast } from '@chakra-ui/react';
import membershipPaymentService from '../../services/membershipPaymentService';

const MAX_LENGTH = 400;

interface Props {
  isOpen: boolean;
  invoiceId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddNoteModal({
  isOpen,
  invoiceId,
  onClose,
  onSaved,
}: Props) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    if (isSaving) return;
    setText('');
    onClose();
  };

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSaving) return;

    setIsSaving(true);
    try {
      await membershipPaymentService.addMembershipPaymentNote(invoiceId, trimmed);
      toast({
        title: 'Note saved',
        status: 'success',
        duration: 3000,
        position: 'top-right',
      });
      setText('');
      onSaved();
    } catch {
      toast({
        title: 'Failed to save note',
        status: 'error',
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const remaining = MAX_LENGTH - text.length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(2px)" />
      <ModalContent borderRadius="2xl" overflow="hidden" mx={4}>
        {/* Header */}
        <Box px={6} pt={5} pb={4} borderBottom="1px solid" borderColor="gray.100">
          <Flex justify="space-between" align="flex-start">
            <Box>
              <Text
                fontSize="10px"
                fontWeight="bold"
                color="gray.400"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1}
              >
                Add Note
              </Text>
              <Text fontSize="lg" fontWeight="800" color="gray.900" mb={1}>
                Record a billing note
              </Text>
              <Text fontSize="xs" color="gray.500" lineHeight="1.6">
                Keep an internal note on this invoice. The latest note will
                surface at the top immediately after saving.
              </Text>
            </Box>
            <IconButton
              aria-label="Close"
              icon={<Icon as={MdClose} boxSize={4} />}
              size="sm"
              variant="ghost"
              color="gray.400"
              borderRadius="full"
              ml={3}
              flexShrink={0}
              onClick={handleClose}
              _hover={{ bg: 'gray.100', color: 'gray.600' }}
            />
          </Flex>
        </Box>

        {/* Body */}
        <Box px={6} py={5}>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color="gray.700"
            mb={2}
          >
            Note
          </Text>
          <Textarea
            placeholder="Write a clear internal note about this invoice..."
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= MAX_LENGTH) setText(e.target.value);
            }}
            rows={5}
            resize="none"
            fontSize="sm"
            color="gray.800"
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            _focus={{
              borderColor: '#044bd9',
              boxShadow: '0 0 0 1px #044bd9',
            }}
            _placeholder={{ color: 'gray.400' }}
          />
          <Flex justify="space-between" mt={1.5}>
            <Text fontSize="10px" color="gray.400">
              Maximum {MAX_LENGTH} characters
            </Text>
            <Text
              fontSize="10px"
              color={remaining <= 20 ? 'red.400' : 'gray.400'}
            >
              {text.length}/{MAX_LENGTH}
            </Text>
          </Flex>
        </Box>

        {/* Footer */}
        <Flex
          px={6}
          pb={5}
          pt={1}
          justify="flex-end"
          gap={3}
        >
          <Button
            size="sm"
            variant="outline"
            borderColor="gray.300"
            color="gray.600"
            borderRadius="lg"
            px={5}
            onClick={handleClose}
            isDisabled={isSaving}
            _hover={{ bg: 'gray.50' }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            bg="#044bd9"
            color="white"
            borderRadius="lg"
            px={6}
            onClick={handleSave}
            isLoading={isSaving}
            isDisabled={!text.trim()}
            _hover={{ bg: '#0340b8' }}
            _active={{ bg: '#02308a' }}
            _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
          >
            Save
          </Button>
        </Flex>
      </ModalContent>
    </Modal>
  );
}
