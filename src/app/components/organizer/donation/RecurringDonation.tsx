import { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Select,
  HStack,
  useToast,
  Button,
  useDisclosure,
   Badge as ChakraBadge,
  Flex,
} from '@chakra-ui/react';
import { DynamicTable, Column } from './organizerDonationComponents/DynamicTable';
import Pagination from './organizerDonationComponents/Pagination';
import RecurringDonationService, { RecurringDonationData } from '../../../service/organizer/donation/RecurringDonationService';
import CancelRecurringDonationModal from './organizerDonationComponents/CancelRecurringDonationModal';
import Loader from '../../common/Loader';
import { useExportHandler } from './organizerDonationComponents/useExportHandler';
import donationService from 'app/service/organizer/donation/donationService';
import { ExportConfirmDialog } from './organizerDonationComponents/ExportConfirmDialog';
import { ExportButton } from './organizerDonationComponents/ExportButtonProps';
import { FaFileCsv, FaFileExcel } from 'react-icons/fa';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';

export default function RecurringDonation() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [donations, setDonations] = useState<RecurringDonationData[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const entriesPerPage = 10;

  const canCancel = hasPermission('Donation.Recurring.Cancel');
  const canExport = hasPermission('Donation.Recurring.Export');


    const [searchQuery, setSearchQuery] = useState("");
    const [archived, setArchived] = useState<boolean>(false);

  const toast = useToast();

     const {
        showExportDialog,
        handleExport,
        executeExport,
        closeExportDialog,
      } = useExportHandler({
        currentPage,
        entriesPerPage,
        searchQuery,
        archived,
        exportServiceFn: RecurringDonationService.exportRecurringDonationList,
        status: statusFilter,
      });

  // Fetch donations
  useEffect(() => {
    const fetchDonations = async () => {
      setIsLoading(true);
      try {
        let response;
        if (statusFilter === 'all') {
          // Fetch all donations
          response = await RecurringDonationService.getAllRecurringDonations(currentPage, entriesPerPage);
        } else {
          // Fetch donations by status
          response = await RecurringDonationService.getRecurringDonationsByStatus(statusFilter, currentPage, entriesPerPage);
        }

        setDonations(response.data.pageData);
        setTotalRecords(response.data.totalRecordsCount);
        console.log(response.data.pageData);      
      } catch (error) {
        console.error('Error fetching donations:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch recurring donations. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, [currentPage, statusFilter, toast]);

  // Calculate pagination
  const displayedItemsCount = donations.length;

  // Define columns based on API response
  const columns: Column<RecurringDonationData>[] = [
    {
      key: 'campaignName',
      header: 'Campaign Name',
      width: '200px',
      render: (value) => (
        console.log(value),
        <Text>{value || '-'}</Text>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '120px',
      render: (value) => (
        <ChakraBadge fontSize="sm" textAlign="left" >
          {value.toFixed(2)}
        </ChakraBadge>
      )
    },
    {
      key: 'frequency',
      header: 'Frequency',
      width: '150px',
      render: (value) => (
        <Text textTransform="capitalize">{value}</Text>
      )
    },
    {
      key: 'contact',
      header: 'Donor Name',
      width: '200px',
      render: (value) => {
        const fullName = `${value.firstName} ${value.lastName}`.trim();
        return <Text>{fullName || '-'}</Text>;
      }
    },
    {
      key: 'currentStatus',
      header: 'Status',
      width: '120px',
      render: (value) => (
        console.log(value),
        <Text>{value || '-'}</Text>
      )
    },
    ...(canCancel ? [{
      key: 'uniqueId',
      header: 'Action',
      width: '120px',
      render: (value: any, row: any) =>
        row.currentStatus === 'Cancelled' ? null : (
          <Button
            size="sm"
            colorScheme="red"
            variant="outline"
            onClick={() => openCancelModal(row.uniqueId)}
          >
            Cancel
          </Button>
        )
    }] : [])
  ];

  const openCancelModal = (uniqueId: string) => {
    setSelectedDonationId(uniqueId);
    onOpen();
  };

  const handleCancelDonation = async (notes: string) => {
    if (!selectedDonationId) return;

    try {
      // Call API to cancel donation with notes
      await RecurringDonationService.cancelRecurringDonation(selectedDonationId, notes);
      
      toast({
        title: 'Success',
        description: 'Recurring donation cancelled successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Close modal and reset
      onClose();
      setSelectedDonationId(null);

      // Refresh the data by re-fetching
      const fetchDonations = async () => {
        setIsLoading(true);
        try {
          let response;
          if (statusFilter === 'all') {
            response = await RecurringDonationService.getAllRecurringDonations(currentPage, entriesPerPage);
          } else {
            response = await RecurringDonationService.getRecurringDonationsByStatus(statusFilter, currentPage, entriesPerPage);
          }

          setDonations(response.data.pageData);
          setTotalRecords(response.data.totalRecordsCount);
        } catch (error) {
          console.error('Error fetching donations:', error);
        } finally {
          setIsLoading(false);
        }
      };

      await fetchDonations();
    } catch (error) {
      console.error('Error cancelling donation:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel recurring donation. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error; // Re-throw to let modal handle loading state
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1); 
  };

  // Show loader when loading
  if (isLoading) {
    return(
    <Flex 
             minH="100vh" 
             bg="gray.50" 
             alignItems="center" 
             justifyContent="center"
           >
             <Loader
               message="Loading Recurring Donations"
               subtitle="Please wait while we fetch your data..."
             />
           </Flex>
    )
  }

  return (
    <Box mt={20}>
      {/* Filter Dropdown */}
      <HStack mb={4} justify="space-between" align="center">
        {/* <Text fontSize="lg" fontWeight="semibold">
          Recurring Donations
        </Text> */}
<Flex align="center" justify="space-between" w="full" mb={3}>
  {/* Left side: Filter */}
  <HStack spacing={3}>
    <Text fontSize="sm" fontWeight="medium">
      Filter by Status:
    </Text>
    <Select
      value={statusFilter}
      onChange={handleStatusChange}
      width="200px"
      size="sm"
      borderRadius="md"
    >
      <option value="all">All Status</option>
      <option value="processing">Processing</option>
      <option value="waiting">Waiting</option>
      <option value="failed">Failed</option>
      <option value="cancelled">Cancelled</option>
    </Select>
  </HStack>

  {/* Right side: Export buttons */}
  {canExport && (
    <Flex
      gap={1}
      align="center"
      bg="gray.500"
      borderRadius="md"
      h="32px"
      px={1}
    >
      <ExportButton
        icon={FaFileCsv}
        label="Export CSV"
        onClick={() => handleExport("CSV")}
      />
      <ExportButton
        icon={FaFileExcel}
        label="Export Excel"
        onClick={() => handleExport("Excel")}
      />
    </Flex>
  )}
</Flex>
      </HStack>

      <DynamicTable
        data={donations}
        columns={columns}
        emptyMessage="No recurring donations found."
        isLoading={false}
      />
      
      <Pagination
        currentPage={currentPage}
        totalRecords={totalRecords}
        entriesPerPage={entriesPerPage}
        onPageChange={handlePageChange}
        displayedItemsCount={displayedItemsCount}
      />

      {/* Cancellation Modal */}
      <CancelRecurringDonationModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleCancelDonation}
        donationId={selectedDonationId}
      />

      {/* Confirmation Dialog */}
                  <ExportConfirmDialog
                    isOpen={showExportDialog}
                    onClose={closeExportDialog}
                    onConfirm={executeExport}
                  />
    </Box>
  );
}