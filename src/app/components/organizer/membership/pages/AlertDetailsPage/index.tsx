import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { MdArrowBack, MdPersonAdd, MdRefresh, MdSearch } from 'react-icons/md';
import { useRef } from 'react';
import Pagination from 'app/components/organizer/donation/organizerDonationComponents/Pagination';
import { AlertRecipient } from '../../services/memberAlertService';
import { useAlertDetails } from './useAlertDetails';

const PRIORITY_COLOR: Record<string, string> = {
  Urgent: 'red.500',
  Important: 'orange.500',
  Normal: 'gray.600',
  Low: 'blue.500',
};

const PRIORITY_BG: Record<string, string> = {
  Urgent: 'red.50',
  Important: 'orange.50',
  Normal: 'gray.100',
  Low: 'blue.50',
};

const STATUS_COLOR: Record<string, string> = {
  Sent: 'green.600',
  Scheduled: 'orange.500',
  Draft: 'gray.500',
  Failed: 'red.500',
};

const STATUS_BG: Record<string, string> = {
  Sent: 'green.50',
  Scheduled: 'orange.50',
  Draft: 'gray.100',
  Failed: 'red.50',
};

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <Badge
      bg={bg}
      color={color}
      border="1px solid"
      borderColor={color}
      borderRadius="md"
      fontSize="xs"
      fontWeight="bold"
      px={2.5}
      py={1}
      textTransform="uppercase"
    >
      {label}
    </Badge>
  );
}

function ReadBadge({ read }: { read: boolean }) {
  return (
    <Badge
      bg={read ? 'green.50' : 'gray.100'}
      color={read ? 'green.600' : 'gray.500'}
      border="1px solid"
      borderColor={read ? 'green.500' : 'gray.300'}
      borderRadius="md"
      fontSize="10px"
      fontWeight="bold"
      px={2}
      py={0.5}
      textTransform="uppercase"
    >
      {read ? 'Read' : 'Unread'}
    </Badge>
  );
}

function DeliveryBadge({ recipient }: { recipient: AlertRecipient }) {
  const latest = recipient.deliveries[0];
  if (!latest) return <Text fontSize="xs" color="gray.400">—</Text>;

  const isFailed = latest.status.toLowerCase() === 'failed';
  const label = `${latest.channel.toUpperCase()}: ${latest.status.toUpperCase()}${recipient.deliveries.length > 1 ? ` +${recipient.deliveries.length}` : ''}`;

  return (
    <Badge
      bg={isFailed ? 'red.50' : 'green.50'}
      color={isFailed ? 'red.600' : 'green.600'}
      border="1px solid"
      borderColor={isFailed ? 'red.300' : 'green.300'}
      borderRadius="md"
      fontSize="10px"
      fontWeight="bold"
      px={2}
      py={0.5}
    >
      {label}
    </Badge>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="bold" color="gray.900">
        {value}
      </Text>
    </Box>
  );
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function AlertDetailsPage() {
  const {
    alert, isAlertLoading,
    recipients, totalRecords, pageNo, pageSize, isLoading,
    search, setSearch,
    handlePageChange, handleBack,
    isResendOpen, setIsResendOpen, isResending, handleResend,
  } = useAlertDetails();

  const resendCancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Box minH="100vh" bg="gray.50" pt={16} pb={8}>
      <Box mx={{ base: 2, md: 4 }} mt={4}>
        <Flex justify="space-between" align="center" mb={4} gap={2} flexWrap="wrap">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Icon as={MdArrowBack} />}
            borderRadius="lg"
            fontSize="xs"
            fontWeight="700"
            onClick={handleBack}
          >
            Back to alerts
          </Button>

          <Button
            size="sm"
            bg="#044bd9"
            color="white"
            borderRadius="lg"
            px={6}
            fontSize="xs"
            fontWeight="700"
            leftIcon={<Icon as={MdRefresh} />}
            onClick={() => setIsResendOpen(true)}
            _hover={{ bg: '#0340b8' }}
            _active={{ bg: '#02308a' }}
          >
            Resend Alert
          </Button>
        </Flex>

        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm" p={{ base: 4, md: 5 }} mb={4}>
          {isAlertLoading ? (
            <>
              <Skeleton h="24px" w="200px" borderRadius="md" mb={3} />
              <Flex gap={2} mb={4}>
                <Skeleton h="22px" w="70px" borderRadius="md" />
                <Skeleton h="22px" w="70px" borderRadius="md" />
                <Skeleton h="22px" w="70px" borderRadius="md" />
              </Flex>
              <Skeleton h="60px" borderRadius="lg" mb={5} />
              <Flex gap={8}>
                <Skeleton h="30px" w="60px" borderRadius="md" />
                <Skeleton h="30px" w="60px" borderRadius="md" />
                <Skeleton h="30px" w="60px" borderRadius="md" />
                <Skeleton h="30px" w="120px" borderRadius="md" />
              </Flex>
            </>
          ) : (
            <>
              <Text fontSize="lg" fontWeight="800" color="gray.900" mb={3}>
                {alert?.title ?? 'Alert'}
              </Text>

              <Flex gap={2} mb={4} flexWrap="wrap">
                <Pill label={alert?.priority ?? '—'} color={PRIORITY_COLOR[alert?.priority ?? ''] ?? 'gray.500'} bg={PRIORITY_BG[alert?.priority ?? ''] ?? 'gray.100'} />
                <Pill label={alert?.status ?? '—'} color={STATUS_COLOR[alert?.status ?? ''] ?? 'gray.500'} bg={STATUS_BG[alert?.status ?? ''] ?? 'gray.100'} />
                <Pill label={alert?.channels ?? '—'} color="#044bd9" bg="blue.50" />
              </Flex>

              <Box
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                p={3}
                mb={5}
                fontSize="sm"
                color="gray.700"
                overflow="hidden"
                sx={{
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  '& *': { maxWidth: '100%' },
                  '& p': { margin: '0 0 0.4em 0' },
                  '& p:last-child': { marginBottom: 0 },
                  '& ul, & ol': { paddingLeft: '1.5em', margin: '0 0 0.4em 0' },
                  '& a': { color: '#3182CE', textDecoration: 'underline' },
                }}
                dangerouslySetInnerHTML={{ __html: alert?.body ?? '<p>No message</p>' }}
              />

              <Flex gap={8} flexWrap="wrap">
                <Stat label="Recipients" value={alert?.recipientCount ?? totalRecords} />
                <Stat label="Read" value={alert?.readCount ?? 0} />
                <Stat label="Failed" value={alert?.failedCount ?? 0} />
                <Stat label="Sent" value={fmtDateTime(alert?.sentAtUtc ?? alert?.scheduledAtUtc)} />
              </Flex>
            </>
          )}
        </Box>

        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="hidden" boxShadow="sm">
          <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.100">
            <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
              <Box>
                <Text fontSize="sm" fontWeight="800" color="gray.800">
                  Recipients
                </Text>
                <Text fontSize="xs" fontWeight="500" color="gray.500">
                  Delivery details for target audience matching active filters.
                </Text>
              </Box>
              <InputGroup size="sm" w="220px">
                <InputLeftElement pointerEvents="none">
                  <Icon as={MdSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search recipients"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  bg="gray.50"
                  borderColor="gray.200"
                  borderRadius="lg"
                  fontSize="sm"
                  _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
                />
              </InputGroup>
            </Flex>
          </Box>

          <TableContainer>
            <Table variant="simple" size="md">
              <Thead bg="gray.200" borderBottom="2px solid" borderColor="gray.100">
                <Tr>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Recipient</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Email</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Read</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Delivery</Th>
                </Tr>
              </Thead>
              {isLoading ? (
                <Tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Tr key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <Td key={j}><Skeleton h="14px" borderRadius="md" /></Td>
                      ))}
                    </Tr>
                  ))}
                </Tbody>
              ) : recipients.length === 0 ? (
                <Tbody>
                  <Tr>
                    <Td colSpan={4} border="none">
                      <Flex direction="column" align="center" justify="center" py={10} gap={1}>
                        <Text fontSize="sm" fontWeight="600" color="gray.600">
                          No recipients found
                        </Text>
                      </Flex>
                    </Td>
                  </Tr>
                </Tbody>
              ) : (
                <Tbody>
                  {recipients.map((recipient) => (
                    <Tr key={recipient.uniqueId}>
                      <Td><Text fontSize="sm" fontWeight="bold" color="gray.900">{recipient.name}</Text></Td>
                      <Td><Text fontSize="sm" color="gray.600">{recipient.email}</Text></Td>
                      <Td><ReadBadge read={recipient.isRead} /></Td>
                      <Td><DeliveryBadge recipient={recipient} /></Td>
                    </Tr>
                  ))}
                </Tbody>
              )}
            </Table>
          </TableContainer>

          {totalRecords > 0 && (
            <Pagination
              currentPage={pageNo}
              totalRecords={totalRecords}
              entriesPerPage={pageSize}
              onPageChange={handlePageChange}
              displayedItemsCount={recipients.length}
            />
          )}
        </Box>
      </Box>

      <AlertDialog isOpen={isResendOpen} leastDestructiveRef={resendCancelRef} onClose={() => setIsResendOpen(false)} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl" mx={4}>
            <AlertDialogHeader display="flex" alignItems="center" gap={2} fontSize="lg" fontWeight="800" color="gray.900" pb={2}>
              <Icon as={MdPersonAdd} color="#044bd9" boxSize={5} />
              Resend alert?
            </AlertDialogHeader>
            <AlertDialogCloseButton />

            <AlertDialogBody fontSize="sm" color="gray.600">
              "{alert?.title ?? 'This alert'}" will be sent again to all {alert?.recipientCount ?? totalRecords} recipient(s).
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={resendCancelRef}
                size="md"
                variant="outline"
                borderRadius="lg"
                px={6}
                fontSize="sm"
                fontWeight="700"
                onClick={() => setIsResendOpen(false)}
                isDisabled={isResending}
              >
                Cancel
              </Button>
              <Button
                size="md"
                bg="#044bd9"
                color="white"
                borderRadius="lg"
                px={6}
                ml={3}
                fontSize="sm"
                fontWeight="700"
                onClick={handleResend}
                isLoading={isResending}
                loadingText="Resending"
                _hover={{ bg: '#0340b8' }}
                _active={{ bg: '#02308a' }}
              >
                Resend
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
