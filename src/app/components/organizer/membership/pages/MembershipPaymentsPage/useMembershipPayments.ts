import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import membershipPaymentService from '../../services/membershipPaymentService';

export type PaymentItem = {
  invoiceId: string;
  memberUniqueId: string;
  invoiceNo: string;
  memberName: string;
  memberEmail: string;
  membershipName: string;
  invoiceStatus: string;
  invoiceDateUtc: string;
  totalAmount: number;
  balanceAmount: number;
  paymentMethod: string;
  paymentSource: string | null;
  currencySymbol: string;
};

export type OptionItem  = { value: string; text: string };
export type SortField   = 'invoiceNo' | 'memberName' | 'invoiceStatus' | 'invoiceDateUtc' | 'totalAmount';
export type SortConfig  = { field: SortField; dir: 'asc' | 'desc' };

export const PAYMENT_METHOD_OPTIONS: OptionItem[] = [
  { value: 'CreditCard', text: 'Debit/Credit Card' },
  { value: 'Ach',        text: 'ACH-USD' },
  { value: 'Pad',        text: 'PAD-CAD' },
  { value: 'Cheque',     text: 'Check/Cheque' },
];

type Applied = {
  search: string;
  typeIds: string[];
  statuses: string[];
  methods: string[];
  fromDate: string;
  toDate: string;
};

const EMPTY_APPLIED: Applied = {
  search: '', typeIds: [], statuses: [], methods: [], fromDate: '', toDate: '',
};

export function useMembershipPayments() {
  const toast = useToast();

  // ── Status options ────────────────────────────────────────────────────────
  const [statusOptions, setStatusOptions] = useState<OptionItem[]>([]);
  useEffect(() => {
    membershipPaymentService.getMembershipInvoiceStatusOptions()
      .then((r) => setStatusOptions(r.data?.data ?? []))
      .catch(() => {});
  }, []);

  // ── Membership types — lazy on first open ─────────────────────────────────
  const [membershipTypeOptions, setMembershipTypeOptions] = useState<OptionItem[]>([]);
  const [typesLoading,          setTypesLoading]          = useState(false);
  const [typesLoaded,           setTypesLoaded]           = useState(false);

  const handleMembershipTypesOpen = useCallback(() => {
    if (typesLoaded || typesLoading) return;
    setTypesLoading(true);
    membershipPaymentService.getMembershipTypeOptions()
      .then((r) => { setMembershipTypeOptions(r.data?.data ?? []); setTypesLoaded(true); })
      .catch(() => {})
      .finally(() => setTypesLoading(false));
  }, [typesLoaded, typesLoading]);

  // ── Filter UI state ───────────────────────────────────────────────────────
  const [search,            setSearch]            = useState('');
  const [selectedTypeIds,   setSelectedTypeIds]   = useState<string[]>([]);
  const [selectedStatuses,  setSelectedStatuses]  = useState<string[]>([]);
  const [selectedMethods,   setSelectedMethods]   = useState<string[]>([]);
  const [fromDate,          setFromDate]          = useState('');
  const [toDate,            setToDate]            = useState('');

  const [applied, setApplied] = useState<Applied>(EMPTY_APPLIED);

  // ── Table state ───────────────────────────────────────────────────────────
  const [payments,   setPayments]   = useState<PaymentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount,  setPageCount]  = useState(0);
  const [page,       setPage]       = useState(1);
  const pageSize = 10;
  const [sort,      setSort]      = useState<SortConfig>({ field: 'invoiceDateUtc', dir: 'desc' });
  const [isLoading, setIsLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchPayments = useCallback(async (
    a: Applied    = applied,
    p: number     = page,
    s: SortConfig = sort,
  ) => {
    setIsLoading(true);
    try {
      const res = await membershipPaymentService.getMembershipPayments({
        pageNo:                  p,
        pageSize,
        searchTerm:              a.search || undefined,
        status:                  a.statuses.length ? a.statuses : undefined,
        membershipTypeUniqueIds: a.typeIds.length ? a.typeIds : undefined,
        paymentMethods:          a.methods.length ? a.methods : undefined,
        invoiceDateFrom:         a.fromDate || undefined,
        invoiceDateTo:           a.toDate   || undefined,
        sortBy:                  s.field,
      });
      const d = res.data?.data;
      setPayments(d?.pageData ?? []);
      setTotalCount(d?.totalRecordsCount ?? 0);
      setPageCount(d?.pageCount ?? 0);
    } catch {
      toast({ title: 'Failed to load payments', status: 'error', position: 'top-right' });
    } finally {
      setIsLoading(false);
    }
  }, [applied, page, sort]);

  useEffect(() => { fetchPayments(); }, []);

  // ── Debounce search: auto-apply search text after the user stops typing ───
  useEffect(() => {
    if (search === applied.search) return;

    const timer = setTimeout(() => {
      const next: Applied = { ...applied, search };
      setApplied(next);
      setPage(1);
      fetchPayments(next, 1, sort);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, applied, sort, fetchPayments]);

  // ── Filter actions ────────────────────────────────────────────────────────
  const handleApplyFilter = () => {
    const next: Applied = {
      search, typeIds: selectedTypeIds, statuses: selectedStatuses,
      methods: selectedMethods, fromDate, toDate,
    };
    setApplied(next);
    setPage(1);
    fetchPayments(next, 1, sort);
  };

  const handleClearFilters = () => {
    setSearch(''); setSelectedTypeIds([]); setSelectedStatuses([]);
    setSelectedMethods([]); setFromDate(''); setToDate('');
    setApplied(EMPTY_APPLIED);
    setPage(1);
    fetchPayments(EMPTY_APPLIED, 1, sort);
  };

  const toggleTypeId  = (v: string) =>
    setSelectedTypeIds((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  const clearTypeIds  = () => setSelectedTypeIds([]);

  const toggleStatus  = (v: string) =>
    setSelectedStatuses((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  const clearStatuses = () => setSelectedStatuses([]);

  const toggleMethod  = (v: string) =>
    setSelectedMethods((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  const clearMethods  = () => setSelectedMethods([]);

  const handleSort = (field: SortField) => {
    const next: SortConfig = sort.field === field
      ? { field, dir: sort.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: 'asc' };
    setSort(next);
    fetchPayments(applied, page, next);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchPayments(applied, p, sort);
  };

  const hasActiveFilters =
    !!applied.search || applied.statuses.length > 0 || applied.typeIds.length > 0 ||
    applied.methods.length > 0 || !!applied.fromDate || !!applied.toDate;

  return {
    search, setSearch,
    selectedTypeIds, toggleTypeId, clearTypeIds,
    selectedStatuses, toggleStatus, clearStatuses,
    selectedMethods, toggleMethod, clearMethods,
    fromDate, setFromDate,
    toDate, setToDate,
    membershipTypeOptions, typesLoading, handleMembershipTypesOpen,
    statusOptions,
    paymentMethodOptions: PAYMENT_METHOD_OPTIONS,
    filtered: payments, totalCount, pageCount, page, pageSize, sort, isLoading,
    hasActiveFilters,
    appliedSearch: applied.search,
    appliedTypeIds: applied.typeIds,
    appliedStatuses: applied.statuses,
    appliedMethods: applied.methods,
    appliedFromDate: applied.fromDate,
    appliedToDate: applied.toDate,
    handleApplyFilter, handleClearFilters, handleSort, handlePageChange,
  };
}
