import {
  Avatar, Badge, Box, Divider, Flex, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalHeader, ModalOverlay, Text, useColorModeValue,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { DonorDonationRecord } from 'app/interface/memberInter/donorDonationDto';
import Loader from 'app/components/common/Loader';
import donorDonationService from '../services/donorDonationService';
import DownloadReceiptButton from './DownloadReceiptButton';

interface DonationDetailModalProps {
  invoiceId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  Completed: 'green', Pending: 'yellow', Failed: 'red', Refunded: 'purple',
};

function DonationDetailModal({ invoiceId, isOpen, onClose }: DonationDetailModalProps) {
  const [record, setRecord] = useState<DonorDonationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const textColor = useColorModeValue('#1B2559', 'white');
  const labelColor = useColorModeValue('#A3AED0', '#A3AED0');

  useEffect(() => {
    if (!invoiceId || !isOpen) return;
    setLoading(true);
    donorDonationService.getDonationDetail(invoiceId).then((res) => {
      setRecord(res);
      setLoading(false);
    });
  }, [invoiceId, isOpen]);

  const row = (label: string, value: string) => (
    <Flex justify="space-between" py="8px">
      <Text color={labelColor} fontSize="sm">{label}</Text>
      <Text color={textColor} fontSize="sm" fontWeight="600">{value}</Text>
    </Flex>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent borderRadius="20px">
        <ModalHeader color={textColor}>Donation Detail</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb="24px">
          {loading ? (
            <Loader message="Loading donation details…" subtitle="Please wait while we fetch this donation" />
          ) : record ? (
            <Box>
              <Flex align="center" gap="12px" mb="20px">
                <Avatar src={record.campaignImageUrl ?? undefined} name={record.campaignName} size="md" borderRadius="10px" />
                <Box>
                  <Text color={textColor} fontWeight="700">{record.campaignName}</Text>
                  <Text color={labelColor} fontSize="sm">{record.organizerName}</Text>
                </Box>
                <Badge ml="auto" colorScheme={STATUS_COLORS[record.status] ?? 'gray'} borderRadius="8px" px="8px">{record.status}</Badge>
              </Flex>
              <Divider mb="8px" />
              {row('Invoice No', record.invoiceNo)}
              {row('Date', new Date(record.donationDateUtc).toLocaleString())}
              {row('Amount', `$${record.amount.toLocaleString()}`)}
              {record.tipAmount > 0 && row('Tip', `$${record.tipAmount}`)}
              {row('Total', `$${(record.amount + record.tipAmount).toLocaleString()}`)}
              {row('Frequency', record.frequency)}
              {row('Payment Method', record.paymentMethod)}
              <Divider mt="8px" mb="16px" />
              <DownloadReceiptButton receiptUrl={record.receiptUrl} invoiceNo={record.invoiceNo} size="md" />
            </Box>
          ) : (
            <Text color={labelColor} textAlign="center">Unable to load donation details.</Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default DonationDetailModal;
