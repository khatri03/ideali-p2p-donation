import React, { useState, useEffect } from 'react';
import { 
  Box as ChakraBox, 
  Text as ChakraText,
  Heading as ChakraHeading,
  Badge as ChakraBadge,
  VStack,
  Flex
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { DynamicTable, Column } from './organizerDonationComponents/DynamicTable';
import Pagination from './organizerDonationComponents/Pagination';
import Loader from '../../common/Loader';
import HttpClient from '../../../service/httpClient/HttpClient';
import { useExportHandler } from './organizerDonationComponents/useExportHandler';
import donationService from 'app/service/organizer/donation/donationService';
import { FaFileCsv, FaFileExcel } from 'react-icons/fa';
import { ExportButton } from './organizerDonationComponents/ExportButtonProps';
import { DonorData } from 'app/service/organizer/donation/donorListService';
import { DonorListResponse } from 'app/service/organizer/donation/donorListService';
import { formatDate } from './organizerDonationComponents/helperFuntions';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';

export default function SpecificCampaignDonor() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  
  const [donors, setDonors] = useState<DonorData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entriesPerPage, setEntriesPerPage] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [archived, setArchived] = useState<boolean>(false);


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
        exportServiceFn: donationService.exportDonorList,
        campaignId,
      });


  const canViewDetail = hasPermission('Donation.Invoice.ViewDetail');

  const handleInvoiceClick = (uniqueId: string) => {
    navigate(`/organizer/donation/invoice-detail/${uniqueId}`);
  };

  const fetchDonors = async (pageNo: number) => {
    if (!campaignId) {
      setError('Campaign ID is missing');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching donors for campaign:', campaignId, 'Page:', pageNo, 'PageSize:', pageSize);
      
      // Call the API endpoint: GET /api/donation/campaign/{campaignUniqueId}/donor-list
      const url = `/api/donation/campaign/${campaignId}/donor-list?pageNo=${pageNo}&pageSize=${pageSize}`;
      
      console.log('API URL:', url);
      
      const response = await HttpClient.get<{ data: DonorListResponse }>(url);
      
      console.log('Full API Response:', response);
      console.log('Response data:', response.data);

      if (response.data && response.data.data) {
        const donorData = response.data.data;
        console.log('Donor data received:', donorData);
        console.log('Number of donors:', donorData.pageData?.length);
        console.log('First donor campaign ID:', donorData.pageData?.[0]?.campaignInfo?.id);
        
        setDonors(donorData.pageData || []);
        setTotalRecords(donorData.totalRecordsCount || 0);
        setPageSize(donorData.pageSize || 50);
      }
    } catch (error: any) {
      console.error('Error fetching donors:', error);
      console.error('Error details:', error?.response?.data);
      setError(error?.response?.data?.message || 'Failed to load donors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors(currentPage);
  }, [currentPage, campaignId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Define columns for the table
  const columns: Column<DonorData>[] = [
    {
         key: 'invoiceNo',
         header: 'Receipt No',
         width: '120px',
         render: (_, row) => {
           console.log('Full row data:', row);
           console.log('invoiceInfo:', row.invoiceInfo);
           console.log('uniqueId:', row.invoiceInfo?.uniqueId);
           return (
             <ChakraText
               color={canViewDetail ? 'blue.600' : 'gray.700'}
               fontWeight="medium"
               cursor={canViewDetail ? 'pointer' : 'default'}
               textDecoration={canViewDetail ? 'underline' : 'none'}
               onClick={canViewDetail ? () => handleInvoiceClick(row.invoiceInfo.uniqueId) : undefined}
               _hover={canViewDetail ? { color: 'blue.800' } : {}}
             >
               {row.invoiceInfo.invoiceNo}
             </ChakraText>
           );
         }
       },
    {
      key: 'donor',
      header: 'Donor Name',
      width: '200px',
      render: (_, row) => (
        <VStack align="start" spacing={0}>
          <ChakraText fontWeight="medium">
            {row.contact.firstName} {row.contact.middleName} {row.contact.lastName}
          </ChakraText>
          {row.contact.primaryEmail && (
            <ChakraText fontSize="xs" color="gray.600">
              {row.contact.primaryEmail}
            </ChakraText>
          )}
        </VStack>
      )
    },
    {
      key: 'contact',
      header: 'Contact',
      width: '150px',
      render: (_, row) => (
        <ChakraText fontSize="sm">
          {row.contact.cellPhone || row.contact.workPhone || 'N/A'}
        </ChakraText>
      )
    },
    {
      key: 'campaign',
      header: 'Campaign',
      width: '200px',
      render: (_, row) => (
        <ChakraText>{row.campaignInfo.name}</ChakraText>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '120px',
      render: (_, row) => (
        <ChakraBadge fontSize="sm" textAlign="left">
          {row.invoiceInfo.invoiceAmount.toFixed(2)}
        </ChakraBadge>
      )
    },
    {
          key: 'date',
          header: 'Date',
          width: '150px',
          render: (_, row) => {
            const date = formatDate(row.invoiceInfo.invoiceDateUtc);
            return (
              <ChakraText fontSize="sm">
                {date}
              </ChakraText>
            );
          }
        }
  ];

  // Error state - no campaign ID
  if (!campaignId) {
    return (
      <ChakraBox mt={20}>
        <ChakraBox textAlign="center" py={10}>
          <ChakraText color="red.500" fontSize="lg" fontWeight="bold">
            Campaign ID is missing
          </ChakraText>
          <ChakraText color="gray.600" mt={2}>
            Please select a campaign to view donors
          </ChakraText>
        </ChakraBox>
      </ChakraBox>
    );
  }

  return (
    <ChakraBox mt={20}>
      <Flex align="center" mb={6}>
  {/* Left side heading */}
  <ChakraHeading size="md">
    Campaign Donors
  </ChakraHeading>

  {/* Right side export buttons */}
  <Flex
    gap={1}
    align="center"
    bg="gray.500"
    borderRadius="md"
    h="32px"
    px={1}
    ml="auto"
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
            emptyMessage="No donors found for this campaign."
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
    </ChakraBox>
  );
}