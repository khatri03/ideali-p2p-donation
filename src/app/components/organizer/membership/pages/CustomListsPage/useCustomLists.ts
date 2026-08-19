import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import customListService, { CustomListItem } from '../../services/customListService';

export type SortField = 'name' | 'memberCount' | 'createdOnUtc';
export type SortConfig = { field: SortField; dir: 'asc' | 'desc' };
export type OptionItem = { value: string; text: string };

type Applied = {
  name: string;
  customListIds: string[];
};

const EMPTY_APPLIED: Applied = { name: '', customListIds: [] };

export function useCustomLists() {
  const toast = useToast();

  const [lists, setLists] = useState<CustomListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sort, setSort] = useState<SortConfig>({ field: 'name', dir: 'asc' });

  const [name, setName] = useState('');
  const [selectedCustomListIds, setSelectedCustomListIds] = useState<string[]>([]);
  const [applied, setApplied] = useState<Applied>(EMPTY_APPLIED);
  const [customListOptions, setCustomListOptions] = useState<OptionItem[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const fetchList = useCallback(async (
    nextPageNo: number,
    nextSort: SortConfig,
    nextApplied: Applied,
  ) => {
    setIsLoading(true);
    try {
      const data = await customListService.getList({
        pageNo: nextPageNo,
        pageSize,
        sortBy: nextSort.field,
        sortOrder: nextSort.dir,
        customListUniqueIds: nextApplied.customListIds.length ? nextApplied.customListIds : undefined,
        name: nextApplied.name || undefined,
      });

      const pageData = Array.isArray(data.pageData) ? data.pageData : [];
      const normalizedName = nextApplied.name.trim().toLowerCase();
      const visibleLists = pageData.filter((item) => {
        const matchesName = !normalizedName || item.name.toLowerCase().includes(normalizedName);
        const matchesCustomList = nextApplied.customListIds.length === 0
          || nextApplied.customListIds.includes(item.uniqueId);

        return matchesName && matchesCustomList;
      });
      const usedClientFallback = visibleLists.length !== pageData.length;

      setLists(visibleLists);
      setPageCount(usedClientFallback ? Math.ceil(visibleLists.length / pageSize) : data.pageCount ?? 0);
      setTotalRecords(usedClientFallback ? visibleLists.length : data.totalRecordsCount ?? 0);
    } catch (err: any) {
      toast({
        title: 'Failed to load custom lists',
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

  const handleCustomListsOpen = useCallback(() => {
    if (optionsLoaded || optionsLoading) return;
    setOptionsLoading(true);
    customListService.getOptions()
      .then((res) => {
        const options = (res.data?.data ?? []).map((item) => ({
          value: item.uniqueId,
          text: item.name,
        }));
        setCustomListOptions(options);
        setOptionsLoaded(true);
      })
      .catch(() => {
        toast({
          title: 'Failed to load custom list options',
          status: 'error',
          position: 'top-right',
        });
      })
      .finally(() => setOptionsLoading(false));
  }, [optionsLoaded, optionsLoading, toast]);

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
    setApplied({ name, customListIds: selectedCustomListIds });
    setPageNo(1);
  };

  const handleClearFilters = () => {
    setName('');
    setSelectedCustomListIds([]);
    setApplied(EMPTY_APPLIED);
    setPageNo(1);
  };

  const handleDeleteList = useCallback(async (row: CustomListItem) => {
    const response = await customListService.deleteList(row.uniqueId);
    const nextPageNo = lists.length === 1 && pageNo > 1 ? pageNo - 1 : pageNo;

    if (nextPageNo !== pageNo) {
      setPageNo(nextPageNo);
    } else {
      await fetchList(nextPageNo, sort, applied);
    }

    return response.data;
  }, [applied, fetchList, lists.length, pageNo, sort]);

  const refreshLists = useCallback(() => {
    return fetchList(pageNo, sort, applied);
  }, [applied, fetchList, pageNo, sort]);

  const toggleCustomListId = (value: string) =>
    setSelectedCustomListIds((prev) =>
      prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value],
    );

  const clearCustomListIds = () => setSelectedCustomListIds([]);
  const hasActiveFilters = !!applied.name || applied.customListIds.length > 0;

  return {
    filtered: lists,
    isLoading,
    pageNo,
    pageSize,
    pageCount,
    totalRecords,
    sort,
    name,
    setName,
    selectedCustomListIds,
    toggleCustomListId,
    clearCustomListIds,
    customListOptions,
    optionsLoading,
    handleCustomListsOpen,
    hasActiveFilters,
    handleApplyFilter,
    handleClearFilters,
    handleDeleteList,
    refreshLists,
    handlePageChange,
    handleSort,
  };
}
