import { useRef, useState } from 'react';
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
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  MdAdd,
  MdArrowDownward,
  MdArrowUpward,
  MdDeleteOutline,
  MdFilterList,
  MdFilterListOff,
  MdMoreVert,
  MdPersonAdd,
  MdRefresh,
  MdSearch,
  MdUnfoldMore,
  MdVisibility,
  MdWarningAmber,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Pagination from 'app/components/organizer/donation/organizerDonationComponents/Pagination';
import MembershipHeroHeader from '../../common/MembershipHeroHeader';
import memberAlertService, { MemberAlertItem } from '../../services/memberAlertService';
import { SortConfig, SortField, useMemberAlerts } from './useMemberAlerts';

const STATUS_OPTIONS = ['Scheduled', 'Sent', 'Partially failed', 'Failed'];

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
  'Partially failed': 'yellow.600',
  Failed: 'red.500',
};

const STATUS_BG: Record<string, string> = {
  Sent: 'green.50',
  Scheduled: 'orange.50',
  'Partially failed': 'yellow.50',
  Failed: 'red.50',
};

function PriorityBadge({ v }: { v: string }) {
  return (
    <Badge
      bg={PRIORITY_BG[v] ?? 'gray.100'}
      color={PRIORITY_COLOR[v] ?? 'gray.500'}
      border="1px solid"
      borderColor={PRIORITY_COLOR[v] ?? 'gray.300'}
      borderRadius="md"
      fontSize="xs"
      fontWeight="bold"
      px={2.5}
      py={1}
      textTransform="uppercase"
    >
      {v}
    </Badge>
  );
}

function StatusBadge({ v }: { v: string }) {
  return (
    <Badge
      bg={STATUS_BG[v] ?? 'gray.100'}
      color={STATUS_COLOR[v] ?? 'gray.500'}
      border="1px solid"
      borderColor={STATUS_COLOR[v] ?? 'gray.300'}
      borderRadius="md"
      fontSize="xs"
      fontWeight="bold"
      px={2.5}
      py={1}
      textTransform="uppercase"
    >
      {v}
    </Badge>
  );
}

function AlertActionMenu({ row, onChanged }: { row: MemberAlertItem; onChanged: () => void }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResendOpen, setIsResendOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const resendCancelRef = useRef<HTMLButtonElement>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await memberAlertService.deleteAlert(row.uniqueId);
      toast({
        title: res.data?.message ?? 'Alert deleted.',
        status: 'success',
        position: 'top-right',
      });
      setIsDeleteOpen(false);
      onChanged();
    } catch (err: any) {
      toast({
        title: 'Failed to delete alert',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await memberAlertService.resend(row.uniqueId);
      toast({
        title: res.data?.message ?? 'Alert resent.',
        status: 'success',
        position: 'top-right',
      });
      setIsResendOpen(false);
      onChanged();
    } catch (err: any) {
      toast({
        title: 'Failed to resend alert',
        description: err?.response?.data?.message ?? err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label="Alert actions"
          icon={<Icon as={MdMoreVert} boxSize={4} color="gray.500" />}
          size="sm"
          variant="ghost"
          borderRadius="full"
        />
        <MenuList minW="170px" shadow="lg" borderRadius="xl" border="1px solid" borderColor="gray.100" py={1}>
          <MenuItem
            icon={<Icon as={MdVisibility} boxSize={4} />}
            fontSize="sm"
            _hover={{ bg: 'blue.50' }}
            onClick={() => navigate(`/organizer/membership/member-alerts/${row.uniqueId}`)}
          >
            View details
          </MenuItem>
          <MenuItem
            icon={<Icon as={MdRefresh} boxSize={4} />}
            fontSize="sm"
            _hover={{ bg: 'blue.50' }}
            onClick={() => setIsResendOpen(true)}
          >
            Resend
          </MenuItem>
          <MenuItem
            icon={<Icon as={MdDeleteOutline} boxSize={4} color="red.500" />}
            fontSize="sm"
            color="red.500"
            _hover={{ bg: 'red.50' }}
            onClick={() => setIsDeleteOpen(true)}
          >
            Delete
          </MenuItem>
        </MenuList>
      </Menu>

      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={deleteCancelRef} onClose={() => setIsDeleteOpen(false)} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl" mx={4}>
            <AlertDialogHeader display="flex" alignItems="center" gap={2} fontSize="lg" fontWeight="800" color="gray.900" pb={2}>
              <Flex align="center" justify="center" boxSize="32px" borderRadius="full" bg="red.50" flexShrink={0}>
                <Icon as={MdWarningAmber} color="red.500" boxSize={4} />
              </Flex>
              Delete alert?
            </AlertDialogHeader>
            <AlertDialogCloseButton />

            <AlertDialogBody fontSize="sm" color="gray.600">
              "{row.title}" will be permanently deleted.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={deleteCancelRef}
                size="md"
                variant="outline"
                borderRadius="lg"
                px={6}
                fontSize="sm"
                fontWeight="700"
                onClick={() => setIsDeleteOpen(false)}
                isDisabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                size="md"
                bg="red.500"
                color="white"
                borderRadius="lg"
                px={6}
                ml={3}
                fontSize="sm"
                fontWeight="700"
                onClick={handleDelete}
                isLoading={isDeleting}
                loadingText="Deleting"
                _hover={{ bg: 'red.600' }}
                _active={{ bg: 'red.700' }}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <AlertDialog isOpen={isResendOpen} leastDestructiveRef={resendCancelRef} onClose={() => setIsResendOpen(false)} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl" mx={4}>
            <AlertDialogHeader display="flex" alignItems="center" gap={2} fontSize="lg" fontWeight="800" color="gray.900" pb={2}>
              <Icon as={MdPersonAdd} color="#044bd9" boxSize={5} />
              Resend alert?
            </AlertDialogHeader>
            <AlertDialogCloseButton />

            <AlertDialogBody fontSize="sm" color="gray.600">
              "{row.title}" will be sent again to all {row.recipientCount} recipient(s).
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
    </>
  );
}

function SortIcon({ field, sort }: { field: SortField; sort: SortConfig }) {
  if (sort.field !== field) {
    return <Icon as={MdUnfoldMore} boxSize={3.5} color="gray.400" ml={1} />;
  }

  return (
    <Icon
      as={sort.dir === 'asc' ? MdArrowUpward : MdArrowDownward}
      boxSize={3.5}
      color="#044bd9"
      ml={1}
    />
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const COLUMNS: { field: SortField; label: string; isNumeric?: boolean }[] = [
  { field: 'title', label: 'Title' },
  { field: 'priority', label: 'Priority' },
  { field: 'channels', label: 'Channels' },
  { field: 'status', label: 'Status' },
  { field: 'recipientCount', label: 'Recipients', isNumeric: true },
  { field: 'readCount', label: 'Read', isNumeric: true },
  { field: 'sentAtUtc', label: 'Sent' },
];

export default function MemberAlertsPage() {
  const navigate = useNavigate();
  const {
    filtered,
    isLoading,
    pageNo,
    pageSize,
    totalRecords,
    sort,
    title,
    setTitle,
    status,
    setStatus,
    hasActiveFilters,
    handleApplyFilter,
    handleClearFilters,
    refreshAlerts,
    handlePageChange,
    handleSort,
  } = useMemberAlerts();

  return (
    <Box minH="100vh" bg="gray.50" pt={16} pb={8}>
      <MembershipHeroHeader
        eyebrow="Membership Alerts"
        title="Notify Members"
        description="Send instant or email alerts to your members. Target them by membership type, status, or a saved custom list."
        action={
          <Button
            size="md"
            bg="white"
            color="#044bd9"
            borderRadius="lg"
            px={6}
            fontSize="sm"
            fontWeight="700"
            leftIcon={<Icon as={MdAdd} />}
            _hover={{ bg: 'whiteAlpha.900' }}
            _active={{ bg: 'gray.100' }}
            onClick={() => navigate('/organizer/membership/member-alerts/new')}
          >
            New Alerts
          </Button>
        }
      />

      <Box mx={{ base: 2, md: 4 }} mt={4}>
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="xl"
          p={5}
          mb={4}
          boxShadow="sm"
        >
          <Flex
            align="center"
            justify="space-between"
            gap={2}
            mb={4}
            pb={3}
            borderBottom="1px solid"
            borderColor="gray.100"
          >
            <Flex align="center" gap={2}>
              <Flex
                w="28px"
                h="28px"
                borderRadius="md"
                bg="blue.50"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={MdFilterList} boxSize={4} color="blue.500" />
              </Flex>
              <Text fontSize="md" fontWeight="700" color="gray.800">
                Filters
              </Text>
            </Flex>
          </Flex>

          <Flex gap={3} flexWrap="wrap" mb={4}>
            <Box flex="1" minW="220px">
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.600"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1.5}
              >
                Title
              </Text>
              <InputGroup size="md">
                <InputLeftElement pointerEvents="none">
                  <Icon as={MdSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  bg="gray.50"
                  borderColor="gray.200"
                  borderRadius="lg"
                  fontSize="sm"
                  _focus={{
                    borderColor: '#044bd9',
                    boxShadow: '0 0 0 1px #044bd9',
                    bg: 'white',
                  }}
                />
              </InputGroup>
            </Box>

            <Box flex="1" minW="220px">
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.600"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1.5}
              >
                Status
              </Text>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                bg="gray.50"
                borderColor="gray.200"
                borderRadius="lg"
                fontSize="sm"
                _focus={{
                  borderColor: '#044bd9',
                  boxShadow: '0 0 0 1px #044bd9',
                  bg: 'white',
                }}
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Box>
          </Flex>

          <Flex gap={3} justify="flex-end">
            <Button
              size="sm"
              variant="outline"
              borderRadius="lg"
              px={5}
              borderColor={hasActiveFilters ? 'red.300' : 'gray.300'}
              color={hasActiveFilters ? 'red.500' : 'gray.500'}
              fontSize="xs"
              fontWeight="700"
              leftIcon={<Icon as={MdFilterListOff} />}
              onClick={handleClearFilters}
              _hover={{ bg: hasActiveFilters ? 'red.50' : 'gray.50' }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              bg="#044bd9"
              color="white"
              borderRadius="lg"
              px={6}
              fontSize="xs"
              fontWeight="700"
              onClick={handleApplyFilter}
              _hover={{ bg: '#0340b8' }}
              _active={{ bg: '#02308a' }}
            >
              Apply filter
            </Button>
          </Flex>
        </Box>

        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="sm"
        >
          <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.100">
            <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
              <Box>
                <Text fontSize="sm" fontWeight="800" color="gray.800">
                  Member Alerts
                </Text>
                <Text fontSize="xs" fontWeight="500" color="gray.500">
                  Alerts sent or scheduled to your members.
                </Text>
              </Box>
              <Badge
                bg="blue.50"
                color="blue.700"
                border="1px solid"
                borderColor="blue.200"
                borderRadius="md"
                px={2.5}
                py={1}
                fontSize="11px"
                fontWeight="semibold"
              >
                {totalRecords} total
              </Badge>
            </Flex>
          </Box>

          {isLoading ? (
            <Box px={4} py={4}>
              <TableContainer>
                <Table variant="simple" size="md">
                  <Thead bg="gray.200" borderBottom="2px solid" borderColor="gray.100">
                    <Tr>
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase" w="60px">
                        Actions
                      </Th>
                      {COLUMNS.map((column) => (
                        <Th
                          key={column.field}
                          color="gray.800"
                          fontWeight="bold"
                          fontSize="sm"
                          textTransform="uppercase"
                        >
                          {column.label}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Tr
                        key={i}
                        bg={(i + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}
                      >
                        <Td>
                          <Skeleton h="16px" w="16px" borderRadius="md" />
                        </Td>
                        {COLUMNS.map((column) => (
                          <Td key={column.field}>
                            <Skeleton h="16px" borderRadius="md" />
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          ) : filtered.length === 0 ? (
            <Flex direction="column" align="center" py={14} gap={2}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                No member alerts found
              </Text>
              <Text fontSize="xs" color="gray.400">
                Alerts you send to your members will appear here.
              </Text>
            </Flex>
          ) : (
            <>
              <Box display={{ base: 'none', lg: 'block' }}>
                <TableContainer>
                  <Table variant="simple" size="md">
                    <Thead bg="gray.200" borderBottom="2px solid" borderColor="gray.100">
                      <Tr>
                        <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase" w="60px">
                          Actions
                        </Th>
                        {COLUMNS.map((column) => (
                          <Th
                            key={column.field}
                            color="gray.800"
                            fontWeight="bold"
                            fontSize="sm"
                            textTransform="uppercase"
                            cursor="pointer"
                            userSelect="none"
                            onClick={() => handleSort(column.field)}
                            isNumeric={column.isNumeric}
                          >
                            <Flex
                              align="center"
                              justify={column.isNumeric ? 'flex-end' : 'flex-start'}
                            >
                              {column.label}
                              <SortIcon field={column.field} sort={sort} />
                            </Flex>
                          </Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filtered.map((row: MemberAlertItem, i) => (
                        <Tr
                          key={row.uniqueId}
                          bg={(i + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}
                        >
                          <Td>
                            <AlertActionMenu row={row} onChanged={refreshAlerts} />
                          </Td>
                          <Td>
                            <Text fontSize="sm" fontWeight="bold" color="gray.900">
                              {row.title}
                            </Text>
                          </Td>
                          <Td>
                            <PriorityBadge v={row.priority} />
                          </Td>
                          <Td>
                            <Text fontSize="sm" color="gray.600">
                              {row.channels}
                            </Text>
                          </Td>
                          <Td>
                            <StatusBadge v={row.status} />
                          </Td>
                          <Td isNumeric>
                            <Text fontSize="sm" fontWeight="bold" color="gray.900">
                              {row.recipientCount}
                            </Text>
                          </Td>
                          <Td isNumeric>
                            <Text fontSize="sm" fontWeight="bold" color="gray.900">
                              {row.readCount}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color="gray.600">
                              {fmtDate(row.sentAtUtc ?? row.scheduledAtUtc)}
                            </Text>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>

              <Box display={{ base: 'block', lg: 'none' }}>
                <VStack spacing={0} divider={<Box h="1px" bg="gray.100" w="full" />}>
                  {filtered.map((row) => (
                    <Box key={row.uniqueId} px={4} py={4} w="full">
                      <Flex justify="space-between" align="flex-start" mb={2}>
                        <Text
                          fontSize="sm"
                          fontWeight="bold"
                          color="gray.900"
                          noOfLines={1}
                        >
                          {row.title}
                        </Text>
                        <StatusBadge v={row.status} />
                      </Flex>
                      <Flex gap={2} mb={2}>
                        <PriorityBadge v={row.priority} />
                        <Badge
                          bg="gray.100"
                          color="gray.600"
                          border="1px solid"
                          borderColor="gray.300"
                          borderRadius="md"
                          px={2}
                          py={0.5}
                          fontSize="10px"
                          fontWeight="medium"
                        >
                          {row.channels}
                        </Badge>
                      </Flex>
                      <Flex gap={3} flexWrap="wrap">
                        <Box>
                          <Text
                            fontSize="10px"
                            color="gray.400"
                            textTransform="uppercase"
                            fontWeight="bold"
                            mb={0.5}
                          >
                            Recipients
                          </Text>
                          <Text fontSize="sm" color="gray.900" fontWeight="bold">
                            {row.recipientCount}
                          </Text>
                        </Box>
                        <Box>
                          <Text
                            fontSize="10px"
                            color="gray.400"
                            textTransform="uppercase"
                            fontWeight="bold"
                            mb={0.5}
                          >
                            Read
                          </Text>
                          <Text fontSize="sm" color="gray.900" fontWeight="bold">
                            {row.readCount}
                          </Text>
                        </Box>
                        <Box>
                          <Text
                            fontSize="10px"
                            color="gray.400"
                            textTransform="uppercase"
                            fontWeight="bold"
                            mb={0.5}
                          >
                            Sent
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {fmtDate(row.sentAtUtc ?? row.scheduledAtUtc)}
                          </Text>
                        </Box>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </Box>
            </>
          )}

          {!isLoading && totalRecords > 0 && (
            <Pagination
              currentPage={pageNo}
              totalRecords={totalRecords}
              entriesPerPage={pageSize}
              onPageChange={handlePageChange}
              displayedItemsCount={filtered.length}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
