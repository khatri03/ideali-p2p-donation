import { useCallback, useEffect, useState } from 'react';
import { InvitationListResult } from 'app/interface/donationInter/fundraiserInvitationDto';
import { getInvitations } from 'app/service/organizer/donation/fundraiserInvitationService';
import { LIST_FAILED } from './invitationCopy';

const PAGE_SIZE = 20;

export interface InvitationFilters {
  search: string;
  status?: string;
}

const EMPTY_FILTERS: InvitationFilters = { search: '' };

interface InvitationListState {
  result: InvitationListResult | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  filters: InvitationFilters;
  isFiltered: boolean;
  setPage: (page: number) => void;
  setFilters: (filters: InvitationFilters) => void;
  clearFilters: () => void;
  reload: () => void;
}

/**
 * One list of invitations, its filters and its page. Reading only: sending lives in its own hook so a
 * refused send can never leave the list showing something the server did not do.
 */
export const useInvitationList = (campaignUniqueId: string): InvitationListState => {
  const [result, setResult] = useState<InvitationListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFiltersState] = useState<InvitationFilters>(EMPTY_FILTERS);
  const [reloadToken, setReloadToken] = useState(0);

  const setFilters = useCallback((next: InvitationFilters) => {
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

    getInvitations(campaignUniqueId, {
      page,
      pageSize: PAGE_SIZE,
      search: filters.search.trim() || undefined,
      status: filters.status,
    })
      .then((next) => {
        if (isActive) {
          setResult(next);
          setError(null);
        }
      })
      .catch((failure: unknown) => {
        if (isActive) {
          setError(failure instanceof Error ? failure.message : LIST_FAILED);
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
  }, [campaignUniqueId, page, filters, reloadToken]);

  return {
    result,
    isLoading,
    error,
    page,
    filters,
    isFiltered: filters.search.trim().length > 0 || filters.status !== undefined,
    setPage,
    setFilters,
    clearFilters,
    reload,
  };
};

export default useInvitationList;
