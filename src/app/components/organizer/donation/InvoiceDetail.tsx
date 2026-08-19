import React, { useState, useEffect } from 'react';
import {
  useParams,
  Navigate,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Badge,
  Flex,
  VStack,
  HStack,
  Divider,
  Button,
  Icon,
  Grid,
  GridItem,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Center,
  Image,
} from '@chakra-ui/react';
import {
  FiMail,
  FiPhone,
  FiUser,
  FiHeart,
  FiFileText,
  FiPlus,
} from 'react-icons/fi';
import {
  fetchInvoiceDetail,
  fetchPublicInvoiceDetail,
  downloadPublicInvoicePDF,
  downloadInvoicePDF,
} from 'app/service/organizer/donation/InvoiceService';
import {
  formatDate,
  getFullName,
} from './organizerDonationComponents/helperFuntions';
import Loader from '../../common/Loader';
import { useToast } from '@chakra-ui/react';
import { FiSend } from 'react-icons/fi';
import sendInvoiceService from '../../../service/organizer/donation/sendInvoiceService';
import { hasPermission } from '../../../service/organizer/rolesPermissions/permissionsService';

const InvoiceDetailComponent: React.FC = () => {
  const { invoiceUniqueId } = useParams<{ invoiceUniqueId: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const toast = useToast();
  const [isSending, setIsSending] = useState(false);

  // Check if this is the public route (no auth required)
  const isPublicRoute = location.pathname.startsWith('/invoice/');

  // Check if PDF is being generated (hide download button in screenshot)
  // Use multiple detection methods for robustness
  const isPdfMode =
    searchParams.get('pdf') === 'true' ||
    window.location.search.includes('pdf=true') ||
    window.location.href.includes('pdf=true');

  const cardBg = useColorModeValue('white', 'gray.800');
  const noteBg = useColorModeValue('gray.50', 'gray.700');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchInvoiceData();
  }, [invoiceUniqueId]);

  const fetchInvoiceData = async () => {
    if (!invoiceUniqueId) return;

    setLoading(true);
    setError(null);

    try {
      // Use public API for public route, otherwise use authenticated API
      const response = isPublicRoute
        ? await fetchPublicInvoiceDetail(invoiceUniqueId)
        : await fetchInvoiceDetail(invoiceUniqueId);

      setInvoiceData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid') return 'green';
    if (statusLower === 'pending') return 'yellow';
    if (statusLower === 'overdue') return 'red';
    return 'blue';
  };

  // Redirect if no invoiceUniqueId in URL
  if (!invoiceUniqueId) {
    return <Navigate to="/organizer/donation/list/paid" />;
  }

  if (loading) {
    return (
      <Flex
        minH="100vh"
        bg="gray.50"
        alignItems="center"
        justifyContent="center"
      >
        <Loader
          message="Loading Payment Details..."
          subtitle="Please wait for a while"
        />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" py={8}>
        <Container maxW="container.md">
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Box>
              <AlertTitle>Error Loading Payment</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
          <Button mt={4} colorScheme="blue" onClick={fetchInvoiceData}>
            Retry
          </Button>
        </Container>
      </Box>
    );
  }

  if (!invoiceData) {
    return (
      <Box minH="100vh" py={8}>
        <Container maxW="container.md">
          <Alert status="warning" borderRadius="lg">
            <AlertIcon />
            <AlertTitle>No payment data found</AlertTitle>
          </Alert>
        </Container>
      </Box>
    );
  }

  // Transform data for display
  const donorName = getFullName(invoiceData.contact);
  const donorEmail =
    invoiceData.contact.primaryEmail ||
    invoiceData.contact.secondaryEmail ||
    invoiceData.contact.workEmail ||
    'N/A';
  const donorPhone =
    invoiceData.contact.cellPhone ||
    invoiceData.contact.workPhone ||
    invoiceData.contact.homePhone ||
    'N/A';

  const handleDownloadPDF = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();
    if (!invoiceData || !invoiceUniqueId) return;

    setIsDownloading(true);
    try {
      console.log('Downloading PDF for invoice:', invoiceUniqueId);
      console.log('Is public route:', isPublicRoute);

      const pdfBlob = isPublicRoute
        ? await downloadPublicInvoicePDF(invoiceUniqueId)
        : await downloadInvoicePDF(invoiceUniqueId);

      console.log('PDF Blob received:', pdfBlob);

      // Create a download link
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `payment-${invoiceData.invoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error('Error in handleDownloadPDF:', error);
      alert(
        error.message || 'Failed to download payment PDF. Please try again.',
      );
    } finally {
      setIsDownloading(false);
    }
  };
  const handleSendInvoice = async () => {
    if (!invoiceUniqueId || !invoiceData) return;

    setIsSending(true);
    try {
      const loadingToast = toast({
        title: 'Sending Receipt...',
        description: `Please wait while we send Receipt ${invoiceData.invoiceNo} to ${donorEmail}`,
        status: 'loading',
        duration: null,
        isClosable: false,
        position: 'top-right',
      });

      await sendInvoiceService.sendInvoice(invoiceUniqueId);

      toast.close(loadingToast);
      toast({
        title: '✓ Receipt Sent Successfully!',
        description: `Payment ${invoiceData.invoiceNo} has been sent to ${donorEmail}`,
        status: 'success',
        duration: 6000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (err: any) {
      toast({
        title: '✗ Failed to Send Receipt',
        description: err.message || 'Unable to send Receipt. Please try again.',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsSending(false);
    }
  };
  return (
    <Box minH="100vh" py={4} mt={20}>
      <Container maxW="container.md">
        {/* PDF Download Button - Only show on public route and not in PDF mode */}
        {isPublicRoute && !isPdfMode && (
          <Flex
            justify="flex-end"
            mb={1}
            className="no-print"
            sx={{
              '@media print': {
                display: 'none !important',
              },
            }}
          >
            <Button
              leftIcon={<Icon as={FiFileText} />}
              colorScheme="blue"
              size="sm"
              onClick={handleDownloadPDF}
              isLoading={isDownloading}
              loadingText="Downloading..."
            >
              Download PDF
            </Button>
          </Flex>
        )}

        {/* Action Buttons - Only show appropriate button based on route */}
        {!isPdfMode && (
          <Flex justify="flex-end" mb={1} gap={2}>
            {/* Send Invoice Button - Only on non-public route and with Send permission */}
            {!isPublicRoute && hasPermission('Donation.Invoice.Send') && (
              <Button
                leftIcon={<Icon as={FiSend} />}
                colorScheme="blue"
                size="sm"
                onClick={handleSendInvoice}
                isLoading={isSending}
                loadingText="Sending..."
              >
                Send Receipt
              </Button>
            )}
          </Flex>
        )}
        <Box
          bg={cardBg}
          borderRadius="lg"
          overflow="hidden"
          boxShadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          {/* Header */}

          <Box
            bgGradient="linear(to-r, blue.500, blue.800)"
            color="white"
            p={4}
          >
            <Flex justify="space-between" align="start">
              <HStack spacing={4} align="start">
                {/* Logo */}
                {invoiceData.logoUrl && (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minW="80px"
                    maxW="80px"
                    h="50px"
                  >
                    <Image
                      src={invoiceData.logoUrl}
                      alt="Organization Logo"
                      maxH="100%"
                      maxW="100%"
                      objectFit="contain"
                    />
                  </Box>
                )}

                {/* Receipt Info */}
                <Box>
                  <HStack spacing={2} mb={1}>
                    <Icon as={FiFileText} boxSize={4} />
                    <Heading size="sm">
                      Receipt #{invoiceData.invoiceNo}
                    </Heading>
                  </HStack>
                  <Text fontSize="xs" color="blue.100">
                    Issued on {formatDate(invoiceData.invoiceDate)}
                  </Text>
                </Box>
              </HStack>
              <Box textAlign="right">
                <Badge
                  colorScheme={getStatusColor(invoiceData.invoiceStatus)}
                  px={2}
                  py={1}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="semibold"
                  mb={2}
                >
                  {invoiceData.invoiceStatus.toUpperCase()}
                </Badge>
                <Box>
                  <Text fontSize="xs" color="blue.100">
                    Total Amount
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    ${invoiceData.invoiceAmount.toFixed(2)}
                  </Text>
                </Box>

                {/* PDF Download Button - Only show on public route */}
              </Box>
            </Flex>
          </Box>

          <Box p={4}>
            <VStack spacing={4} align="stretch">
              {/* Donor and Campaign Info */}
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                {/* Donor Information */}
                <GridItem>
                  <HStack spacing={2} mb={2}>
                    <Icon as={FiUser} color="gray.600" boxSize={3.5} />
                    <Heading size="xs" color="gray.800">
                      Donor Information
                    </Heading>
                  </HStack>
                  <VStack align="stretch" spacing={1.5}>
                    <HStack spacing={2} color="gray.700">
                      <Icon as={FiUser} color="blue.600" boxSize={3.5} />
                      <Text fontSize="xs" fontWeight="medium">
                        {donorName}
                      </Text>
                    </HStack>
                    <HStack spacing={2} color="gray.600">
                      <Icon as={FiMail} color="blue.600" boxSize={3.5} />
                      <Text fontSize="xs">{donorEmail}</Text>
                    </HStack>
                    <HStack spacing={2} color="gray.600">
                      <Icon as={FiPhone} color="blue.600" boxSize={3.5} />
                      <Text fontSize="xs">{donorPhone}</Text>
                    </HStack>
                  </VStack>
                </GridItem>

                {/* Campaign Details */}
                <GridItem>
                  <HStack spacing={2} mb={2}>
                    <Icon as={FiHeart} color="gray.600" boxSize={3.5} />
                    <Heading size="xs" color="gray.800">
                      Campaign Details
                    </Heading>
                  </HStack>
                  <VStack align="stretch" spacing={1.5}>
                    <Box>
                      <Text fontSize="2xs" color="gray.500">
                        Campaign Name
                      </Text>
                      <Text fontSize="xs" fontWeight="medium" color="gray.800">
                        {invoiceData.invoiceContext.name}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="2xs" color="gray.500">
                        Payment Type
                      </Text>
                      <Text fontSize="xs" fontWeight="medium" color="gray.800">
                        {invoiceData.invoiceType}
                      </Text>
                    </Box>
                  </VStack>
                </GridItem>
              </Grid>

              {/* Notes Section */}
              {invoiceData.notes && invoiceData.notes.length > 0 && (
                <Box>
                  <Flex justify="space-between" align="center" mb={2}>
                    <HStack spacing={2}>
                      <Icon as={FiFileText} color="gray.600" boxSize={3.5} />
                      <Heading size="xs" color="gray.800">
                        Notes
                      </Heading>
                    </HStack>
                  </Flex>
                  <VStack spacing={1.5} align="stretch">
                    {invoiceData.notes.map((note: any, index: number) => (
                      <Box
                        key={index}
                        bg={noteBg}
                        p={2}
                        borderRadius="md"
                        border="1px"
                        borderColor="gray.200"
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="medium"
                          color="gray.800"
                          mb={0.5}
                        >
                          {note.createdBy}{' '}
                          <Text as="span" fontWeight="normal" color="gray.500">
                            • {formatDate(note.createdOnUtc)}
                          </Text>
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {note.note}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* Payment Breakdown */}
              <Box>
                <HStack spacing={2} mb={2}>
                  <Icon as={FiFileText} color="gray.600" boxSize={3.5} />
                  <Heading size="xs" color="gray.800">
                    Payment Details
                  </Heading>
                </HStack>
                <VStack spacing={1.5} align="stretch">
                  {invoiceData.invoiceItems.map((item: any, index: number) => (
                    <React.Fragment key={index}>
                      <Flex justify="space-between" align="center" py={1.5}>
                        <HStack spacing={2}>
                          <Text fontSize="xs" color="gray.700">
                            {item.description}
                          </Text>
                          {item.quantity > 1 && (
                            <Text fontSize="xs" color="gray.500">
                              ×{item.quantity}{' '}
                              <Text as="span" fontSize="2xs">
                                @ ${item.unitPrice.toFixed(2)}
                              </Text>
                            </Text>
                          )}
                        </HStack>
                        <Text
                          fontSize="xs"
                          fontWeight="medium"
                          color="gray.800"
                        >
                          ${item.total.toFixed(2)}
                        </Text>
                      </Flex>
                      {index < invoiceData.invoiceItems.length - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  ))}

                  {/* Discount */}
                  {invoiceData.discountAmount > 0 && (
                    <>
                      <Divider />
                      <Flex justify="space-between" align="center" py={1.5}>
                        <Text fontSize="xs" color="gray.700">
                          Discount
                        </Text>
                        <Text
                          fontSize="xs"
                          fontWeight="medium"
                          color="green.600"
                        >
                          -${invoiceData.discountAmount.toFixed(2)}
                        </Text>
                      </Flex>
                    </>
                  )}

                  {/* Subtotal */}
                  <Flex
                    justify="space-between"
                    align="center"
                    bg={noteBg}
                    px={2}
                    py={1.5}
                    borderRadius="md"
                    mt={1}
                  >
                    <Text fontSize="xs" color="gray.700">
                      Total Amount
                    </Text>
                    <Text fontSize="xs" fontWeight="medium" color="gray.800">
                      ${invoiceData.invoiceAmount.toFixed(2)}
                    </Text>
                  </Flex>

                  {/* Amount Paid */}
                  {invoiceData.payments && invoiceData.payments.length > 0 && (
                    <Flex
                      justify="space-between"
                      align="center"
                      bg="blue.50"
                      px={2}
                      py={1.5}
                      borderRadius="md"
                    >
                      <VStack align="start" spacing={0}>
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color="gray.800"
                        >
                          Amount Paid
                        </Text>
                        <Text fontSize="2xs" color="gray.600">
                          via {invoiceData.payments[0].paymentMethod}
                        </Text>
                      </VStack>
                      <Text fontSize="md" fontWeight="bold" color="blue.600">
                        ${invoiceData.payments[0].amount.toFixed(2)}
                      </Text>
                    </Flex>
                  )}

                  {/* Balance Amount */}
                  {invoiceData.balanceAmount &&
                    invoiceData.balanceAmount > 0 && (
                      <Flex
                        justify="space-between"
                        align="center"
                        bg="red.50"
                        px={2}
                        py={1.5}
                        borderRadius="md"
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color="gray.800"
                        >
                          Balance Due
                        </Text>
                        <Text fontSize="md" fontWeight="bold" color="red.600">
                          ${invoiceData.balanceAmount.toFixed(2)}
                        </Text>
                      </Flex>
                    )}
                </VStack>
              </Box>
            </VStack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default InvoiceDetailComponent;
