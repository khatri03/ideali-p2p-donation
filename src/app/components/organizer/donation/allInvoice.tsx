//ALLinvoice
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Text,
  Card,
  CardBody,
  Select,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge as ChakraBadge,
  Flex,
  useToast,
  Tag,
  TagCloseButton,
  TagLabel,
} from '@chakra-ui/react';
import HttpClient from '../../../service/httpClient/HttpClient';
import {
  DynamicTable,
  Column,
} from './organizerDonationComponents/DynamicTable';
import Pagination from './organizerDonationComponents/Pagination';
import Loader from '../../common/Loader';
import {
  formatDate,
  formatAmount,
} from './organizerDonationComponents/helperFuntions';
import { Invoice } from '../../../interface/donationInter/invoiceListDto';
import { fetchPaidInvoices } from '../../../service/organizer/donation/InvoiceService';
import { useNavigate } from 'react-router-dom';
import { ExportButton } from './organizerDonationComponents/ExportButtonProps';
import { FaFileCsv, FaFileExcel } from 'react-icons/fa';
import { useExportHandler } from './organizerDonationComponents/useExportHandler';
import { ExportConfirmDialog } from './organizerDonationComponents/ExportConfirmDialog';
import donationService from 'app/service/organizer/donation/donationService';
import sendInvoiceService from '../../../service/organizer/donation/sendInvoiceService';
import ActionMenu from '../donation/ActionMenu';
import { MdEmail, MdVisibility } from 'react-icons/md';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';
import { Checkbox, Button } from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import QuickbooksService from '../../../service/organizer/Settings/quickBooks/quickBookService';
import { FilterMenu } from './filterMenu';
import {
  getStatusOptions,
  getStatusLabel,
  getStatusColorScheme,
} from './invoiceStatusUtils';

export default function DonationInvoiceList() {
  // ── STATE MANAGEMENT ───────────────────────────────────────────────────
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<
    Array<{ text: string; value: string }>
  >([]);
  const [entriesPerPage, setEntriesPerPage] = useState<number>(50);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [archived, setArchived] = useState<boolean>(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isQbConnected, setIsQbConnected] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [qbStatusFilter, setQbStatusFilter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('');

  // ── HOOKS ──────────────────────────────────────────────────────────────
  const navigate = useNavigate();
  const toast = useToast();

  // ── PERMISSIONS ────────────────────────────────────────────────────────
  const canViewDetail = hasPermission('Donation.Invoice.ViewDetail');
  const canSend = hasPermission('Donation.Invoice.Send');
  const canExport = hasPermission('Donation.Invoice.Export');
  const canSyncQb = hasPermission('integration:quick-book-:sync');

  // ── EXPORT HANDLER ─────────────────────────────────────────────────────
  const { showExportDialog, handleExport, executeExport, closeExportDialog } =
    useExportHandler({
      currentPage,
      entriesPerPage,
      searchQuery,
      archived,
      exportServiceFn: donationService.exportDonationInvoiceList,
    });

  // ── INITIALIZATION EFFECTS ─────────────────────────────────────────────
  useEffect(() => {
    const checkQbStatus = async () => {
      try {
        const isConnected = await QuickbooksService.getQbStatus();
        console.log('QuickBooks connection status:', isConnected);
        setIsQbConnected(isConnected);
      } catch {
        setIsQbConnected(false);
      }
    };
    checkQbStatus();
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // ── EVENT HANDLERS ─────────────────────────────────────────────────────

  /**
   * Navigate to invoice detail page
   */
  const handleInvoiceClick = (InvoiceId: string) => {
    navigate(`/organizer/donation/invoice-detail/${InvoiceId}`);
  };

  /**
   * Send invoice via email
   */
  const handleSendInvoice = async (invoice: Invoice) => {
    const invoiceUniqueId =
      invoice.InvoiceId ||
      (invoice as any).invoiceUniqueId ||
      (invoice as any).id ||
      invoice.invoiceNo;

    console.log('Using invoiceUniqueId:', invoiceUniqueId);

    try {
      const loadingToast = toast({
        title: 'Sending Payment...',
        description: `Please wait while we send Receipt ${invoice.invoiceNo} to ${invoice.email}`,
        status: 'loading',
        duration: null,
        isClosable: false,
        position: 'top-right',
      });

      await sendInvoiceService.sendInvoice(invoiceUniqueId);
      toast.close(loadingToast);

      toast({
        title: '✓ Receipt Sent Successfully!',
        description: `Receipt ${invoice.invoiceNo} has been sent to ${invoice.email}`,
        status: 'success',
        duration: 6000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (err: any) {
      toast({
        title: '✗ Failed to Send Receipt',
        description:
          err.message ||
          `Unable to send Receipt ${invoice.invoiceNo}. Please try again.`,
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'top-right',
      });

      console.error('Error sending invoice:', err);
    }
  };

  /**
   * View invoice detail
   */
  const handleViewInvoice = (invoice: Invoice) => {
    handleInvoiceClick(invoice.InvoiceId);
  };

  /**
   * Handle selecting all invoices on current page
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds((prev) =>
        Array.from(new Set([...prev, ...invoices.map((inv) => inv.InvoiceId)])),
      );
    } else {
      const pageIds = new Set(invoices.map((inv) => inv.InvoiceId));
      setSelectedInvoiceIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  /**
   * Handle selecting individual invoice
   */
  const handleSelectRow = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds((prev) => [...prev, invoiceId]);
    } else {
      setSelectedInvoiceIds((prev) => prev.filter((id) => id !== invoiceId));
    }
  };

  /**
   * Sync selected invoices to QuickBooks
   */
  const handleSyncToQuickbooks = async () => {
    setIsSyncing(true);
    try {
      await QuickbooksService.syncInvoices(selectedInvoiceIds);
      toast({
        title: '✓ Synced to QuickBooks!',
        description: `${selectedInvoiceIds.length} invoice(s) synced successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      setSelectedInvoiceIds([]);
      await fetchInvoicesData(currentPage);
    } catch {
      toast({
        title: 'Sync Failed',
        description: 'Unable to sync invoices to QuickBooks. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Handle campaign selection change
   */
  const handleCampaignChange = (value: string) => {
    setSelectedCampaign(value);
    setCurrentPage(1);
  };

  /**
   * Handle status filter change
   */
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  /**
   * Handle member filter change
   */
  const handleMemberFilterChange = (value: string) => {
    setSelectedMemberFilter(value);
    setCurrentPage(1);
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // ── SELECTION STATE HELPERS ────────────────────────────────────────────
  const allSelected =
    invoices.length > 0 &&
    invoices.every((inv) => selectedInvoiceIds.includes(inv.InvoiceId));

  const isIndeterminate =
    !allSelected &&
    invoices.some((inv) => selectedInvoiceIds.includes(inv.InvoiceId));

  // ── DATA FETCHING ──────────────────────────────────────────────────────

  /**
   * Fetch invoices with current filters
   */
  const fetchInvoicesData = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchPaidInvoices({
          campaignId: selectedCampaign,
          status: selectedStatus,
          memberFilter: selectedMemberFilter,
          pageNo: page,
          pageSize: pageSize,
        });

        setInvoices(result.invoices);
        setTotalRecords(result.totalRecords);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError(
          typeof err === 'object' && err !== null && 'message' in err
            ? (err as { message: string }).message
            : 'An error occurred',
        );
        setInvoices([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    },
    [selectedCampaign, selectedStatus, selectedMemberFilter, pageSize],
  );

  useEffect(() => {
    fetchInvoicesData(currentPage);
  }, [currentPage, fetchInvoicesData]);

  /**
   * Fetch available campaigns for dropdown
   */
  const fetchCampaigns = async () => {
    try {
      const response = await HttpClient.get(
        '/api/donation/campaign/dropdown-items',
      );
      const campaignData =
        response.data?.data || response.data || response || [];

      if (Array.isArray(campaignData)) {
        setCampaigns(campaignData);
      } else {
        console.error('Campaign data is not an array:', campaignData);
        setCampaigns([]);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setCampaigns([]);
    }
  };

  // ── FILTERING ──────────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    if (!qbStatusFilter) return invoices;

    return invoices.filter((inv: any) => {
      const isSynced = !!inv.quickBooksInvoiceId;

      if (qbStatusFilter === 'synced') return isSynced;
      if (qbStatusFilter === 'not_synced') return !isSynced;

      return true;
    });
  }, [invoices, qbStatusFilter]);

  // ── TABLE COLUMNS DEFINITION ───────────────────────────────────────────
  const invoiceColumns: Column<Invoice>[] = useMemo(() => {
    const baseColumns: Column<Invoice>[] = [
      // Checkbox column (if QB connected AND user has sync permission)
      ...(isQbConnected && canSyncQb
        ? [
            {
              key: 'select' as any,
              header: (
                <Checkbox
                  isChecked={allSelected}
                  isIndeterminate={isIndeterminate}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  colorScheme="blue"
                />
              ) as any,
              width: '48px',
              render: (_: any, row: any) => (
                <Checkbox
                  isChecked={selectedInvoiceIds.includes(row.InvoiceId)}
                  onChange={(e) =>
                    handleSelectRow(row.InvoiceId, e.target.checked)
                  }
                  colorScheme="blue"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                />
              ),
            },
          ]
        : []),

      // Actions column (if permissions allow)
      ...(canSend || canViewDetail
        ? [
            {
              key: 'actions',
              header: 'Actions',
              width: '20px',
              render: (value: any, row: any) => (
                <ActionMenu
                  items={[
                    ...(canSend
                      ? [
                          {
                            label: 'Send Receipt',
                            icon: MdEmail,
                            onClick: () => handleSendInvoice(row),
                          },
                        ]
                      : []),
                    ...(canViewDetail
                      ? [
                          {
                            label: 'View Receipt',
                            icon: MdVisibility,
                            onClick: () => handleViewInvoice(row),
                          },
                        ]
                      : []),
                  ]}
                />
              ),
            },
          ]
        : []),

      // Invoice number (clickable if can view detail)
      {
        key: 'invoiceNo',
        header: 'Receipt No',
        render: (value, row) => {
          return (
            <Text
              color={canViewDetail ? 'blue.600' : 'gray.700'}
              fontWeight="medium"
              cursor={canViewDetail ? 'pointer' : 'default'}
              textDecoration={canViewDetail ? 'underline' : 'none'}
              onClick={
                canViewDetail
                  ? () => handleInvoiceClick(row?.InvoiceId)
                  : undefined
              }
              _hover={canViewDetail ? { color: 'blue.800' } : {}}
            >
              {value}
            </Text>
          );
        },
      },

      // Date
      {
        key: 'date',
        header: 'Date',
        render: (value) => <Text color="gray.700">{formatDate(value)}</Text>,
      },

      // Campaign name (only show if "All Campaigns" selected)
      ...(!selectedCampaign
        ? [
            {
              key: 'campaignName',
              header: 'Campaign Name',
              render: (value: string) => <Text color="gray.700">{value}</Text>,
            },
          ]
        : []),

      // Amount
      {
        key: 'amount',
        header: 'Amount',
        render: (value) => (
          <ChakraBadge fontSize="sm" textAlign="left">
            {formatAmount(value)}
          </ChakraBadge>
        ),
      },

      // Payment Method
      {
        key: 'paymentMethod',
        header: 'Payment Method',
        render: (value) => (
          <Text color="gray.700" fontSize="sm">
            {value || '—'}
          </Text>
        ),
      },

      // Donor name
      {
        key: 'donorName',
        header: 'Donor Name',
        render: (value) => <Text color="gray.700">{value}</Text>,
      },

      // Member
      {
        key: 'isMember',
        header: 'Member',
        render: (_: any, row: any) => (
          <Box>
            <Text color="gray.700">{row.isMember ? 'Yes' : 'No'}</Text>
            {row.isMember && row.memberName && (
              <Text color="gray.500" fontSize="xs">
                {row.memberName}
              </Text>
            )}
          </Box>
        ),
      },

      // Email
      {
        key: 'email',
        header: 'Email',
        render: (value) => (
          <Text color="gray.600" fontSize="sm">
            {value}
          </Text>
        ),
      },

      // QB sync status
      {
        key: 'qbStatus',
        header: 'QB Status',
        render: (_: any, row: any) => {
          const isSynced = !!row.quickBooksInvoiceId;

          return (
            <ChakraBadge colorScheme={isSynced ? 'green' : 'red'} fontSize="sm">
              {isSynced ? 'Synced' : 'Not Synced'}
            </ChakraBadge>
          );
        },
      },

      // QB invoice ID
      {
        key: 'quickBooksInvoiceId',
        header: 'QB ID',
        render: (value: any) => (
          <Text color="gray.600" fontSize="sm" fontFamily="mono">
            {value || '—'}
          </Text>
        ),
      },
      // Payment Status
      {
        key: 'paymentStatus',
        header: 'Payment Status',
        render: (value: string) => {
          const colorScheme =
            value === 'Paid'
              ? 'green'
              : value === 'Pending Payment'
                ? 'orange'
                : value === 'Partially Paid'
                  ? 'blue'
                  : value === 'Cancelled'
                    ? 'red'
                    : value === 'Refund'
                      ? 'purple'
                      : value === 'Adjusted In System'
                        ? 'teal'
                        : 'gray';

          return (
            <ChakraBadge colorScheme={colorScheme} fontSize="sm">
              {value || '—'}
            </ChakraBadge>
          );
        },
      },
    ];

    return baseColumns;
  }, [
    selectedCampaign,
    isQbConnected,
    allSelected,
    isIndeterminate,
    selectedInvoiceIds,
    canViewDetail,
    canSend,
  ]);

  // ── RENDER: LOADING STATE ──────────────────────────────────────────────
  if (loading && invoices.length === 0) {
    return (
      <Flex
        minH="100vh"
        bg="gray.50"
        alignItems="center"
        justifyContent="center"
      >
        <Loader
          message="Loading payments..."
          subtitle="Please wait while we fetch your data"
        />
      </Flex>
    );
  }

  // ── RENDER: MAIN COMPONENT ─────────────────────────────────────────────
  return (
    <Box minH="100vh">
      {/* Filter Controls Card */}
      <Card mb={10} mt={20} shadow="sm">
        <CardBody>
          <HStack spacing={4} align="center" justifyContent="space-between">
            {/* Left Controls: Campaign & Status Filters */}
            <HStack spacing={4} align="center">
              {/* Campaign Filter */}
              <Text
                fontSize="sm"
                fontWeight="medium"
                color="gray.700"
                minW="120px"
              >
                Select Campaign:
              </Text>
              <Select
                placeholder="All Campaigns"
                value={selectedCampaign}
                onChange={(e) => handleCampaignChange(e.target.value)}
                size="md"
                maxW="400px"
                fontSize="sm"
              >
                {campaigns.map((campaign) => (
                  <option key={campaign.value} value={campaign.value}>
                    {campaign.text}
                  </option>
                ))}
              </Select>

              {/* Member Filter */}
              <Select
                value={selectedMemberFilter}
                onChange={(e) => handleMemberFilterChange(e.target.value)}
                size="md"
                maxW="200px"
                fontSize="sm"
              >
                <option value="">All</option>
                <option value="Members">Members</option>
                <option value="NonMembers">Non Members</option>
              </Select>

              {/* QB Status Filter Menu */}
              <FilterMenu
                qbStatusFilter={qbStatusFilter}
                setQbStatusFilter={setQbStatusFilter}
                selectedStatus={selectedStatus}
                setSelectedStatus={(value) => {
                  setSelectedStatus(value);
                  setCurrentPage(1);
                }}
              />
            </HStack>

            {/* Right Controls: Actions */}
            <Flex align="center" gap={2}>
              {/* QuickBooks Sync Button */}
              {isQbConnected && canSyncQb && (
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  leftIcon={<RepeatIcon />}
                  isDisabled={selectedInvoiceIds.length === 0}
                  isLoading={isSyncing}
                  loadingText="Syncing..."
                  onClick={handleSyncToQuickbooks}
                  borderRadius="md"
                  fontSize="13px"
                  h="36px"
                  fontWeight="500"
                  _disabled={{
                    borderColor: 'gray.500',
                    color: 'gray.500',
                    cursor: 'not-allowed',
                    opacity: 1,
                  }}
                >
                  Sync to QuickBooks
                  {selectedInvoiceIds.length > 0 &&
                    ` (${selectedInvoiceIds.length})`}
                </Button>
              )}

              {/* Export Buttons */}
              {canExport && (
                <Flex
                  gap={1}
                  align="center"
                  bg="gray.500"
                  borderRadius="md"
                  h="36px"
                  flexShrink={1}
                >
                  <ExportButton
                    icon={FaFileCsv}
                    label="Export CSV"
                    onClick={() => handleExport('CSV')}
                  />
                  <ExportButton
                    icon={FaFileExcel}
                    label="Export Excel"
                    onClick={() => handleExport('Excel')}
                  />
                </Flex>
              )}
            </Flex>
          </HStack>
        </CardBody>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Error loading data</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Data Table */}
      <DynamicTable
        data={filteredInvoices}
        columns={invoiceColumns}
        emptyMessage="No payments found."
        isLoading={loading}
      />

      {/* Pagination */}
      {totalRecords > 0 && (
        <Pagination
          currentPage={currentPage}
          totalRecords={totalRecords}
          entriesPerPage={entriesPerPage}
          displayedItemsCount={invoices.length}
          onPageChange={handlePageChange}
        />
      )}

      {/* Export Confirmation Dialog */}
      <ExportConfirmDialog
        isOpen={showExportDialog}
        onClose={closeExportDialog}
        onConfirm={executeExport}
        titlePlaceholder="Payments"
      />
    </Box>
  );
}
