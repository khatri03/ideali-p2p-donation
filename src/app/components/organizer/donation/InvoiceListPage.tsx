//InvoiceListpage

import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  Link,
  Text,
  useToast,
  Badge as ChakraBadge,
} from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Pagination from './organizerDonationComponents/Pagination';
import Loader from '../../common/Loader';
import { Invoice } from 'app/interface/donationInter/invoiceListDto';
import {
  DynamicTable,
  Column,
} from './organizerDonationComponents/DynamicTable';
import { formatDate } from './organizerDonationComponents/helperFuntions';
import { fetchPaidInvoices } from '../../../service/organizer/donation/InvoiceService';
import { ExportButton } from './organizerDonationComponents/ExportButtonProps';
import { FaFileCsv, FaFileExcel } from 'react-icons/fa';
import { useExportHandler } from './organizerDonationComponents/useExportHandler';
import donationService from 'app/service/organizer/donation/donationService';
import { ExportConfirmDialog } from './organizerDonationComponents/ExportConfirmDialog';
import ActionMenu from '../donation/ActionMenu';
import { MdEmail, MdVisibility } from 'react-icons/md';
import sendInvoiceService from '../../../service/organizer/donation/sendInvoiceService';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';
import { RepeatIcon } from '@chakra-ui/icons';
import QuickbooksService from '../../../service/organizer/Settings/quickBooks/quickBookService';
import { FilterMenu } from './filterMenu';

export const InvoiceListPage = () => {
  const { campaignId } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [archived, setArchived] = useState<boolean>(false);
  const entriesPerPage = 10;

  const navigate = useNavigate();
  const toast = useToast();
  const [isQbConnected, setIsQbConnected] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const canViewDetail = hasPermission('Donation.Invoice.ViewDetail');
  const canSend = hasPermission('Donation.Invoice.Send');
  const canExport = hasPermission('Donation.Invoice.Export');
  const canSyncQb = hasPermission('integration:quick-book-:sync');
  const [qbStatusFilter, setQbStatusFilter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const { showExportDialog, handleExport, executeExport, closeExportDialog } =
    useExportHandler({
      currentPage,
      entriesPerPage,
      searchQuery,
      archived,
      exportServiceFn: donationService.exportDonationInvoiceList,
      campaignId,
    });
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

  const filteredInvoices = useMemo(() => {
    if (!qbStatusFilter) return invoices;

    return invoices.filter((inv: any) => {
      const isSynced = !!inv.quickBooksInvoiceId;
      if (qbStatusFilter === 'synced') return isSynced;
      if (qbStatusFilter === 'not_synced') return !isSynced;
      return true;
    });
  }, [invoices, qbStatusFilter]);
  const handleInvoiceClick = (InvoiceId: string) => {
    navigate(`/organizer/donation/invoice-detail/${InvoiceId}`);
  };

  // Handler for sending invoice - uses the invoice unique ID from the row
  const handleSendInvoice = async (invoice: Invoice) => {
    // Debug: Log the entire invoice object to see available fields
    console.log('Invoice object:', invoice);
    console.log('Available fields:', Object.keys(invoice));

    // Get the correct invoice unique ID from the invoice object
    // Try different possible field names
    const invoiceUniqueId =
      invoice.InvoiceId ||
      (invoice as any).invoiceUniqueId ||
      (invoice as any).id ||
      invoice.invoiceNo;

    console.log('Using invoiceUniqueId:', invoiceUniqueId);

    try {
      // Show loading toast
      const loadingToast = toast({
        title: 'Sending Receipt...',
        description: `Please wait while we send Receipt ${invoice.invoiceNo} to ${invoice.email}`,
        status: 'loading',
        duration: null,
        isClosable: false,
        position: 'top-right',
      });

      // Call the API to send invoice with the correct ID
      const response = await sendInvoiceService.sendInvoice(invoiceUniqueId);

      // Close loading toast
      toast.close(loadingToast);

      // Show success toast
      toast({
        title: '✓ Receipt Sent Successfully!',
        description: `Receipt ${invoice.invoiceNo} has been sent to ${invoice.email}`,
        status: 'success',
        duration: 6000,
        isClosable: true,
        position: 'top-right',
      });

      console.log('Invoice sent successfully:', response);
    } catch (err: any) {
      // Show error toast
      toast({
        title: '✗ Failed to Send Receipt',
        description:
          err.message ||
          `Unable to send receipt ${invoice.invoiceNo}. Please try again.`,
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'top-right',
      });

      console.error('Error sending invoice:', err);
    }
  };

  // Handler for viewing invoice
  const handleViewInvoice = (invoice: Invoice) => {
    console.log('Viewing invoice:', invoice.invoiceNo);
    handleInvoiceClick(invoice.InvoiceId);
  };
  // ── NEW: Checkbox helpers ───────────────────────────────────────────────
  const allSelected =
    invoices.length > 0 &&
    invoices.every((inv) => selectedInvoiceIds.includes(inv.InvoiceId));

  const isIndeterminate =
    !allSelected &&
    invoices.some((inv) => selectedInvoiceIds.includes(inv.InvoiceId));

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

  const handleSelectRow = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds((prev) => [...prev, invoiceId]);
    } else {
      setSelectedInvoiceIds((prev) => prev.filter((id) => id !== invoiceId));
    }
  };

  // ── NEW: Sync handler ───────────────────────────────────────────────────
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
      setSelectedInvoiceIds([]); // clear selection after success
      await fetchInvoices(currentPage);
    } catch {
      toast({
        title: '✗ Sync Failed',
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
  // columns for the invoice table
  const invoiceColumns: Column<Invoice>[] = [
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
    ...(canSend || canViewDetail
      ? [
          {
            key: 'actions',
            header: 'Actions',
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
    {
      key: 'invoiceNo',
      header: 'Receipt No',
      render: (value, row, index) => {
        console.log('Rendering invoice:', row?.invoiceNo);
        console.log('InvoiceId for navigation:', row?.InvoiceId);
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
    {
      key: 'date',
      header: 'Date',
      render: (value) => <Text color="gray.700">{formatDate(value)}</Text>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value) =>
        `${Number(value).toLocaleString('en-PK', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      key: 'donorName',
      header: 'Donor Name',
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'qbStatus',
      header: 'QB Status',
      render: (_: any, row: any) => {
        console.log('Row data for QB Status:', row);
        const isSynced =
          row.quickBooksInvoiceId && row.quickBooksInvoiceId !== '';

        return (
          <ChakraBadge colorScheme={isSynced ? 'green' : 'red'} fontSize="sm">
            {isSynced ? 'Synced' : 'Not Synced'}
          </ChakraBadge>
        );
      },
    },
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

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [currentPage, campaignId, selectedStatus]);

  const fetchInvoices = async (page: number) => {
    setLoading(true);
    try {
      const result = await fetchPaidInvoices({
        campaignId,
        pageNo: page,
        pageSize: entriesPerPage,
        status: selectedStatus,
      });

      setInvoices(result.invoices);
      setTotalRecords(result.totalRecords);
      console.log('InvoiceIds fetched:', result.invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
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

  return (
    <Box mt={20}>
      {/* <Heading size="md" mb={4}>
        {campaignId ? 'hashir' : 'All Paid Payments'}
      </Heading> */}
      <Box display="flex" alignItems="center" mb={4}>
        {/* Left side */}
        <Text marginRight={2}>
          <b>Campaign Name: </b>{' '}
          {invoices.length > 0 ? invoices[0].campaignName : 'N/A'}
        </Text>
        {/* Export buttons */}
        <FilterMenu
          qbStatusFilter={qbStatusFilter}
          setQbStatusFilter={setQbStatusFilter}
          selectedStatus={selectedStatus} // ← ADD
          setSelectedStatus={(value) => {
            // ← ADD
            setSelectedStatus(value);
            setCurrentPage(1); // reset to page 1 on filter change
          }}
        />
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
            {selectedInvoiceIds.length > 0 && ` (${selectedInvoiceIds.length})`}
          </Button>
        )}

        {/* Push right content to the end */}
        <Flex ml="auto" align="center" gap={3}>
          {canExport && (
            <Flex
              gap={1}
              align="center"
              bg="gray.500"
              borderRadius="md"
              h="36px"
              px={1}
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

          {/* Total records */}
          {/* <Text>
            <b>Total Records:</b> {totalRecords}
          </Text> */}
        </Flex>
      </Box>

      <DynamicTable
        data={filteredInvoices}
        columns={invoiceColumns}
        emptyMessage={`No payments found${campaignId ? ' for this campaign' : ''}.`}
        isLoading={loading}
      />

      {totalRecords > 0 && (
        <Pagination
          currentPage={currentPage}
          totalRecords={totalRecords}
          entriesPerPage={entriesPerPage}
          displayedItemsCount={invoices.length}
          onPageChange={handlePageChange}
        />
      )}

      {/* Confirmation Dialog */}
      <ExportConfirmDialog
        isOpen={showExportDialog}
        onClose={closeExportDialog}
        onConfirm={executeExport}
      />
    </Box>
  );
};
