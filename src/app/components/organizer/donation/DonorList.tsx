import React, { useState, useEffect } from 'react';
import {
  Box as ChakraBox,
  Text as ChakraText,
  Heading as ChakraHeading,
  Badge as ChakraBadge,
  VStack,
  Flex,
  Checkbox,
  Button,
  Icon,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import {
  DynamicTable,
  Column,
} from './organizerDonationComponents/DynamicTable';
import Pagination from './organizerDonationComponents/Pagination';
import Loader from '../../common/Loader';
import donorService, {
  DonorData,
} from 'app/service/organizer/donation/donorListService';
import { formatDate } from './organizerDonationComponents/helperFuntions';
import { ExportButton } from './organizerDonationComponents/ExportButtonProps';
import { FaFileCsv, FaFileExcel } from 'react-icons/fa';
import { useExportHandler } from './organizerDonationComponents/useExportHandler';
import donationService from 'app/service/organizer/donation/donationService';
import { ExportConfirmDialog } from './organizerDonationComponents/ExportConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';
import contactSyncService from 'app/service/organizer/Settings/contactSyncService';
import { AutoSyncModal } from '../../organizer/donation/organizerDonationComponents/autoSyncModal';

export default function DonorList() {
  const [donors, setDonors] = useState<DonorData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entriesPerPage, setEntriesPerPage] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [archived, setArchived] = useState<boolean>(false);

  // ── NEW: Sync-related state ──────────────────────────────────────────────
  const [hasConnectedIntegrations, setHasConnectedIntegrations] =
    useState(false);
  const [selectedDonorIds, setSelectedDonorIds] = useState<string[]>([]);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const navigate = useNavigate();

  const canExport = hasPermission('Donation.Donors.Export');
  const canViewDetail = hasPermission('Donation.Invoice.ViewDetail');

  const { showExportDialog, handleExport, executeExport, closeExportDialog } =
    useExportHandler({
      currentPage,
      entriesPerPage,
      searchQuery,
      archived,
      exportServiceFn: donationService.exportDonorList,
    });

  const handleInvoiceClick = (uniqueId: string) => {
    navigate(`/organizer/donation/invoice-detail/${uniqueId}`);
  };

  // ── NEW: Check connected integrations on mount ───────────────────────────
  useEffect(() => {
    const checkConnectedIntegrations = async () => {
      try {
        const items = await contactSyncService.getConnectedItems();
        console.log('Connected items:', items); // ← check what's returned
        console.log('Items length:', items?.length);
        setHasConnectedIntegrations(items.length > 0);
      } catch {
        setHasConnectedIntegrations(false);
      }
    };
    checkConnectedIntegrations();
  }, []);
  // ────────────────────────────────────────────────────────────────────────

  const fetchDonors = async (pageNo: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await donorService.getDonorList(pageNo, pageSize);
      console.log('Fetched donors:', response);
      setDonors(response.pageData || []);
      setTotalRecords(response.totalRecordsCount || 0);
      setPageSize(response.pageSize || 50);
    } catch (error) {
      console.error('Error fetching donors:', error);
      setError('Failed to load donors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // ── NEW: Checkbox helpers ────────────────────────────────────────────────
  const allSelected =
    donors.length > 0 &&
    donors.every((d) => selectedDonorIds.includes(d.contact.uniqueId));

  const isIndeterminate =
    !allSelected &&
    donors.some((d) => selectedDonorIds.includes(d.contact.uniqueId));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = donors.map((d) => d.contact.uniqueId);
      setSelectedDonorIds((prev) => Array.from(new Set([...prev, ...allIds])));
    } else {
      const pageIds = new Set(donors.map((d) => d.contact.uniqueId));
      setSelectedDonorIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleSelectRow = (uniqueId: string, checked: boolean) => {
    if (checked) {
      setSelectedDonorIds((prev) => [...prev, uniqueId]);
    } else {
      setSelectedDonorIds((prev) => prev.filter((id) => id !== uniqueId));
    }
  };

  const handleSyncNowClick = () => {
    setIsSyncModalOpen(true);
  };
  // Define columns for the table
  const columns: Column<DonorData>[] = [
    // ── Checkbox column: only when integrations are connected and user has permission ──
    ...(hasConnectedIntegrations && hasPermission('donation:donors:sync')
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
            render: (_: any, row: DonorData) => (
              <Checkbox
                isChecked={selectedDonorIds.includes(row.contact.uniqueId)}
                onChange={(e) =>
                  handleSelectRow(row.contact.uniqueId, e.target.checked)
                }
                colorScheme="blue"
                onClick={(e) => e.stopPropagation()}
              />
            ),
          },
        ]
      : []),
    // ────────────────────────────────────────────────────────────────────
    {
      key: 'invoiceNo',
      header: 'Receipt No',
      width: '120px',
      render: (_, row) => {
        return (
          <ChakraText
            color={canViewDetail ? 'blue.600' : 'gray.700'}
            fontWeight="medium"
            cursor={canViewDetail ? 'pointer' : 'default'}
            textDecoration={canViewDetail ? 'underline' : 'none'}
            onClick={
              canViewDetail
                ? () => handleInvoiceClick(row.invoiceInfo.uniqueId)
                : undefined
            }
            _hover={canViewDetail ? { color: 'blue.800' } : {}}
          >
            {row.invoiceInfo.invoiceNo}
          </ChakraText>
        );
      },
    },
    {
      key: 'donor',
      header: 'Donor Name',
      width: '200px',
      render: (_, row) => (
        <VStack align="start" spacing={0}>
          <ChakraText fontWeight="medium">
            {row.contact.firstName} {row.contact.middleName}{' '}
            {row.contact.lastName}
          </ChakraText>
        </VStack>
      ),
    },
    {
      key: 'campaign',
      header: 'Campaign',
      width: '250px',
      render: (_, row) => <ChakraText>{row.campaignInfo.name}</ChakraText>,
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '120px',
      render: (_, row) => (
        <ChakraBadge fontSize="sm" textAlign="left">
          {row.invoiceInfo.invoiceAmount.toFixed(2)}
        </ChakraBadge>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      width: '150px',
      render: (_, row) => {
        const date = formatDate(row.invoiceInfo.invoiceDateUtc);
        return <ChakraText fontSize="sm">{date}</ChakraText>;
      },
    },
  ];

  return (
    <ChakraBox mt={20}>
      {/* ── Top action bar (Export + Sync Now) ── */}
      <Flex justify="flex-end" align="center" gap={2} mb={3}>
        {/* ── NEW: Sync Now button ── */}
        {hasConnectedIntegrations && hasPermission('donation:donors:sync') && (
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            leftIcon={<RepeatIcon />}
            isDisabled={selectedDonorIds.length === 0}
            onClick={handleSyncNowClick}
            borderRadius="md"
            fontSize="13px"
            fontWeight="500"
            _disabled={{
              borderColor: 'gray.500', // ← changed from gray.300 to gray.500
              color: 'gray.500',
              cursor: 'not-allowed',
              opacity: 1,
            }}
          >
            Sync Now
            {selectedDonorIds.length > 0 && ` (${selectedDonorIds.length})`}
          </Button>
        )}

        {canExport && (
          <Flex
            gap={1}
            align="center"
            bg="gray.500"
            borderRadius="md"
            h="32px"
            flexShrink={1}
            width={20}
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

      {isLoading ? (
        <Loader
          message="Loading Donor List..."
          subtitle="Please wait while we fetch the data"
        />
      ) : error ? (
        <ChakraBox textAlign="center" py={10}>
          <ChakraText color="red.500" fontSize="lg">
            {error}
          </ChakraText>
        </ChakraBox>
      ) : (
        <>
          <DynamicTable
            data={donors}
            columns={columns}
            isLoading={false}
            emptyMessage="No donors found."
          />

          {donors.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalRecords={totalRecords}
              entriesPerPage={pageSize}
              onPageChange={handlePageChange}
              displayedItemsCount={donors.length}
            />
          )}
        </>
      )}

      {/* Existing export confirmation dialog — unchanged */}
      <ExportConfirmDialog
        isOpen={showExportDialog}
        onClose={closeExportDialog}
        onConfirm={executeExport}
        titlePlaceholder="Donors"
      />

      <AutoSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        campaignId={''}
        selectedDonorIds={selectedDonorIds} // ← add this
      />
    </ChakraBox>
  );
}
