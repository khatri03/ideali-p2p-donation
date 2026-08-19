import { useEffect, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  Icon,
  IconButton,
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
  useToast,
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
import { useNavigate, useParams } from 'react-router-dom';
import Loader from 'app/components/common/Loader';
import type { InvoiceDocumentData } from 'app/components/organizer/membership/common/InvoiceDocument';
import SendInvoiceEmailModal from 'app/components/organizer/membership/common/SendInvoiceEmailModal';
import membershipInvoiceService from '../services/membershipInvoiceService';

export default function MembershipInvoiceDetailPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [data, setData] = useState<InvoiceDocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const handleDownload = async () => {
    if (!invoiceId || !data) return;

    setIsDownloading(true);
    try {
      const blob = await membershipInvoiceService.downloadInvoicePDF(invoiceId);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Invoice-${data.invoiceNo}.pdf`;
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

  useEffect(() => {
    if (!invoiceId) {
      setError('Invoice ID is missing.');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    membershipInvoiceService
      .getInvoiceDetail(invoiceId)
      .then((result) => {
        if (!isMounted) return;
        if (!result) {
          setError('No invoice data found.');
          return;
        }
        setData(result);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Failed to load invoice details.');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [invoiceId]);

  const goBack = () => navigate('/member/membership-history');

  const copyInvoiceNo = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.invoiceNo).then(() => {
      toast({
        title: 'Copied to clipboard',
        status: 'success',
        duration: 2000,
        position: 'top-right',
      });
    });
  };

  if (isLoading) {
    return (
      <Box minH="100vh" bg="gray.50" pt={4} pb={8}>
        <Box mx={{ base: 2, md: 4 }} mt={{ base: 6, md: 10 }}>
          <Flex justify="space-between" align="center" mb={4} gap={3} wrap="wrap">
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
          </Flex>
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={8} boxShadow="sm">
            <Loader message="Loading Invoice" subtitle="Fetching membership invoice details..." />
          </Box>
        </Box>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box minH="100vh" bg="gray.50" pt={4} pb={8}>
        <Box mx={{ base: 2, md: 4 }} mt={{ base: 6, md: 10 }}>
          <Flex justify="space-between" align="center" mb={4} gap={3} wrap="wrap">
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
          </Flex>
          <Box bg="white" border="1px solid" borderColor="red.200" borderRadius="xl" p={6} boxShadow="sm">
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

  const statusLabel = data.paymentStatus
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim();

  const paymentMethodLabel =
    {
      CreditCard: 'Debit/Credit Card',
      Ach: 'ACH-USD',
      Pad: 'PAD-CAD',
      Cheque: 'Check/Cheque',
    }[data.paymentMethod] ?? data.paymentMethod;

  return (
    <Box minH="100vh" bg="gray.50" pt={4} pb={8}>
      <Box mx={{ base: 2, md: 4 }} mt={{ base: 6, md: 10 }}>
        <Flex align="center" justify="space-between" mb={4} gap={3} wrap="wrap">
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
              aria-label="Email invoice"
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
              {data.invoiceNo}
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

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={3} mb={4}>
          <InfoCard
            label="Invoice Amount"
            value={`${data.currencySymbol}${data.invoiceAmount.toFixed(2)}`}
          />
          <InfoCard label="Membership" value={data.membershipName} />
          <InfoCard label="Payment Method" value={paymentMethodLabel} />
          <InfoCard
            label="Invoice Date"
            value={new Date(data.invoiceDate).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
          <InfoCard label="Payment Status" value={statusLabel} />
          <InfoCard label="Payment Source" value={data.paymentSource ?? '-'} />
        </SimpleGrid>

        <SectionCard title="Notes">
          {data.notes.length === 0 ? (
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
              {data.notes.map((n, i) => (
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
                      {new Date(n.createdOnUtc).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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

        <SectionCard title="Member detail">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
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
                Name
              </Text>
              <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                {data.member.name || '-'}
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
                {data.member.email || '-'}
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
                {data.member.phone || '-'}
              </Text>
            </Box>
          </SimpleGrid>

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
                {data.member.streetLine1 ?? '-'}
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
                {data.member.streetLine2 ?? '-'}
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
                {data.member.zip ?? '-'}
              </Text>
            </Box>
          </SimpleGrid>
        </SectionCard>

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
                {data.lineItems.map((item, i) => (
                  <Tr
                    key={i}
                    bg={i % 2 === 0 ? 'white' : 'gray.50'}
                    _hover={{ bg: 'blue.50' }}
                  >
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
                    {data.currencySymbol}
                    {data.netTotal.toFixed(2)}
                  </Td>
                </Tr>
              </Tfoot>
            </Table>
          </TableContainer>
        </SectionCard>
      </Box>

      {invoiceId && data && (
        <SendInvoiceEmailModal
          isOpen={emailModalOpen}
          invoiceId={invoiceId}
          recipientEmail={data.member.email}
          onClose={() => setEmailModalOpen(false)}
          sendEmail={membershipInvoiceService.sendInvoiceEmail}
        />
      )}
    </Box>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
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
      </Flex>
      <Box px={5} py={4}>
        {children}
      </Box>
    </Box>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
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
