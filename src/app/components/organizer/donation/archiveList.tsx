import React, { useState, useEffect } from 'react';
import { 
	Box as ChakraBox,
	Text as ChakraText,
	Heading as ChakraHeading,
	Badge as ChakraBadge,
	VStack,
	Flex
} from "@chakra-ui/react";
import { DynamicTable, Column } from './organizerDonationComponents/DynamicTable';
import Pagination from './organizerDonationComponents/Pagination';
import Loader from '../../common/Loader';
import campaignArchiveService from 'app/service/organizer/donation/campaignArchiveService';
import donationService, { DonationCampaign } from 'app/service/organizer/donation/donationService';
import { formatDate } from './organizerDonationComponents/helperFuntions';
import { ExportButton } from './organizerDonationComponents/ExportButtonProps';
import { FaFileCsv, FaFileExcel } from 'react-icons/fa';
import { useExportHandler } from './organizerDonationComponents/useExportHandler';
import { ExportConfirmDialog } from './organizerDonationComponents/ExportConfirmDialog';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';

export default function ArchiveList() {
	const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalRecords, setTotalRecords] = useState(0);
	const [pageSize, setPageSize] = useState(50);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [entriesPerPage, setEntriesPerPage] = useState<number>(50);
	const [searchQuery, setSearchQuery] = useState("");
	const [archived, setArchived] = useState<boolean>(true);

	const canExport = hasPermission('Donation.Archived.Export');

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
		exportServiceFn: campaignArchiveService.exportArchivedCampaigns,
	});

	const fetchCampaigns = async (pageNo: number) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await campaignArchiveService.getArchivedCampaigns(pageNo, pageSize);
			setCampaigns(response.pageData || []);
			setTotalRecords(response.totalRecordsCount || 0);
			setPageSize(response.pageSize || 50);
		} catch (error) {
			console.error('Error fetching archived campaigns:', error);
			setError('Failed to load archived campaigns. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCampaigns(currentPage);
	}, [currentPage]);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const columns: Column<DonationCampaign>[] = [
		{
			key: 'name',
			header: 'Campaign Name',
			width: '300px',
			render: (_, row) => (
				<VStack align="start" spacing={0}>
					<ChakraText fontWeight="medium">{row.name}</ChakraText>
				</VStack>
			)
		},
		{
			key: 'status',
			header: 'Status',
			width: '120px',
			render: (_, row) => (
				<ChakraText fontSize="sm" fontWeight="normal" textAlign="left">{row.status}</ChakraText>
			)
		},
		{
			key: 'goal',
			header: 'Goal',
			width: '150px',
			render: (_, row) => (
				<ChakraText>{row.goal?.goal?.toFixed ? row.goal.goal.toFixed(2) : row.goal?.goal ?? '-'}</ChakraText>
			)
		},
		{
			key: 'invoiceCount',
			header: 'Payments',
			width: '100px',
			render: (_, row) => (
				<ChakraText>{row.invoiceCount}</ChakraText>
			)
		},
		{
			key: 'startDate',
			header: 'Start Date',
			width: '160px',
			render: (_, row) => (
				<ChakraText fontSize="sm">{formatDate(row.startDate)}</ChakraText>
			)
		},
		{
			key: 'endDate',
			header: 'End Date',
			width: '160px',
			render: (_, row) => (
				<ChakraText fontSize="sm">{formatDate(row.endDate)}</ChakraText>
			)
		}
	];

	return (
		<ChakraBox mt={20}>
			{canExport && (
				<Flex
					gap={1}
					align="center"
					bg="gray.500"
					borderRadius="md"
					h="32px"
					flexShrink={1}
					width={20}
					mb={3}
					marginLeft="auto"
				>
					<ExportButton
						icon={FaFileCsv}
						label="Export CSV"
						onClick={() => handleExport('csv')}
					/>
					<ExportButton
						icon={FaFileExcel}
						label="Export Excel"
						onClick={() => handleExport('excel')}
					/>
				</Flex>
			)}

			{isLoading ? (
				<Loader
					message="Loading Archived Campaigns..."
					subtitle="Please wait while we fetch the data"
				/>
			) : error ? (
				<ChakraBox textAlign="center" py={10}>
					<ChakraText color="red.500" fontSize="lg">{error}</ChakraText>
				</ChakraBox>
			) : (
				<>
					<DynamicTable
						data={campaigns}
						columns={columns}
						isLoading={false}
						emptyMessage="No archived campaigns found."
					/>

					{campaigns.length > 0 && (
						<Pagination
							currentPage={currentPage}
							totalRecords={totalRecords}
							entriesPerPage={pageSize}
							onPageChange={handlePageChange}
							displayedItemsCount={campaigns.length}
						/>
					)}
				</>
			)}

			<ExportConfirmDialog
				isOpen={showExportDialog}
				onClose={closeExportDialog}
				onConfirm={executeExport}
			titlePlaceholder="Archive List"
		/>
	</ChakraBox>
);
}
