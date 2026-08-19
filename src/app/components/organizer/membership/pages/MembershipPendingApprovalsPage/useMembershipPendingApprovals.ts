import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import membershipMembersService, { MemberListItem } from '../../services/membershipMembersService';

export type { MemberListItem };
export type OptionItem = { value: string; text: string };

export const PENDING_APPROVAL_STATUS = ['PendingApproval'];

type Applied = {
  search: string;
  typeIds: string[];
};

const DEFAULT_APPLIED: Applied = { search: '', typeIds: [] };

export function useMembershipPendingApprovals() {
  const toast = useToast();

  // ── Membership type options — lazy on first open ────────────────────────────
  const [membershipTypeOptions, setMembershipTypeOptions] = useState<OptionItem[]>([]);
  const [typesLoading,          setTypesLoading]          = useState(false);
  const [typesLoaded,           setTypesLoaded]           = useState(false);

  const handleMembershipTypesOpen = useCallback(() => {
    if (typesLoaded || typesLoading) return;
    setTypesLoading(true);
    membershipMembersService.getMembershipTypeOptions()
      .then((r) => { setMembershipTypeOptions(r.data?.data ?? []); setTypesLoaded(true); })
      .catch(() => {})
      .finally(() => setTypesLoading(false));
  }, [typesLoaded, typesLoading]);

  // ── Filter UI state ──────────────────────────────────────────────────────────
  const [search,          setSearch]          = useState('');
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);

  const [applied, setApplied] = useState<Applied>(DEFAULT_APPLIED);

  // ── Table state ─────────────────────────────────────────────────────────────
  const [members,    setMembers]    = useState<MemberListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page,       setPage]       = useState(1);
  const pageSize = 10;
  const [isLoading, setIsLoading] = useState(false);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async (
    a: Applied = applied,
    p: number  = page,
  ) => {
    setIsLoading(true);
    try {
      const res = await membershipMembersService.getMembers({
        pageNo:                  p,
        pageSize,
        searchTerm:              a.search || undefined,
        membershipTypeUniqueIds: a.typeIds.length ? a.typeIds : undefined,
        membershipStatuses:      PENDING_APPROVAL_STATUS,
      });
      const d = res.data?.data;
      setMembers(d?.pageData ?? []);
      setTotalCount(d?.totalRecordsCount ?? 0);
    } catch {
      toast({ title: 'Failed to load pending approvals', status: 'error', position: 'top-right' });
    } finally {
      setIsLoading(false);
    }
  }, [applied, page]);

  useEffect(() => { fetchMembers(); }, []);

  // ── Debounce search: auto-apply search text after the user stops typing ───
  useEffect(() => {
    if (search === applied.search) return;

    const timer = setTimeout(() => {
      const next: Applied = { ...applied, search };
      setApplied(next);
      setPage(1);
      fetchMembers(next, 1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, applied, fetchMembers]);

  // ── Filter actions ──────────────────────────────────────────────────────────
  const handleApplyFilter = () => {
    const next: Applied = { search, typeIds: selectedTypeIds };
    setApplied(next);
    setPage(1);
    fetchMembers(next, 1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedTypeIds([]);
    setApplied(DEFAULT_APPLIED);
    setPage(1);
    fetchMembers(DEFAULT_APPLIED, 1);
  };

  const toggleTypeId = (v: string) =>
    setSelectedTypeIds((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  const clearTypeIds = () => setSelectedTypeIds([]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchMembers(applied, p);
  };

  const hasActiveFilters = !!applied.search || applied.typeIds.length > 0;

  const filtered = members;

  return {
    search, setSearch,
    selectedTypeIds, toggleTypeId, clearTypeIds,
    membershipTypeOptions, typesLoading, handleMembershipTypesOpen,
    filtered, totalCount, page, pageSize, isLoading,
    hasActiveFilters,
    appliedSearch: applied.search,
    appliedTypeIds: applied.typeIds,
    handleApplyFilter, handleClearFilters, handlePageChange,
  };
}
