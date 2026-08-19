import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';
import membershipMembersService, { MemberListItem } from '../../services/membershipMembersService';

export type { MemberListItem };
export type OptionItem = { value: string; text: string };
export type SortField  = 'memberFullName' | 'activeMembershipName' | 'membershipStatus' | 'membershipExpiryUtc';
export type SortConfig = { field: SortField; dir: 'asc' | 'desc' };

type Applied = {
  search: string;
  typeIds: string[];
  statuses: string[];
};

const EMPTY_APPLIED: Applied = { search: '', typeIds: [], statuses: [] };

export function useMembershipMembers() {
  const toast = useToast();

  // ── Initial filters from the URL (e.g. "Active Members" deep-link from a membership type row) ─
  const [searchParams] = useSearchParams();
  const initialTypeId   = searchParams.get('typeId');
  const initialStatus   = searchParams.get('status');
  const initialTypeIds  = initialTypeId ? [initialTypeId] : [];
  const initialStatuses = initialStatus ? [initialStatus] : [];

  // ── Status options from /api/organizer/membership/type/status-options ─────────
  const [statusOptions, setStatusOptions] = useState<OptionItem[]>([]);
  useEffect(() => {
    membershipMembersService.getMemberStatusOptions()
      .then((r) => setStatusOptions(r.data?.data ?? []))
      .catch(() => {});
  }, []);

  // ── Membership type options — lazy on first open ───────────────────────────
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

  // ── Filter UI state ────────────────────────────────────────────────────────
  const [search,          setSearch]          = useState('');
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>(initialTypeIds);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialStatuses);

  const [applied, setApplied] = useState<Applied>({
    ...EMPTY_APPLIED,
    typeIds: initialTypeIds,
    statuses: initialStatuses,
  });

  // ── Table state ────────────────────────────────────────────────────────────
  const [members,    setMembers]    = useState<MemberListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page,       setPage]       = useState(1);
  const pageSize = 10;
  const [isLoading, setIsLoading] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
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
        membershipStatuses:      a.statuses.length ? a.statuses : undefined,
      });
      const d = res.data?.data;
      setMembers(d?.pageData ?? []);
      setTotalCount(d?.totalRecordsCount ?? 0);
    } catch {
      toast({ title: 'Failed to load members', status: 'error', position: 'top-right' });
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

  // ── Filter actions ─────────────────────────────────────────────────────────
  const handleApplyFilter = () => {
    const next: Applied = { search, typeIds: selectedTypeIds, statuses: selectedStatuses };
    setApplied(next);
    setPage(1);
    fetchMembers(next, 1);
  };

  const handleClearFilters = () => {
    setSearch(''); setSelectedTypeIds([]); setSelectedStatuses([]);
    setApplied(EMPTY_APPLIED);
    setPage(1);
    fetchMembers(EMPTY_APPLIED, 1);
  };

  const toggleTypeId  = (v: string) =>
    setSelectedTypeIds((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  const clearTypeIds  = () => setSelectedTypeIds([]);

  const toggleStatus  = (v: string) =>
    setSelectedStatuses((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  const clearStatuses = () => setSelectedStatuses([]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchMembers(applied, p);
  };

  const hasActiveFilters = !!applied.search || applied.typeIds.length > 0 || applied.statuses.length > 0;

  return {
    search, setSearch,
    selectedTypeIds, toggleTypeId, clearTypeIds,
    selectedStatuses, toggleStatus, clearStatuses,
    membershipTypeOptions, typesLoading, handleMembershipTypesOpen,
    statusOptions,
    filtered: members, totalCount, page, pageSize, isLoading,
    hasActiveFilters,
    appliedSearch: applied.search,
    appliedTypeIds: applied.typeIds,
    appliedStatuses: applied.statuses,
    handleApplyFilter, handleClearFilters, handlePageChange,
  };
}
