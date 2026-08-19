import { useState } from 'react';
import donationService from '../../../../service/organizer/donation/donationService';
import {UseExportHandlerProps, UseExportHandlerReturn} from '../../../../interface/donationInter/exportButtonDto';

export const useExportHandler = ({
  currentPage,
  entriesPerPage,
  searchQuery,
  archived,
  exportServiceFn,
  status,
  campaignId,
}: UseExportHandlerProps): UseExportHandlerReturn => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [pendingExportFormat, setPendingExportFormat] = useState<string>('');

  const handleExport = (exportFormat: string) => {
    setPendingExportFormat(exportFormat);
    setShowExportDialog(true);
  };

  const executeExport = async (exportAll: boolean) => {
    try {
      console.log('Exporting with:', { 
        exportAll, 
        currentPage, 
        entriesPerPage, 
        searchQuery 
      });
      
      if (exportAll) {
        // Export all records with hardcoded values
        await exportServiceFn(
          pendingExportFormat,
          1,           // pageNo: 1
          5000,        // pageSize: 5000
          searchQuery,
          archived,  
          status,
          campaignId,  
        );
        console.log("Exporting all records: pageNo=1, pageSize=5000");
      } else {
        // Export current page records with current values
        await exportServiceFn(
          pendingExportFormat,
          currentPage,     
          entriesPerPage,  
          searchQuery,
          archived, 
          status,   
          campaignId,
        );
        console.log("Exporting current page:", currentPage, entriesPerPage, searchQuery);
      }
      
      // Optional: Show success toast
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
      // Optional: Show error toast
      setShowExportDialog(false);
    }
  };

  const closeExportDialog = () => {
    setShowExportDialog(false);
  };

  return {
    showExportDialog,
    pendingExportFormat,
    handleExport,
    executeExport,
    closeExportDialog,
  };
};