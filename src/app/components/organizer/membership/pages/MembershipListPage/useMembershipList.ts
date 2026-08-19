import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import membershipService from '../../services/membershipService';
import { MembershipListItem } from '../../types';

export function useMembershipList() {
  const navigate = useNavigate();
  const toast = useToast();

  const [membershipTypes, setMembershipTypes] = useState<MembershipListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [pageNo, setPageNo] = useState(1);
  const [pageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const fetchList = useCallback(async (page: number, searchTerm: string) => {
    setIsLoading(true);
    try {
      const data = await membershipService.getList(page, pageSize, searchTerm);
      setMembershipTypes(Array.isArray(data.pageData) ? data.pageData : []);
      setTotalRecords(data.totalRecordsCount ?? 0);
      setPageCount(data.pageCount ?? 0);
    } catch (err: any) {
      toast({
        title: 'Failed to load membership types',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => { fetchList(pageNo, appliedSearch); }, [pageNo, appliedSearch, fetchList]);

  // ── Debounce search: auto-apply search text after the user stops typing ───
  useEffect(() => {
    if (search === appliedSearch) return;

    const timer = setTimeout(() => {
      setPageNo(1);
      setAppliedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, appliedSearch]);

  const filtered = membershipTypes;

  const handleCreate        = () => navigate('/create-membership-type');
  const handleEdit          = (id: string) => navigate(`/create-membership-type/${id}`);
  const handleAddMember     = (id: string) => window.open(`/membership/register/${id}`, '_blank');
  const handleStatusChanged = (_id: string, _newStatus: boolean) => fetchList(pageNo, appliedSearch);

  const goToPage  = (page: number) => setPageNo(page);
  const prevPage  = () => setPageNo((p) => Math.max(1, p - 1));
  const nextPage  = () => setPageNo((p) => Math.min(pageCount || 1, p + 1));

  return {
    filtered,
    isLoading,
    search,
    setSearch,
    appliedSearch,
    handleCreate,
    handleEdit,
    handleAddMember,
    handleStatusChanged,
    pageNo,
    pageSize,
    pageCount,
    totalRecords,
    goToPage,
    prevPage,
    nextPage,
  };
}
