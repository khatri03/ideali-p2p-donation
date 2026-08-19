export interface PaginationProps {
  currentPage: number;
  totalRecords: number;
  entriesPerPage: number;
  onPageChange: (page: number) => void;
  displayedItemsCount: number;
}