import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalContent,
  ModalOverlay,
  Switch,
  Text,
} from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import { useToast } from '@chakra-ui/react';
import membershipPaymentService from '../services/membershipPaymentService';

export type SendInvoiceEmailPayload = {
  toEmail: string;
  notifyOrganizer: boolean;
  otherNotificationEmails: string[];
};

interface Props {
  isOpen: boolean;
  invoiceId: string;
  recipientEmail: string;
  onClose: () => void;
  // Defaults to the organizer send-email endpoint; pass an override to target a different one (e.g. the member-facing endpoint).
  sendEmail?: (invoiceId: string, payload: SendInvoiceEmailPayload) => Promise<unknown>;
}

export default function SendInvoiceEmailModal({
  isOpen,
  invoiceId,
  recipientEmail,
  onClose,
  sendEmail = membershipPaymentService.sendMembershipInvoiceEmail,
}: Props) {
  const toast = useToast();
  const [notifyOrganizer, setNotifyOrganizer] = useState(false);
  const [otherEmails, setOtherEmails] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNotifyOrganizer(false);
      setOtherEmails('');
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isSending) return;
    onClose();
  };

  const handleSend = async () => {
    if (isSending) return;

    const extras = otherEmails
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    setIsSending(true);
    try {
      await sendEmail(invoiceId, {
        toEmail: recipientEmail,
        notifyOrganizer,
        otherNotificationEmails: extras,
      });
      toast({
        title: 'Invoice email sent',
        description: `Sent to ${recipientEmail}${extras.length ? ` and ${extras.length} other(s)` : ''}.`,
        status: 'success',
        duration: 4000,
        position: 'top-right',
      });
      onClose();
    } catch {
      toast({
        title: 'Failed to send email',
        status: 'error',
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsSending(false);
    }
  };

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
                color="#044bd9"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1.5}
              >
                Send Invoice Email
              </Text>
              <Text fontSize="lg" fontWeight="800" color="gray.900" mb={1}>
                Review recipients
              </Text>
              <Text fontSize="xs" color="gray.500" lineHeight="1.6">
                Confirm the recipient list before sending the invoice email.
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
          {/* Recipient email */}
          <FormControl mb={4}>
            <FormLabel
              fontSize="xs"
              fontWeight="bold"
              color="gray.700"
              mb={1.5}
            >
              Recipient email
            </FormLabel>
            <Input
              value={recipientEmail}
              isReadOnly
              size="sm"
              bg="gray.50"
              borderColor="gray.200"
              borderRadius="lg"
              color="gray.700"
              fontWeight="medium"
              fontSize="sm"
              _focus={{ boxShadow: 'none' }}
              cursor="default"
            />
          </FormControl>

          {/* Notify organizer toggle */}
          <Box
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            px={4}
            py={3}
            mb={4}
          >
            <Flex align="center" justify="space-between">
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.800" mb={0.5}>
                  Notify organizer
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Send a copy to the organizer.
                </Text>
              </Box>
              <Switch
                isChecked={notifyOrganizer}
                onChange={(e) => setNotifyOrganizer(e.target.checked)}
                colorScheme="blue"
                size="md"
              />
            </Flex>
          </Box>

          {/* Other notification emails */}
          <FormControl>
            <FormLabel
              fontSize="xs"
              fontWeight="bold"
              color="gray.700"
              mb={1.5}
            >
              Other notification emails
            </FormLabel>
            <Input
              placeholder="email1@example.com"
              value={otherEmails}
              onChange={(e) => setOtherEmails(e.target.value)}
              size="sm"
              bg="white"
              borderColor="gray.200"
              borderRadius="lg"
              fontSize="sm"
              color="gray.800"
              _focus={{
                borderColor: '#044bd9',
                boxShadow: '0 0 0 1px #044bd9',
              }}
              _placeholder={{ color: 'gray.400' }}
            />
            <Text fontSize="10px" color="gray.400" mt={1}>
              Separate multiple emails with a comma.
            </Text>
          </FormControl>
        </Box>

        {/* Footer */}
        <Flex px={6} pb={5} pt={1} justify="flex-end" gap={3}>
          <Button
            size="sm"
            variant="outline"
            borderColor="gray.300"
            color="gray.600"
            borderRadius="lg"
            px={5}
            onClick={handleClose}
            isDisabled={isSending}
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
            onClick={handleSend}
            isLoading={isSending}
            loadingText="Sending..."
            _hover={{ bg: '#0340b8' }}
            _active={{ bg: '#02308a' }}
          >
            Send email
          </Button>
        </Flex>
      </ModalContent>
    </Modal>
  );
}
