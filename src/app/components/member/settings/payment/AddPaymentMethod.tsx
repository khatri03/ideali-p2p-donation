import { Box, Button, Flex, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, useColorModeValue, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import HttpClient from 'app/service/httpClient/HttpClient';

interface CardForm { cardHolderName: string; cardNumber: string; expiryMonth: string; expiryYear: string; cvv: string; }
const EMPTY: CardForm = { cardHolderName: '', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' };

function AddPaymentMethod({ isOpen, onClose, onAdded }: { isOpen: boolean; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState<CardForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const textColor = useColorModeValue('#1B2559', 'white');
  const labelColor = useColorModeValue('#A3AED0', '#A3AED0');

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await HttpClient.post<{ success: boolean; message: string | null }>('/api/member/me/payment-methods', form);
      if (res.data.success) {
        toast({ title: 'Payment method added.', status: 'success', duration: 3000 });
        setForm(EMPTY); onAdded(); onClose();
      } else {
        toast({ title: res.data.message ?? 'Failed to add card.', status: 'error', duration: 3000 });
      }
    } catch { toast({ title: 'An error occurred.', status: 'error', duration: 3000 }); }
    finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent borderRadius="20px">
        <ModalHeader color={textColor}>Add Payment Method</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column" gap="14px">
            <FormControl>
              <FormLabel color={labelColor} fontSize="sm">Cardholder Name</FormLabel>
              <Input placeholder="John Doe" borderRadius="10px" value={form.cardHolderName} onChange={(e) => setForm((p) => ({ ...p, cardHolderName: e.target.value }))} />
            </FormControl>
            <FormControl>
              <FormLabel color={labelColor} fontSize="sm">Card Number</FormLabel>
              <Input placeholder="•••• •••• •••• ••••" borderRadius="10px" maxLength={19} value={form.cardNumber} onChange={(e) => setForm((p) => ({ ...p, cardNumber: e.target.value }))} />
            </FormControl>
            <Flex gap="12px">
              <FormControl><FormLabel color={labelColor} fontSize="sm">Month</FormLabel><Input placeholder="MM" borderRadius="10px" maxLength={2} value={form.expiryMonth} onChange={(e) => setForm((p) => ({ ...p, expiryMonth: e.target.value }))} /></FormControl>
              <FormControl><FormLabel color={labelColor} fontSize="sm">Year</FormLabel><Input placeholder="YYYY" borderRadius="10px" maxLength={4} value={form.expiryYear} onChange={(e) => setForm((p) => ({ ...p, expiryYear: e.target.value }))} /></FormControl>
              <FormControl><FormLabel color={labelColor} fontSize="sm">CVV</FormLabel><Input placeholder="•••" type="password" borderRadius="10px" maxLength={4} value={form.cvv} onChange={(e) => setForm((p) => ({ ...p, cvv: e.target.value }))} /></FormControl>
            </Flex>
            <Text color={labelColor} fontSize="xs">Your card details are encrypted and stored securely.</Text>
          </Flex>
        </ModalBody>
        <ModalFooter gap="8px">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button colorScheme="brand" isLoading={saving} onClick={handleSubmit}>Add Card</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AddPaymentMethod;
