import React from 'react';
import {
  Badge,
  Box,
  Flex,
  Icon,
  SimpleGrid,
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
import type { IconType } from 'react-icons';
import {
  MdAccountBalanceWallet,
  MdAttachMoney,
  MdCalendarToday,
  MdCardMembership,
  MdCheckCircle,
  MdCreditCard,
  MdDescription,
  MdEmail,
  MdListAlt,
  MdLocalPhone,
  MdLocationOn,
  MdPerson,
  MdReceiptLong,
  MdStickyNote2,
} from 'react-icons/md';
import type {
  MembershipPaymentDetailLineItem,
  MembershipPaymentDetailNote,
} from '../services/membershipPaymentService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceDocumentMember {
  name: string;
  email: string;
  phone: string;
  streetLine1: string | null;
  streetLine2: string | null;
  zip: string | null;
}

export interface InvoiceDocumentData {
  invoiceNo: string;
  invoiceDate: string;
  invoiceAmount: number;
  paymentMethod: string;
  paymentSource: string | null;
  paymentStatus: string;
  membershipName: string;
  currencySymbol: string;
  member: InvoiceDocumentMember;
  notes: MembershipPaymentDetailNote[];
  lineItems: MembershipPaymentDetailLineItem[];
  netTotal: number;
}

interface Props {
  data: InvoiceDocumentData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAYMENT_METHOD_DISPLAY: Record<string, string> = {
  CreditCard: 'Debit/Credit Card',
  Ach: 'ACH-USD',
  Pad: 'PAD-CAD',
  Cheque: 'Check/Cheque',
};

const STATUS_LABEL: Record<string, string> = {
  Paid: 'Payment Success',
  PendingPayment: 'Payment Pending',
  PartiallyPaid: 'Partially Paid',
  Cancelled: 'Payment Cancelled',
  Refund: 'Refunded',
  AdjustedInSystem: 'Adjusted',
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

function SectionHeading({ icon, title }: { icon: IconType; title: string }) {
  return (
    <Flex align="center" gap={2} mb={3}>
      <Flex
        align="center"
        justify="center"
        boxSize={7}
        borderRadius="md"
        bg="blue.50"
        flexShrink={0}
      >
        <Icon as={icon} boxSize={3.5} color="#044bd9" />
      </Flex>
      <Text fontSize="sm" fontWeight="800" color="gray.800">
        {title}
      </Text>
    </Flex>
  );
}

function SummaryCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: IconType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Flex
      align="flex-start"
      gap={3}
      bg="white"
      border="1px solid"
      borderColor="gray.100"
      borderRadius="lg"
      px={4}
      py={3}
    >
      <Flex
        align="center"
        justify="center"
        boxSize={9}
        borderRadius="lg"
        bg={iconBg}
        flexShrink={0}
      >
        <Icon as={icon} boxSize={4} color={iconColor} />
      </Flex>
      <Box minW={0}>
        <Text
          fontSize="10px"
          fontWeight="bold"
          color="gray.400"
          textTransform="uppercase"
          letterSpacing="wider"
          mb={0.5}
        >
          {label}
        </Text>
        <Text fontSize="sm" fontWeight="700" color="gray.800" noOfLines={1}>
          {value}
        </Text>
      </Box>
    </Flex>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const InvoiceDocument = React.forwardRef<HTMLDivElement, Props>(
  ({ data }, ref) => {
    const paymentMethodLabel =
      PAYMENT_METHOD_DISPLAY[data.paymentMethod] ?? data.paymentMethod;
    const statusLabel =
      STATUS_LABEL[data.paymentStatus] ??
      data.paymentStatus.replace(/([A-Z])/g, ' $1').trim();

    return (
      <Box
        ref={ref}
        bg="white"
        borderRadius="2xl"
        overflow="hidden"
        maxW="900px"
        mx="auto"
      >
        {/* Header */}
        <Box
          bgGradient="linear(135deg, #0a3fc4, #2f7af0)"
          px={8}
          py={8}
          color="white"
        >
          <Flex justify="space-between" align="flex-start" wrap="wrap" gap={4}>
            <Flex gap={3} align="flex-start">
              <Flex
                align="center"
                justify="center"
                boxSize={11}
                borderRadius="lg"
                bg="whiteAlpha.200"
                flexShrink={0}
              >
                <Icon as={MdDescription} boxSize={5} />
              </Flex>
              <Box>
                <Text
                  fontSize="10px"
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color="whiteAlpha.700"
                  mb={1}
                >
                  Invoice Number
                </Text>
                <Text fontSize="2xl" fontWeight="800" lineHeight={1.1} mb={1}>
                  {data.invoiceNo}
                </Text>
                <Text fontSize="xs" color="whiteAlpha.800">
                  Issued on {fmtDateTime(data.invoiceDate)}
                </Text>
              </Box>
            </Flex>
            <Box textAlign="right">
              <Badge
                bg="whiteAlpha.200"
                color="white"
                border="1px solid"
                borderColor="whiteAlpha.400"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="10px"
                fontWeight="bold"
                letterSpacing="wider"
                textTransform="uppercase"
                mb={2}
                display="inline-block"
              >
                {statusLabel}
              </Badge>
              <Text
                fontSize="10px"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                color="whiteAlpha.700"
                mb={1}
              >
                Invoice Amount
              </Text>
              <Text fontSize="2xl" fontWeight="800" lineHeight={1.1}>
                {data.currencySymbol}
                {data.invoiceAmount.toFixed(2)}
              </Text>
            </Box>
          </Flex>
        </Box>

        {/* Body */}
        <Box px={8} py={6}>
          {/* Payment Summary */}
          <SectionHeading icon={MdReceiptLong} title="Payment Summary" />
          <SimpleGrid columns={3} spacing={3} mb={6}>
            <SummaryCard
              icon={MdCreditCard}
              iconBg="green.50"
              iconColor="green.500"
              label="Payment Method"
              value={paymentMethodLabel}
            />
            <SummaryCard
              icon={MdCardMembership}
              iconBg="blue.50"
              iconColor="blue.500"
              label="Membership"
              value={data.membershipName}
            />
            <SummaryCard
              icon={MdCalendarToday}
              iconBg="orange.50"
              iconColor="orange.500"
              label="Invoice Date"
              value={fmtDateTime(data.invoiceDate)}
            />
            <SummaryCard
              icon={MdAccountBalanceWallet}
              iconBg="purple.50"
              iconColor="purple.500"
              label="Payment Source"
              value={val(data.paymentSource)}
            />
            <SummaryCard
              icon={MdCheckCircle}
              iconBg="green.50"
              iconColor="green.500"
              label="Payment Status"
              value={data.paymentStatus}
            />
            <SummaryCard
              icon={MdAttachMoney}
              iconBg="purple.50"
              iconColor="purple.500"
              label="Invoice Amount"
              value={`${data.currencySymbol}${data.invoiceAmount.toFixed(2)}`}
            />
          </SimpleGrid>

          {/* Notes */}
          <SectionHeading icon={MdStickyNote2} title="Notes" />
          <VStack align="stretch" spacing={1.5} mb={4}>
            {data.notes.length === 0 ? (
              <Box
                bg="gray.50"
                border="1px solid"
                borderColor="gray.100"
                borderRadius="lg"
                px={3}
                py={2.5}
                textAlign="center"
              >
                <Text fontSize="sm" color="gray.400">
                  No notes captured for this invoice.
                </Text>
              </Box>
            ) : (
              data.notes.map((n, i) => (
                <Flex
                  key={i}
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.100"
                  borderRadius="lg"
                  px={3}
                  py={2}
                  gap={2}
                  align="flex-start"
                >
                  <Flex
                    align="center"
                    justify="center"
                    boxSize={8}
                    borderRadius="full"
                    bg="blue.100"
                    color="#044bd9"
                    flexShrink={0}
                  >
                    <Icon as={MdPerson} boxSize={3.5} />
                  </Flex>
                  <Box flex={1} minW={0}>
                    <Flex
                      justify="space-between"
                      align="center"
                      mb={0.5}
                      wrap="wrap"
                      gap={1}
                    >
                      <Flex align="center" gap={2}>
                        <Text fontSize="sm" fontWeight="700" color="gray.800">
                          {n.createdBy}
                        </Text>
                        <Badge
                          bg="blue.50"
                          color="#044bd9"
                          fontSize="9px"
                          fontWeight="bold"
                          borderRadius="md"
                          px={1.5}
                          py={0.5}
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Staff Note
                        </Badge>
                      </Flex>
                      <Text fontSize="10px" color="gray.400">
                        {fmtDateTime(n.createdOnUtc)}
                      </Text>
                    </Flex>
                    <Text fontSize="xs" color="gray.600">
                      {n.note}
                    </Text>
                  </Box>
                </Flex>
              ))
            )}
          </VStack>

          {/* Member Detail */}
          <SectionHeading icon={MdPerson} title="Member Detail" />
          <Box
            bg="gray.50"
            border="1px solid"
            borderColor="gray.100"
            borderRadius="lg"
            px={3}
            py={3}
            mb={4}
          >
            <Flex align="center" gap={2} mb={3}>
              <Flex
                align="center"
                justify="center"
                boxSize={8}
                borderRadius="full"
                bg="blue.100"
                color="#044bd9"
                flexShrink={0}
              >
                <Icon as={MdPerson} boxSize={3.5} />
              </Flex>
              <Box>
                <Text
                  fontSize="10px"
                  fontWeight="bold"
                  color="gray.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  mb={0.5}
                >
                  Name
                </Text>
                <Text fontSize="sm" fontWeight="700" color="gray.800">
                  {val(data.member.name)}
                </Text>
              </Box>
            </Flex>

            <SimpleGrid columns={2} spacing={2} mb={3}>
              <Flex
                align="center"
                gap={2}
                bg="white"
                border="1px solid"
                borderColor="gray.100"
                borderRadius="lg"
                px={2.5}
                py={2}
              >
                <Icon as={MdEmail} boxSize={4} color="gray.400" />
                <Box minW={0}>
                  <Text
                    fontSize="10px"
                    fontWeight="bold"
                    color="gray.400"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Email
                  </Text>
                  <Text fontSize="sm" fontWeight="600" color="gray.800" noOfLines={1}>
                    {val(data.member.email)}
                  </Text>
                </Box>
              </Flex>
              <Flex
                align="center"
                gap={2}
                bg="white"
                border="1px solid"
                borderColor="gray.100"
                borderRadius="lg"
                px={2.5}
                py={2}
              >
                <Icon as={MdLocalPhone} boxSize={4} color="gray.400" />
                <Box minW={0}>
                  <Text
                    fontSize="10px"
                    fontWeight="bold"
                    color="gray.400"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Phone
                  </Text>
                  <Text fontSize="sm" fontWeight="600" color="gray.800" noOfLines={1}>
                    {val(data.member.phone)}
                  </Text>
                </Box>
              </Flex>
            </SimpleGrid>

            <Box
              bg="white"
              border="1px solid"
              borderColor="gray.100"
              borderRadius="lg"
              px={3}
              py={2.5}
            >
              <Flex align="center" gap={1.5} mb={1.5}>
                <Icon as={MdLocationOn} boxSize={3.5} color="gray.400" />
                <Text
                  fontSize="10px"
                  fontWeight="bold"
                  color="gray.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Address
                </Text>
              </Flex>
              <SimpleGrid columns={3} spacing={3}>
                <Box>
                  <Text fontSize="10px" color="gray.400" mb={0.5}>
                    Street Line 1
                  </Text>
                  <Text fontSize="sm" fontWeight="600" color="gray.800">
                    {val(data.member.streetLine1)}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="10px" color="gray.400" mb={0.5}>
                    Street Line 2
                  </Text>
                  <Text fontSize="sm" fontWeight="600" color="gray.800">
                    {val(data.member.streetLine2)}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="10px" color="gray.400" mb={0.5}>
                    Zip
                  </Text>
                  <Text fontSize="sm" fontWeight="600" color="gray.800">
                    {val(data.member.zip)}
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>
          </Box>

          {/* Line Items */}
          <SectionHeading icon={MdListAlt} title="Line Items" />
          <TableContainer border="1px solid" borderColor="gray.100" borderRadius="lg">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
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
                {data.lineItems.map((item, i) => (
                  <Tr key={i}>
                    <Td fontSize="sm" color="gray.700" borderColor="gray.100" py={3}>
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
                      {data.currencySymbol}
                      {item.unitPrice.toFixed(2)}
                    </Td>
                    <Td
                      isNumeric
                      fontSize="sm"
                      color="gray.700"
                      borderColor="gray.100"
                      py={3}
                    >
                      {data.currencySymbol}
                      {(item.taxCharges.amount ?? 0).toFixed(2)}
                    </Td>
                    <Td
                      isNumeric
                      fontSize="sm"
                      color="gray.700"
                      borderColor="gray.100"
                      py={3}
                    >
                      {data.currencySymbol}
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
                      {data.currencySymbol}
                      {item.total.toFixed(2)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
              <Tfoot>
                <Tr bg="blue.50">
                  <Td
                    colSpan={5}
                    fontSize="sm"
                    fontWeight="700"
                    color="gray.800"
                    borderColor="gray.100"
                    py={3}
                  >
                    Net Total
                  </Td>
                  <Td
                    isNumeric
                    fontSize="sm"
                    fontWeight="800"
                    color="#044bd9"
                    borderColor="gray.100"
                    py={3}
                  >
                    {data.currencySymbol}
                    {data.netTotal.toFixed(2)}
                  </Td>
                </Tr>
              </Tfoot>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    );
  },
);

InvoiceDocument.displayName = 'InvoiceDocument';

export default InvoiceDocument;
