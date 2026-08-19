import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import memberAlertService, { MemberAlertItem } from '../../services/memberAlertService';

export type SortField =
  | 'title'
  | 'priority'
  | 'channels'
  | 'status'
  | 'recipientCount'
  | 'readCount'
  | 'sentAtUtc';
export type SortConfig = { field: SortField; dir: 'asc' | 'desc' };

type Applied = {
  title: string;
  status: string;
};

const EMPTY_APPLIED: Applied = { title: '', status: '' };

export function useMemberAlerts() {
  const toast = useToast();

  const [alerts, setAlerts] = useState<MemberAlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sort, setSort] = useState<SortConfig>({ field: 'sentAtUtc', dir: 'desc' });

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('');
  const [applied, setApplied] = useState<Applied>(EMPTY_APPLIED);

  const fetchList = useCallback(async (
    nextPageNo: number,
    nextSort: SortConfig,
    nextApplied: Applied,
  ) => {
    setIsLoading(true);
    try {
      const data = await memberAlertService.getList({
        pageNo: nextPageNo,
        pageSize,
        sortBy: nextSort.field,
        sortOrder: nextSort.dir,
      });

      const pageData = Array.isArray(data.pageData) ? data.pageData : [];
      const normalizedTitle = nextApplied.title.trim().toLowerCase();
      const visibleAlerts = pageData.filter((item) => {
        const matchesTitle = !normalizedTitle || item.title.toLowerCase().includes(normalizedTitle);
        const matchesStatus = !nextApplied.status || item.status === nextApplied.status;

        return matchesTitle && matchesStatus;
      });
      const usedClientFallback = visibleAlerts.length !== pageData.length;

      setAlerts(visibleAlerts);
      setPageCount(usedClientFallback ? Math.ceil(visibleAlerts.length / pageSize) : data.pageCount ?? 0);
      setTotalRecords(usedClientFallback ? visibleAlerts.length : data.totalRecordsCount ?? 0);
    } catch (err: any) {
      toast({
        title: 'Failed to load member alerts',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, toast]);

  useEffect(() => {
    fetchList(pageNo, sort, applied);
  }, [fetchList, pageNo, sort, applied]);

  const handlePageChange = (nextPage: number) => {
    setPageNo(nextPage);
  };

  const handleSort = (field: SortField) => {
    const nextSort: SortConfig = sort.field === field
      ? { field, dir: sort.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: 'asc' };

    setSort(nextSort);
    setPageNo(1);
  };

  const handleApplyFilter = () => {
    setApplied({ title, status });
    setPageNo(1);
  };

  const handleClearFilters = () => {
    setTitle('');
    setStatus('');
    setApplied(EMPTY_APPLIED);
    setPageNo(1);
  };

  const refreshAlerts = useCallback(() => {
    return fetchList(pageNo, sort, applied);
  }, [applied, fetchList, pageNo, sort]);

  const hasActiveFilters = !!applied.title || !!applied.status;

  return {
    filtered: alerts,
    isLoading,
    pageNo,
    pageSize,
    pageCount,
    totalRecords,
    sort,
    title,
    setTitle,
    status,
    setStatus,
    hasActiveFilters,
    handleApplyFilter,
    handleClearFilters,
    refreshAlerts,
    handlePageChange,
    handleSort,
  };
}
