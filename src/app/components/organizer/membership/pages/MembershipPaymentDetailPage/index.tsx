import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Icon,
  IconButton,
  SimpleGrid,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import {
  MdArrowBack,
  MdContentCopy,
  MdDownload,
  MdEmail,
  MdLocalPhone,
  MdOutlineEmail,
  MdStickyNote2,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import Loader from 'app/components/common/Loader';
import { useMembershipPaymentDetail } from './useMembershipPaymentDetail';
import AddNoteModal from './AddNoteModal';
import SendInvoiceEmailModal from '../../common/SendInvoiceEmailModal';
import membershipPaymentService, {
  type MembershipPaymentDetailNote,
} from '../../services/membershipPaymentService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAYMENT_METHOD_DISPLAY: Record<string, string> = {
  CreditCard: 'Debit/Credit Card',
  Ach: 'ACH-USD',
  Pad: 'PAD-CAD',
  Cheque: 'Check/Cheque',
};

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ', ' +
    d
      .toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      .toLowerCase()
  );
}

function val(v: string | null | undefined) {
  return v && v.trim() ? v : '—';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box
      bg="gray.50"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      px={4}
      py={3}
    >
      <Text
        fontSize="10px"
        fontWeight="bold"
        color="gray.400"
        textTransform="uppercase"
        letterSpacing="wider"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="semibold" color="gray.800">
        {value}
      </Text>
    </Box>
  );
}

function SectionCard({
  title,
  rightSlot,
  children,
}: {
  title: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="sm"
      mb={4}
    >
      <Flex
        align="center"
        justify="space-between"
        px={5}
        py={4}
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        <Text fontSize="sm" fontWeight="700" color="gray.800">
          {title}
        </Text>
        {rightSlot}
      </Flex>
      <Box px={5} py={4}>
        {children}
      </Box>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MembershipPaymentDetailPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { invoiceId, detail, isLoading, error } = useMembershipPaymentDetail();

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [localNotes, setLocalNotes] = useState<MembershipPaymentDetailNote[]>([]);
  const [notesSynced, setNotesSynced] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!invoiceId || !detail) return;

    setIsDownloading(true);
    try {
      const response = await membershipPaymentService.downloadMembershipInvoicePDF(invoiceId);
      const downloadUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Invoice-${detail.invoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast({
        title: 'Failed to download invoice PDF',
        status: 'error',
        duration: 3000,
        position: 'top-right',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Sync notes from fetched detail into local state once
  if (detail && !notesSynced) {
    setLocalNotes(detail.notes);
    setNotesSynced(true);
  }

  const handleNoteAdded = () => {
    setNoteModalOpen(false);
    if (!invoiceId) return;
    membershipPaymentService
      .getMembershipPaymentNotes(invoiceId)
      .then((res) => setLocalNotes(res.data?.data ?? []))
      .catch(() => {});
  };

  const copyInvoiceNo = () => {
    if (!detail) return;
    navigator.clipboard.writeText(detail.invoiceNo).then(() => {
      toast({
        title: 'Copied to clipboard',
        status: 'success',
        duration: 2000,
        position: 'top-right',
      });
    });
  };

  const goBack = () => navigate('/organizer/membership/payments');

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Box minH="100vh" bg="gray.50" pt={4} pb={8}>
        <Box mx={{ base: 2, md: 4 }} mt={{ base: 6, md: 10 }}>
          <Button
            size="sm"
            variant="ghost"
            color="#044bd9"
            leftIcon={<Icon as={MdArrowBack} />}
            borderRadius="full"
            onClick={goBack}
            mb={4}
          >
            Back to invoices
          </Button>
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            p={8}
            boxShadow="sm"
          >
            <Loader
              message="Loading Invoice"
              subtitle="Fetching membership invoice details..."
            />
          </Box>
        </Box>
      </Box>
    );
  }

  // ── Error / not found ─────────────────────────────────────────────────────
  if (error || !detail) {
    return (
      <Box minH="100vh" bg="gray.50" pt={4} pb={8}>
        <Box mx={{ base: 2, md: 4 }} mt={{ base: 6, md: 10 }}>
          <Button
            size="sm"
            variant="ghost"
            color="#044bd9"
            leftIcon={<Icon as={MdArrowBack} />}
            borderRadius="full"
            onClick={goBack}
            mb={4}
          >
            Back to invoices
          </Button>
          <Box
            bg="white"
            border="1px solid"
            borderColor="red.200"
            borderRadius="xl"
            p={6}
            boxShadow="sm"
          >
            <Text fontSize="sm" fontWeight="700" color="red.500" mb={1}>
              Invoice unavailable
            </Text>
            <Text fontSize="sm" color="gray.600">
              {error ?? 'No invoice data found.'}
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const paymentMethodLabel =
    PAYMENT_METHOD_DISPLAY[detail.paymentMethod] ?? detail.paymentMethod;

  return (
    <Box minH="100vh" bg="gray.50" pt={4} pb={8}>
      <Box mx={{ base: 2, md: 4 }} mt={{ base: 6, md: 10 }}>

        {/* Nav row */}
        <Flex align="center" justify="space-between" mb={4}>
          <Button
            size="sm"
            variant="ghost"
            color="#044bd9"
            leftIcon={<Icon as={MdArrowBack} />}
            borderRadius="full"
            onClick={goBack}
            _hover={{ bg: 'blue.50' }}
          >
            Back to invoices
          </Button>
          <Flex gap={2}>
            <IconButton
              aria-label="Send via email"
              icon={<Icon as={MdOutlineEmail} boxSize={4} />}
              size="sm"
              variant="outline"
              borderColor="gray.200"
              borderRadius="lg"
              color="gray.500"
              _hover={{ bg: 'blue.50', borderColor: 'blue.200', color: '#044bd9' }}
              onClick={() => setEmailModalOpen(true)}
            />
            <IconButton
              aria-label="Download invoice"
              icon={<Icon as={MdDownload} boxSize={4} />}
              size="sm"
              variant="outline"
              borderColor="gray.200"
              borderRadius="lg"
              color="gray.500"
              _hover={{ bg: 'blue.50', borderColor: 'blue.200', color: '#044bd9' }}
              onClick={handleDownload}
              isLoading={isDownloading}
            />
          </Flex>
        </Flex>

        {/* Invoice number */}
        <Box mb={5}>
          <Text
            fontSize="10px"
            fontWeight="bold"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="wider"
            mb={1}
          >
            Invoice Number
          </Text>
          <Flex align="center" gap={2}>
            <Text fontSize="2xl" fontWeight="800" color="gray.900" lineHeight={1}>
              {detail.invoiceNo}
            </Text>
            <IconButton
              aria-label="Copy invoice number"
              icon={<Icon as={MdContentCopy} boxSize={3.5} />}
              size="xs"
              variant="ghost"
              color="gray.400"
              borderRadius="md"
              onClick={copyInvoiceNo}
              _hover={{ bg: 'gray.100', color: 'gray.600' }}
            />
          </Flex>
        </Box>

        {/* Info cards grid */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={3} mb={4}>
          <InfoCard
            label="Invoice Amount"
            value={`${detail.currencySymbol}${detail.invoiceAmount.toFixed(2)}`}
          />
          <InfoCard label="Membership" value={detail.membershipName} />
          <InfoCard label="Payment Method" value={paymentMethodLabel} />
          <InfoCard
            label="Invoice Date"
            value={fmtDateTime(detail.invoiceDate)}
          />
          <InfoCard label="Payment Status" value={detail.paymentStatus} />
          <InfoCard label="Payment Source" value={val(detail.paymentSource)} />
        </SimpleGrid>

        {/* Notes */}
        <SectionCard
          title="Notes"
          rightSlot={
            <Button
              size="xs"
              variant="outline"
              borderColor="gray.300"
              color="gray.600"
              borderRadius="lg"
              leftIcon={<Icon as={MdStickyNote2} boxSize={3.5} />}
              _hover={{ bg: 'blue.50', borderColor: 'blue.200', color: '#044bd9' }}
              onClick={() => setNoteModalOpen(true)}
            >
              + Add Note
            </Button>
          }
        >
          {localNotes.length === 0 ? (
            <Flex direction="column" align="center" py={6} gap={2}>
              <Icon as={MdStickyNote2} boxSize={7} color="gray.200" />
              <Text fontSize="sm" fontWeight="semibold" color="gray.500">
                No notes captured
              </Text>
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Captured invoice notes will appear here when they are added.
              </Text>
            </Flex>
          ) : (
            <VStack align="stretch" spacing={2}>
              {localNotes.map((n, i) => (
                <Box
                  key={i}
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.100"
                  borderRadius="lg"
                  px={3}
                  py={2.5}
                >
                  <Flex justify="space-between" mb={0.5}>
                    <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                      {n.createdBy}
                    </Text>
                    <Text fontSize="10px" color="gray.400">
                      {fmtDateTime(n.createdOnUtc)}
                    </Text>
                  </Flex>
                  <Text fontSize="xs" color="gray.600">
                    {n.note}
                  </Text>
                </Box>
              ))}
            </VStack>
          )}
        </SectionCard>

        {/* Member detail */}
        <SectionCard title="Member detail">
          {/* Contact row */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            {/* Name */}
            <Box
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              px={4}
              py={3}
            >
              <Flex align="center" justify="space-between" mb={1}>
                <Text
                  fontSize="10px"
                  fontWeight="bold"
                  color="gray.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Name
                </Text>
                <Button
                  size="xs"
                  variant="link"
                  color="#044bd9"
                  fontSize="10px"
                  fontWeight="semibold"
                  onClick={() =>
                    window.open(
                      `/organizer/membership/member-profile?uniqueId=${encodeURIComponent(
                        detail.member.uniqueId,
                      )}`,
                      '_blank',
                      'noopener,noreferrer',
                    )
                  }
                >
                  View Detail
                </Button>
              </Flex>
              <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                {val(detail.member.name)}
              </Text>
            </Box>

            {/* Email */}
            <Box
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              px={4}
              py={3}
            >
              <Flex align="center" gap={1} mb={1}>
                <Icon as={MdEmail} boxSize={3} color="gray.400" />
                <Text
                  fontSize="10px"
                  fontWeight="bold"
                  color="gray.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Email
                </Text>
              </Flex>
              <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                {val(detail.member.email)}
              </Text>
            </Box>

            {/* Phone */}
            <Box
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              px={4}
              py={3}
            >
              <Flex align="center" gap={1} mb={1}>
                <Icon as={MdLocalPhone} boxSize={3} color="gray.400" />
                <Text
                  fontSize="10px"
                  fontWeight="bold"
                  color="gray.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Phone
                </Text>
              </Flex>
              <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                {val(detail.member.phone)}
              </Text>
            </Box>
          </SimpleGrid>

          {/* Address row */}
          <Divider mb={4} borderColor="gray.100" />
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Box
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              px={4}
              py={3}
            >
              <Text
                fontSize="10px"
                fontWeight="bold"
                color="gray.400"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1}
              >
                Street Line 1
              </Text>
              <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                {val(detail.member.streetLine1)}
              </Text>
            </Box>
            <Box
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              px={4}
              py={3}
            >
              <Text
                fontSize="10px"
                fontWeight="bold"
                color="gray.400"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1}
              >
                Street Line 2
              </Text>
              <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                {val(detail.member.streetLine2)}
              </Text>
            </Box>
            <Box
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              px={4}
              py={3}
            >
              <Text
                fontSize="10px"
                fontWeight="bold"
                color="gray.400"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1}
              >
                Zip
              </Text>
              <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                {val(detail.member.zip)}
              </Text>
            </Box>
          </SimpleGrid>
        </SectionCard>

        {/* Line items */}
        <SectionCard title="Line items">
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  {['Description', 'Qty', 'Rate', 'Tax', 'Service', 'Amount'].map(
                    (h) => (
                      <Th
                        key={h}
                        color="gray.500"
                        fontWeight="bold"
                        fontSize="10px"
                        textTransform="uppercase"
                        letterSpacing="wider"
                        isNumeric={h !== 'Description'}
                        py={2}
                        borderColor="gray.100"
                      >
                        {h}
                      </Th>
                    ),
                  )}
                </Tr>
              </Thead>
              <Tbody>
                {detail.lineItems.map((item, i) => (
                  <Tr
                    key={i}
                    bg={i % 2 === 0 ? 'white' : 'gray.50'}
                    _hover={{ bg: 'blue.50' }}
                  >
                    <Td
                      fontSize="sm"
                      color="gray.700"
                      borderColor="gray.100"
                      py={3}
                    >
                      {item.description}
                    </Td>
                    <Td
                      isNumeric
                      fontSize="sm"
                      color="gray.700"
                      borderColor="gray.100"
                      py={3}
                    >
                      {item.quantity}
                    </Td>
                    <Td
                      isNumeric
                      fontSize="sm"
                      color="gray.700"
                      borderColor="gray.100"
                      py={3}
                    >
                      {detail.currencySymbol}
                      {item.unitPrice.toFixed(2)}
                    </Td>
                    <Td
                      isNumeric
                      fontSize="sm"
                      color="gray.700"
                      borderColor="gray.100"
                      py={3}
                    >
                      {detail.currencySymbol}
                      {(item.taxCharges.amount ?? 0).toFixed(2)}
                    </Td>
                    <Td
                      isNumeric
                      fontSize="sm"
                      color="gray.700"
                      borderColor="gray.100"
                      py={3}
                    >
                      {detail.currencySymbol}
                      {(item.serviceCharges.amount ?? 0).toFixed(2)}
                    </Td>
                    <Td
                      isNumeric
                      fontSize="sm"
                      fontWeight="semibold"
                      color="gray.900"
                      borderColor="gray.100"
                      py={3}
                    >
                      {detail.currencySymbol}
                      {item.total.toFixed(2)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
              <Tfoot>
                <Tr bg="gray.50">
                  <Td
                    colSpan={5}
                    fontSize="sm"
                    fontWeight="700"
                    color="gray.800"
                    borderTop="2px solid"
                    borderColor="gray.200"
                    py={3}
                  >
                    Net Total
                  </Td>
                  <Td
                    isNumeric
                    fontSize="sm"
                    fontWeight="800"
                    color="gray.900"
                    borderTop="2px solid"
                    borderColor="gray.200"
                    py={3}
                  >
                    {detail.currencySymbol}
                    {detail.netTotal.toFixed(2)}
                  </Td>
                </Tr>
              </Tfoot>
            </Table>
          </TableContainer>
        </SectionCard>
      </Box>

      {invoiceId && (
        <AddNoteModal
          isOpen={noteModalOpen}
          invoiceId={invoiceId}
          onClose={() => setNoteModalOpen(false)}
          onSaved={handleNoteAdded}
        />
      )}

      {invoiceId && detail && (
        <SendInvoiceEmailModal
          isOpen={emailModalOpen}
          invoiceId={invoiceId}
          recipientEmail={detail.member.email}
          onClose={() => setEmailModalOpen(false)}
        />
      )}
    </Box>
  );
}
