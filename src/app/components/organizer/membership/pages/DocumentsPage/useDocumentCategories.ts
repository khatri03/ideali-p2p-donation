import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import documentCategoryService, { DocumentCategoryItem } from '../../services/documentCategoryService';

export function useDocumentCategories() {
  const toast = useToast();

  const [categories, setCategories] = useState<DocumentCategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  const [name, setName] = useState('');
  const [appliedName, setAppliedName] = useState('');

  const fetchList = useCallback(async (nextPageNo: number, searchTerm: string) => {
    setIsLoading(true);
    try {
      const data = await documentCategoryService.getList({
        pageNo: nextPageNo,
        pageSize,
        searchTerm,
      });

      setCategories(data.pageData ?? []);
      setPageCount(data.pageCount ?? 0);
      setTotalRecords(data.totalRecordsCount ?? 0);
    } catch (err: any) {
      toast({
        title: 'Failed to load document categories',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, toast]);

  useEffect(() => {
    fetchList(pageNo, appliedName);
  }, [fetchList, pageNo, appliedName]);

  const handlePageChange = (nextPage: number) => setPageNo(nextPage);

  const handleApplyFilter = () => {
    setAppliedName(name);
    setPageNo(1);
  };

  const handleClearFilters = () => {
    setName('');
    setAppliedName('');
    setPageNo(1);
  };

  const refreshList = useCallback(
    () => fetchList(pageNo, appliedName),
    [fetchList, pageNo, appliedName],
  );

  const hasActiveFilters = !!appliedName;

  return {
    filtered: categories,
    isLoading,
    pageNo,
    pageSize,
    pageCount,
    totalRecords,
    name,
    setName,
    hasActiveFilters,
    handleApplyFilter,
    handleClearFilters,
    handlePageChange,
    refreshList,
  };
}
