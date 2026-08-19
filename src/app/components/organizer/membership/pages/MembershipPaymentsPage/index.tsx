import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  Spinner,
  VStack,
  Table,
  TableContainer,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import {
  MdFilterListOff,
  MdFilterList,
  MdSearch,
  MdMoreVert,
  MdArrowUpward,
  MdArrowDownward,
  MdUnfoldMore,
  MdReceipt,
} from 'react-icons/md';
import { FaFileCsv, FaFileExcel } from 'react-icons/fa';
import MultiSelectDropdown from '../../common/MultiSelectDropdown';
import SendInvoiceEmailModal from '../../common/SendInvoiceEmailModal';
import { ZebraTbody } from 'app/components/common/ZebraTable';
import type { Column } from 'app/components/common/ZebraTable';
import Pagination from 'app/components/organizer/donation/organizerDonationComponents/Pagination';
import { ExportButton } from 'app/components/organizer/donation/organizerDonationComponents/ExportButtonProps';
import { ExportConfirmDialog } from 'app/components/organizer/donation/organizerDonationComponents/ExportConfirmDialog';
import Loader from 'app/components/common/Loader';
import {
  useMembershipPayments,
  PaymentItem,
  SortConfig,
  SortField,
} from './useMembershipPayments';
import MembershipHeroHeader from '../../common/MembershipHeroHeader';
import membershipPaymentService from '../../services/membershipPaymentService';
import PermissionGate from 'app/components/common/PermissionGate';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  Paid: 'green.600',
  PendingPayment: 'orange.500',
  PartiallyPaid: 'blue.500',
  Cancelled: 'red.500',
  Refund: 'purple.500',
  AdjustedInSystem: 'gray.500',
};

const STATUS_BG: Record<string, string> = {
  Paid: 'green.50',
  PendingPayment: 'orange.50',
  PartiallyPaid: 'blue.50',
  Cancelled: 'red.50',
  Refund: 'purple.50',
  AdjustedInSystem: 'gray.100',
};

const PAYMENT_METHOD_DISPLAY: Record<string, string> = {
  CreditCard: 'Debit/Credit Card',
  Ach: 'ACH-USD',
  Pad: 'PAD-CAD',
  Cheque: 'Check/Cheque',
};

function fmtDate(iso: string) {
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

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function SortIcon({ field, sort }: { field: SortField; sort: SortConfig }) {
  if (sort.field !== field)
    return <Icon as={MdUnfoldMore} boxSize={3.5} color="gray.400" ml={1} />;
  return (
    <Icon
      as={sort.dir === 'asc' ? MdArrowUpward : MdArrowDownward}
      boxSize={3.5}
      color="#044bd9"
      ml={1}
    />
  );
}

function StatusBadge({ v }: { v: string }) {
  const color = STATUS_COLOR[v] ?? 'gray.500';
  const bg = STATUS_BG[v] ?? 'gray.100';
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
    >
      {v.replace(/([A-Z])/g, ' $1').trim()}
    </Badge>
  );
}

function PaymentActionMenu({
  invoiceId,
  memberUniqueId,
  memberEmail,
  onSendEmail,
}: {
  invoiceId: string;
  memberUniqueId: string;
  memberEmail: string;
  onSendEmail: (invoiceId: string, recipientEmail: string) => void;
}) {
  const navigate = useNavigate();

  const openDetail = () =>
    navigate(`/organizer/membership/invoice-detail/${invoiceId}`);

  const openMemberProfile = () => {
    window.open(
      `/organizer/membership/member-profile?uniqueId=${encodeURIComponent(memberUniqueId)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <Menu>
      <MenuButton
        as={Box}
        cursor="pointer"
        display="inline-flex"
        alignItems="center"
        p={1.5}
        borderRadius="full"
        _hover={{ bg: 'blue.50' }}
      >
        <Icon as={MdMoreVert} boxSize={4} color="gray.500" />
      </MenuButton>
      <MenuList
        minW="170px"
        shadow="lg"
        borderRadius="xl"
        border="1px solid"
        borderColor="gray.100"
        py={1}
      >
        <MenuItem fontSize="sm" _hover={{ bg: 'blue.50' }} onClick={openDetail}>
          Detail
        </MenuItem>
        <MenuItem
          fontSize="sm"
          _hover={{ bg: 'blue.50' }}
          onClick={() => onSendEmail(invoiceId, memberEmail)}
        >
          Send via Email
        </MenuItem>
        {hasPermission('membership:member:view-file') && (
          <MenuItem
            fontSize="sm"
            _hover={{ bg: 'blue.50' }}
            onClick={openMemberProfile}
          >
            Member Profile
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MembershipPaymentsPage() {
  const {
    search,
    setSearch,
    selectedTypeIds,
    toggleTypeId,
    clearTypeIds,
    selectedStatuses,
    toggleStatus,
    clearStatuses,
    selectedMethods,
    toggleMethod,
    clearMethods,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    membershipTypeOptions,
    typesLoading,
    handleMembershipTypesOpen,
    statusOptions,
    paymentMethodOptions,
    filtered,
    totalCount,
    page,
    pageSize,
    sort,
    isLoading,
    hasActiveFilters,
    appliedSearch,
    appliedTypeIds,
    appliedStatuses,
    appliedMethods,
    appliedFromDate,
    appliedToDate,
    handleApplyFilter,
    handleClearFilters,
    handleSort,
    handlePageChange,
  } = useMembershipPayments();

  const canExport = hasPermission('membership:invoice:list-export');

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalData, setEmailModalData] = useState({
    invoiceId: '',
    recipientEmail: '',
  });

  const openSendEmail = (invoiceId: string, recipientEmail: string) => {
    setEmailModalData({ invoiceId, recipientEmail });
    setEmailModalOpen(true);
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [pendingExportFormat, setPendingExportFormat] = useState('');

  const handleExport = (exportFormat: string) => {
    setPendingExportFormat(exportFormat);
    setShowExportDialog(true);
  };

  const executeExport = async (exportAll: boolean) => {
    try {
      await membershipPaymentService.exportMembershipPayments(pendingExportFormat, {
        pageNo: exportAll ? 1 : page,
        pageSize: exportAll ? 5000 : pageSize,
        searchTerm: appliedSearch || undefined,
        status: appliedStatuses.length ? appliedStatuses : undefined,
        membershipTypeUniqueIds: appliedTypeIds.length ? appliedTypeIds : undefined,
        paymentMethods: appliedMethods.length ? appliedMethods : undefined,
        invoiceDateFrom: appliedFromDate || undefined,
        invoiceDateTo: appliedToDate || undefined,
      });
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setShowExportDialog(false);
    }
  };

  const columns: Column<PaymentItem>[] = [
    {
      key: 'actions',
      header: 'Actions',
      width: '60px',
      render: (_: any, row: PaymentItem) => (
        <PaymentActionMenu
          invoiceId={row.invoiceId}
          memberUniqueId={row.memberUniqueId}
          memberEmail={row.memberEmail}
          onSendEmail={openSendEmail}
        />
      ),
    },
    {
      key: 'invoiceNo',
      header: 'Invoice',
      render: (_: any, row: PaymentItem) => (
        <Box>
          <Text fontSize="sm" fontWeight="bold" color="gray.900" mb={1}>
            {row.invoiceNo}
          </Text>
          <Flex gap={1.5} flexWrap="wrap">
            <Badge
              bg="gray.100"
              color="#2463EB"
              border="1px solid"
              borderColor="blue.200"
              borderRadius="md"
              fontSize="10px"
              fontWeight="semibold"
              px={2}
              py={0.5}
            >
              {row.paymentMethod
                ? PAYMENT_METHOD_DISPLAY[row.paymentMethod] ?? row.paymentMethod
                : 'Free'}
            </Badge>
            {row.paymentSource && (
              <Badge
                bg="blue.50"
                color="#2463EB"
                border="1px solid"
                borderColor="blue.300"
                borderRadius="md"
                fontSize="10px"
                fontWeight="medium"
                px={2}
                py={0.5}
              >
                {row.paymentSource}
              </Badge>
            )}
          </Flex>
        </Box>
      ),
    },
    {
      key: 'memberName',
      header: 'Member',
      render: (_: any, row: PaymentItem) => (
        <Box>
          <Text fontSize="sm" fontWeight="semibold" color="gray.800" mb={1}>
            {row.memberName}
          </Text>
          <Flex gap={1.5} flexWrap="wrap">
            <Badge
              bg="teal.50"
              color="teal.700"
              border="1px solid"
              borderColor="teal.200"
              borderRadius="md"
              fontSize="10px"
              fontWeight="medium"
              px={2}
              py={0.5}
            >
              {row.membershipName}
            </Badge>
            <Badge
              bg="gray.100"
              color="gray.600"
              border="1px solid"
              borderColor="gray.300"
              borderRadius="md"
              fontSize="10px"
              fontWeight="medium"
              px={2}
              py={0.5}
              textTransform="none"
            >
              {row.memberEmail}
            </Badge>
          </Flex>
        </Box>
      ),
    },
    {
      key: 'invoiceStatus',
      header: 'Status',
      render: (v: string) => <StatusBadge v={v} />,
    },
    {
      key: 'invoiceDateUtc',
      header: 'Invoice Date/Time',
      render: (v: string) => (
        <Text fontSize="sm" color="gray.600">
          {fmtDate(v)}
        </Text>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (v: number, row: PaymentItem) => (
        <Text
          fontSize="sm"
          fontWeight="bold"
          color="gray.900"
          textAlign="right"
        >
          {row.paymentMethod ? `${row.currencySymbol}${v.toFixed(2)}` : 'Free'}
        </Text>
      ),
    },
  ];

  return (
    <PermissionGate permission="membership:invoice:view" showAccessDenied>
    <Box minH="100vh" bg="gray.50" pt={16} pb={8}>
      <MembershipHeroHeader
        eyebrow="Membership Invoicing"
        title="Payment control center"
        description="A live, searchable workspace for membership invoices, balances, and billing operations."
      />

      <Box mx={{ base: 2, md: 4 }} mt={4}>
        {/* Filters card */}
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

            {/* Export Buttons */}
            {canExport && (
              <Flex gap={1} align="center" bg="gray.500" borderRadius="md" h="36px" flexShrink={0}>
                <ExportButton
                  icon={FaFileCsv}
                  label="Export CSV"
                  onClick={() => handleExport('Csv')}
                />
                <ExportButton
                  icon={FaFileExcel}
                  label="Export Excel"
                  onClick={() => handleExport('Excel')}
                />
              </Flex>
            )}
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={3} mb={4}>
            <Box minW={0}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.600"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1.5}
              >
                Search
              </Text>
              <InputGroup size="md">
                <InputLeftElement>
                  <Icon as={MdSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Invoice, member.."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                  bg="gray.50"
                  borderColor="gray.200"
                  borderRadius="lg"
                  _focus={{
                    borderColor: '#044bd9',
                    boxShadow: '0 0 0 1px #044bd9',
                    bg: 'white',
                  }}
                />
              </InputGroup>
            </Box>

            <Box minW={0}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.600"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1.5}
              >
                Membership Types{' '}
                {typesLoading && <Spinner size="xs" ml={2} color="#044bd9" />}
              </Text>
              <MultiSelectDropdown
                options={membershipTypeOptions}
                selected={selectedTypeIds}
                onToggle={toggleTypeId}
                onClear={clearTypeIds}
                placeholder="All membership types"
                onOpen={handleMembershipTypesOpen}
              />
            </Box>

            <Box minW={0}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.600"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1.5}
              >
                Invoice Status
              </Text>
              <MultiSelectDropdown
                options={statusOptions}
                selected={selectedStatuses}
                onToggle={toggleStatus}
                onClear={clearStatuses}
                placeholder="All statuses"
              />
            </Box>

            <Box minW={0}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.600"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1.5}
              >
                Payment Methods
              </Text>
              <MultiSelectDropdown
                options={paymentMethodOptions}
                selected={selectedMethods}
                onToggle={toggleMethod}
                onClear={clearMethods}
                placeholder="All payment methods"
              />
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={3} alignItems="end">
            <Box minW={0}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.600"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1.5}
              >
                From Date
              </Text>
              <Input
                type="date"
                size="md"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                bg="gray.50"
                borderColor="gray.200"
                borderRadius="lg"
                _focus={{
                  borderColor: '#044bd9',
                  boxShadow: '0 0 0 1px #044bd9',
                }}
              />
            </Box>
            <Box minW={0}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.600"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1.5}
              >
                To Date
              </Text>
              <Input
                type="date"
                size="md"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                bg="gray.50"
                borderColor="gray.200"
                borderRadius="lg"
                _focus={{
                  borderColor: '#044bd9',
                  boxShadow: '0 0 0 1px #044bd9',
                }}
              />
            </Box>
            <Box display={{ base: 'none', xl: 'block' }} />
            <Flex gap={3} align="flex-end" justify={{ base: 'stretch', xl: 'flex-end' }} flexWrap="wrap">
              <Button
                size="sm"
                variant="outline"
                borderRadius="lg"
                px={5}
                borderColor={hasActiveFilters ? 'red.300' : 'gray.300'}
                color={hasActiveFilters ? 'red.500' : 'gray.500'}
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
                onClick={handleApplyFilter}
                _hover={{ bg: '#0340b8' }}
                _active={{ bg: '#02308a' }}
              >
                Apply filter
              </Button>
            </Flex>
          </SimpleGrid>
        </Box>

        {/* Table / Cards */}
        {isLoading ? (
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            p={8}
            boxShadow="sm"
          >
            <Loader
              message="Loading Payments"
              subtitle="Fetching membership invoice data..."
            />
          </Box>
        ) : filtered.length === 0 ? (
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            boxShadow="sm"
          >
            <Flex direction="column" align="center" py={12} gap={2}>
              <Icon as={MdReceipt} boxSize={8} color="gray.300" />
              <Text fontSize="sm" color="gray.400">
                No payments found
              </Text>
            </Flex>
          </Box>
        ) : (
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            overflow="hidden"
            boxShadow="sm"
          >
            {/* Desktop table */}
            <Box display={{ base: 'none', lg: 'block' }}>
              <TableContainer>
                <Table variant="simple" size="md">
                  <Thead
                    bg="gray.200"
                    borderBottom="2px solid"
                    borderColor="gray.100"
                  >
                    <Tr>
                      <Th
                        color="gray.800"
                        fontWeight="bold"
                        fontSize="sm"
                        textTransform="uppercase"
                        w="60px"
                      >
                        Actions
                      </Th>
                      {(
                        [
                          'invoiceNo',
                          'memberName',
                          'invoiceStatus',
                          'invoiceDateUtc',
                          'totalAmount',
                        ] as SortField[]
                      ).map((field, i) => {
                        const labels = [
                          'Invoice',
                          'Member',
                          'Status',
                          'Invoice Date/Time',
                          'Total',
                        ];
                        return (
                          <Th
                            key={field}
                            color="gray.800"
                            fontWeight="bold"
                            fontSize="sm"
                            textTransform="uppercase"
                            cursor="pointer"
                            userSelect="none"
                            onClick={() => handleSort(field)}
                            isNumeric={field === 'totalAmount'}
                          >
                            <Flex
                              align="center"
                              justify={
                                field === 'totalAmount'
                                  ? 'flex-end'
                                  : 'flex-start'
                              }
                            >
                              {labels[i]} <SortIcon field={field} sort={sort} />
                            </Flex>
                          </Th>
                        );
                      })}
                    </Tr>
                  </Thead>
                  <ZebraTbody data={filtered} columns={columns} />
                </Table>
              </TableContainer>
            </Box>

            {/* Mobile card list */}
            <Box display={{ base: 'block', lg: 'none' }}>
              <VStack
                spacing={0}
                divider={<Box h="1px" bg="gray.100" w="full" />}
              >
                {filtered.map((p) => (
                  <Box key={p.invoiceId} px={4} py={4} w="full">
                    <Flex justify="space-between" align="flex-start">
                      <Box flex="1" minW={0} mr={2}>
                        {/* Invoice + method */}
                        <Flex align="center" gap={2} mb={1} flexWrap="wrap">
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color="gray.900"
                          >
                            {p.invoiceNo}
                          </Text>
                          <Badge
                            bg="gray.100"
                            color="#2463EB"
                            border="1px solid"
                            borderColor="blue.200"
                            borderRadius="md"
                            fontSize="10px"
                            fontWeight="semibold"
                            px={2}
                            py={0.5}
                          >
                            {p.paymentMethod
                              ? PAYMENT_METHOD_DISPLAY[p.paymentMethod] ?? p.paymentMethod
                              : 'Free'}
                          </Badge>
                          {p.paymentSource && (
                            <Badge
                              bg="blue.50"
                              color="#2463EB"
                              border="1px solid"
                              borderColor="blue.300"
                              borderRadius="md"
                              fontSize="10px"
                              fontWeight="medium"
                              px={2}
                              py={0.5}
                            >
                              {p.paymentSource}
                            </Badge>
                          )}
                        </Flex>
                        {/* Member */}
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="gray.700"
                          mb={1}
                          noOfLines={1}
                        >
                          {p.memberName}
                        </Text>
                        <Flex gap={1.5} flexWrap="wrap" mb={2}>
                          <Badge
                            bg="teal.50"
                            color="teal.700"
                            border="1px solid"
                            borderColor="teal.200"
                            borderRadius="md"
                            fontSize="10px"
                            fontWeight="medium"
                            px={2}
                            py={0.5}
                          >
                            {p.membershipName}
                          </Badge>
                          <Badge
                            bg="gray.100"
                            color="gray.600"
                            border="1px solid"
                            borderColor="gray.300"
                            borderRadius="md"
                            fontSize="10px"
                            fontWeight="medium"
                            px={2}
                            py={0.5}
                            textTransform="none"
                          >
                            {p.memberEmail}
                          </Badge>
                        </Flex>
                        {/* Meta row */}
                        <Flex gap={3} align="center" flexWrap="wrap">
                          <StatusBadge v={p.invoiceStatus} />
                          <Text fontSize="xs" color="gray.500">
                            {fmtDateShort(p.invoiceDateUtc)}
                          </Text>
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color="gray.900"
                            ml="auto"
                          >
                            {p.paymentMethod
                              ? `${p.currencySymbol}${p.totalAmount.toFixed(2)}`
                              : 'Free'}
                          </Text>
                        </Flex>
                      </Box>
                      <PaymentActionMenu
                        invoiceId={p.invoiceId}
                        memberUniqueId={p.memberUniqueId}
                        memberEmail={p.memberEmail}
                        onSendEmail={openSendEmail}
                      />
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </Box>

            {totalCount > 0 && (
              <Pagination
                currentPage={page}
                totalRecords={totalCount}
                entriesPerPage={10}
                displayedItemsCount={filtered.length}
                onPageChange={handlePageChange}
              />
            )}
          </Box>
        )}
      </Box>

      <SendInvoiceEmailModal
        isOpen={emailModalOpen}
        invoiceId={emailModalData.invoiceId}
        recipientEmail={emailModalData.recipientEmail}
        onClose={() => setEmailModalOpen(false)}
      />

      {/* Export Confirmation Dialog */}
      <ExportConfirmDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onConfirm={executeExport}
        titlePlaceholder="membership payments"
      />
    </Box>
    </PermissionGate>
  );
}
