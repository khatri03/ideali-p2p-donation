import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import memberAlertService, { AlertDetail, AlertRecipient } from '../../services/memberAlertService';

const PAGE_SIZE = 10;

export function useAlertDetails() {
  const toast = useToast();
  const navigate = useNavigate();
  const { uniqueId } = useParams<{ uniqueId: string }>();

  // ── Alert detail (/api/organizer/membership/alert/:uniqueId) ──────────────
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [isAlertLoading, setIsAlertLoading] = useState(true);

  const fetchAlert = useCallback(async () => {
    if (!uniqueId) return;
    setIsAlertLoading(true);
    try {
      const res = await memberAlertService.getById(uniqueId);
      setAlert(res.data?.data ?? null);
    } catch (err: any) {
      toast({
        title: 'Failed to load alert',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsAlertLoading(false);
    }
  }, [uniqueId, toast]);

  useEffect(() => {
    fetchAlert();
  }, [fetchAlert]);

  // ── Recipients (/api/organizer/membership/alert/:uniqueId/recipients) ─────
  const [recipients, setRecipients] = useState<AlertRecipient[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const fetchRecipients = useCallback(async (nextPageNo: number, searchTerm: string) => {
    if (!uniqueId) return;
    setIsLoading(true);
    try {
      const data = await memberAlertService.getRecipients(uniqueId, {
        pageNo: nextPageNo,
        pageSize: PAGE_SIZE,
        searchTerm: searchTerm || undefined,
      });
      setRecipients(data.pageData ?? []);
      setTotalRecords(data.totalRecordsCount ?? 0);
      setPageNo(nextPageNo);
    } catch (err: any) {
      toast({
        title: 'Failed to load recipients',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  }, [uniqueId, toast]);

  useEffect(() => {
    fetchRecipients(1, '');
  }, [fetchRecipients]);

  // ── Debounce search: auto-apply search text after the user stops typing ───
  useEffect(() => {
    if (search === appliedSearch) return;

    const timer = setTimeout(() => {
      setAppliedSearch(search);
      fetchRecipients(1, search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, appliedSearch, fetchRecipients]);

  const handlePageChange = (nextPage: number) => fetchRecipients(nextPage, appliedSearch);

  // ── Resend ──────────────────────────────────────────────────────────────
  const [isResendOpen, setIsResendOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!uniqueId) return;
    setIsResending(true);
    try {
      const res = await memberAlertService.resend(uniqueId);
      toast({
        title: res.data?.message ?? 'Alert resent.',
        status: 'success',
        position: 'top-right',
      });
      setIsResendOpen(false);
      fetchAlert();
      fetchRecipients(pageNo, appliedSearch);
    } catch (err: any) {
      toast({
        title: 'Failed to resend alert',
        description: err?.response?.data?.message ?? err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => navigate('/organizer/membership/member-alerts');

  return {
    alert, isAlertLoading,
    recipients, totalRecords, pageNo, pageSize: PAGE_SIZE, isLoading,
    search, setSearch,
    handlePageChange, handleBack,
    isResendOpen, setIsResendOpen, isResending, handleResend,
  };
}
