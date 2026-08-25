import { useCallback, useEffect, useState } from 'react';
import { FundraiserStatus } from 'app/interface/donationInter/fundraiserConsoleDto';
import {
  ModerationListResult,
  ModerationQuery,
  ModerationSort,
} from 'app/interface/donationInter/peerToPeerModerationDto';

const PAGE_SIZE = 20;

const EMPTY_QUERY: ModerationQuery = {
  page: 1,
  pageSize: PAGE_SIZE,
  sortBy: 'Newest',
};

export interface ModerationFilters {
  search: string;
  status?: FundraiserStatus;
  isHidden?: boolean;
  sortBy: ModerationSort;
}

const EMPTY_FILTERS: ModerationFilters = { search: '', sortBy: 'Newest' };

interface ModerationListState<T> {
  result: ModerationListResult<T> | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  filters: ModerationFilters;
  isFiltered: boolean;
  setPage: (page: number) => void;
  setFilters: (filters: ModerationFilters) => void;
  clearFilters: () => void;
  reload: () => void;
}

const isFilterApplied = (filters: ModerationFilters) =>
  filters.search.trim().length > 0 || filters.status !== undefined || filters.isHidden !== undefined;

/**
 * One list of moderated things, its filters, and its page. Reading is all this does: the actions that
 * change a page or a team live in their own hook so a failed decision can never leave the list showing
 * a state the server refused.
 */
export const useModerationList = <T>(
  campaignUniqueId: string,
  read: (campaignUniqueId: string, query: ModerationQuery) => Promise<ModerationListResult<T>>,
): ModerationListState<T> => {
  const [result, setResult] = useState<ModerationListResult<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFiltersState] = useState<ModerationFilters>(EMPTY_FILTERS);
  const [reloadToken, setReloadToken] = useState(0);

  const setFilters = useCallback((next: ModerationFilters) => {
    setFiltersState(next);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), [setFilters]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!campaignUniqueId) {
      setIsLoading(false);
      return undefined;
    }

    let isActive = true;

    setIsLoading(true);

    read(campaignUniqueId, {
      ...EMPTY_QUERY,
      page,
      search: filters.search.trim() || undefined,
      status: filters.status,
      isHidden: filters.isHidden,
      sortBy: filters.sortBy,
    })
      .then((next) => {
        if (isActive) {
          setResult(next);
          setError(null);
        }
      })
      .catch((failure: unknown) => {
        if (isActive) {
          setError(failure instanceof Error ? failure.message : 'Something went wrong.');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [campaignUniqueId, read, page, filters, reloadToken]);

  return {
    result,
    isLoading,
    error,
    page,
    filters,
    isFiltered: isFilterApplied(filters),
    setPage,
    setFilters,
    clearFilters,
    reload,
  };
};
