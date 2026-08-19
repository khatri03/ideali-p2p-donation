export type ExportServiceFunction = (
  exportFormat: string,
  pageNo?: number,
  pageSize?: number,
  searchTerm?: string,
  archived?: boolean,
  status?: string,
  campaignId?: string,
) => Promise<void>;

export interface ExportButtonProps {
    icon: any;
    label: string;
    onClick: () => void;
  }

export interface UseExportHandlerProps {
  currentPage: number;
  entriesPerPage: number;
  searchQuery: string;
  archived: boolean;
  exportServiceFn: ExportServiceFunction;
  status?: string;
  campaignId?: string;
}

export interface UseExportHandlerReturn {
  showExportDialog: boolean;
  pendingExportFormat: string;
  handleExport: (exportFormat: string, overrideStatus?: string) => void;
  executeExport: (exportAll: boolean) => Promise<void>;
  closeExportDialog: () => void;
}