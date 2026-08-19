import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import DonationList from './DonationList';
import { ExportConfirmDialog } from './organizerDonationComponents/ExportConfirmDialog';
import { useExportHandler } from './organizerDonationComponents/useExportHandler';
import donationService from 'app/service/organizer/donation/donationService';

export default function DonationModule() {
  const navigate = useNavigate();
  
  // pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [entriesPerPage, setEntriesPerPage] = useState<number>(6);
  const [searchQuery, setSearchQuery] = useState("");
  const [archived, setArchived] = useState<boolean>(false);

  // Use the export handler hook
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
    exportServiceFn: donationService.exportDonationCampaignList,
  });
  
  return (
    <Box pt={20}>
      <Box w="100%">
        <DonationList
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          entriesPerPage={entriesPerPage}
          setEntriesPerPage={setEntriesPerPage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onExportCSV={() => handleExport('CSV')}
          onExportExcel={() => handleExport('Excel')}
          onAddCampaign={() => navigate('/create-donation-campaign')}
        />
      </Box>

      {/* Confirmation Dialog */}
      <ExportConfirmDialog
        isOpen={showExportDialog}
        onClose={closeExportDialog}
        onConfirm={executeExport}
        titlePlaceholder="Campaigns"
      />
    </Box>
  );
}