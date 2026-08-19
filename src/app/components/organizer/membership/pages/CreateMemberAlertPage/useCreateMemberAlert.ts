import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import memberAlertService, { AlertMembershipTypeOption, AlertOption, CreateAlertPayload } from '../../services/memberAlertService';
import customListService, { CustomListOption } from '../../services/customListService';
import membershipMembersService, { MemberListItem } from '../../services/membershipMembersService';

export type AudienceSource = 'members' | 'customLists';
export type Priority = 'Urgent' | 'Important' | 'Normal' | 'Low';

// TODO: replace with a real channel-options API once it's available.
const CHANNEL_OPTIONS: AlertOption[] = [
  { value: 'Instant', text: 'Instant' },
  { value: 'Email', text: 'Email' },
];

const CHANNEL_VALUE_MAP: Record<string, number> = {
  Instant: 1,
  Email: 2,
};

const MATCHED_PAGE_SIZE = 10;
const TITLE_MAX_LENGTH = 25;
const MESSAGE_MAX_LENGTH = 300;

interface FormErrors {
  channel?: string;
  title?: string;
  message?: string;
  scheduledAt?: string;
  audience?: string;
}

export function useCreateMemberAlert() {
  const toast = useToast();
  const navigate = useNavigate();

  // ── Basic fields ─────────────────────────────────────────────────────────
  const [priority, setPriority] = useState<Priority>('Normal');
  const [channel, setChannel] = useState('');
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [title, setTitle] = useState('');

  // ── Audience source ──────────────────────────────────────────────────────
  const [audienceSource, setAudienceSource] = useState<AudienceSource>('members');

  // ── Membership type options (/api/organizer/membership/alert/membership-type-options) ─
  const [membershipTypeOptions, setMembershipTypeOptions] = useState<AlertMembershipTypeOption[]>([]);
  const [membershipTypeLoading, setMembershipTypeLoading] = useState(true);
  const [membershipType, setMembershipType] = useState('');

  // ── Membership status options (/api/organizer/membership/type/status-options) ─
  const [membershipStatusOptions, setMembershipStatusOptions] = useState<AlertOption[]>([]);
  const [membershipStatusLoading, setMembershipStatusLoading] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState('');

  useEffect(() => {
    memberAlertService.getMembershipTypeOptions()
      .then((res) => setMembershipTypeOptions(res.data?.data ?? []))
      .catch(() => {
        toast({ title: 'Failed to load membership types', status: 'error', position: 'top-right' });
      })
      .finally(() => setMembershipTypeLoading(false));

    memberAlertService.getMembershipStatusOptions()
      .then((res) => setMembershipStatusOptions(res.data?.data ?? []))
      .catch(() => {
        toast({ title: 'Failed to load membership statuses', status: 'error', position: 'top-right' });
      })
      .finally(() => setMembershipStatusLoading(false));
  }, [toast]);

  // ── Custom lists (/api/organizer/membership/custom-list/options) ──────────
  const [customListOptions, setCustomListOptions] = useState<CustomListOption[]>([]);
  const [customListLoading, setCustomListLoading] = useState(false);
  const [customListLoaded, setCustomListLoaded] = useState(false);
  const [customListIds, setCustomListIds] = useState<string[]>([]);

  const toggleCustomListId = useCallback((value: string) => {
    setCustomListIds((prev) => (
      prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value]
    ));
  }, []);

  const clearCustomListIds = useCallback(() => setCustomListIds([]), []);

  const handleCustomListsTabOpen = useCallback(() => {
    if (customListLoaded || customListLoading) return;
    setCustomListLoading(true);
    customListService.getOptions()
      .then((res) => { setCustomListOptions(res.data?.data ?? []); setCustomListLoaded(true); })
      .catch(() => {
        toast({ title: 'Failed to load custom lists', status: 'error', position: 'top-right' });
      })
      .finally(() => setCustomListLoading(false));
  }, [customListLoaded, customListLoading, toast]);

  const handleAudienceSourceChange = (source: AudienceSource) => {
    setAudienceSource(source);
    setMatchedMembers([]);
    setMatchedTotal(0);
    setMatchedPageNo(1);
    setHasAppliedMembers(false);
    if (source === 'customLists') handleCustomListsTabOpen();
  };

  // ── Audience preview (/api/organizer/membership/type/members) ─────────────
  const [matchedMembers, setMatchedMembers] = useState<MemberListItem[]>([]);
  const [matchedTotal, setMatchedTotal] = useState(0);
  const [matchedPageNo, setMatchedPageNo] = useState(1);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [hasAppliedMembers, setHasAppliedMembers] = useState(false);

  const canApply = audienceSource === 'members'
    ? !!(membershipType || membershipStatus)
    : customListIds.length > 0;

  const fetchMatchedMembers = useCallback(async (pageNo: number) => {
    setIsPreviewLoading(true);
    try {
      if (audienceSource === 'customLists') {
        const data = await memberAlertService.getCustomListPreview({
          pageNo,
          pageSize: MATCHED_PAGE_SIZE,
          customListUniqueIds: customListIds,
          membershipTypeUniqueIds: membershipType ? [membershipType] : undefined,
          membershipStatuses: membershipStatus ? [membershipStatus] : undefined,
        });
        setMatchedMembers((data.pageData ?? []).map((m) => ({
          uniqueId: m.memberUniqueId,
          memberFullName: m.fullName,
          activeMembershipName: m.membershipTypeName,
          membershipStatus: m.membershipStatus,
          email: m.email,
          membershipExpiryUtc: null,
        })));
        setMatchedTotal(data.totalRecordsCount ?? 0);
        setMatchedPageNo(pageNo);
        return;
      }

      const res = await membershipMembersService.getMembers({
        pageNo,
        pageSize: MATCHED_PAGE_SIZE,
        membershipTypeUniqueIds: membershipType ? [membershipType] : undefined,
        membershipStatuses: membershipStatus ? [membershipStatus] : undefined,
      });
      const data = res.data?.data;
      setMatchedMembers(data?.pageData ?? []);
      setMatchedTotal(data?.totalRecordsCount ?? 0);
      setMatchedPageNo(pageNo);
    } catch (err: any) {
      toast({
        title: 'Failed to load matched members',
        description: err?.response?.data?.message ?? err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsPreviewLoading(false);
    }
  }, [audienceSource, membershipType, membershipStatus, customListIds, toast]);

  const handleApplyAudience = async () => {
    if (!canApply) return;
    setHasAppliedMembers(true);
    await fetchMatchedMembers(1);
  };

  const handleMatchedPageChange = (nextPage: number) => {
    if (!hasAppliedMembers) return;
    fetchMatchedMembers(nextPage);
  };

  // ── Message ──────────────────────────────────────────────────────────────
  const [message, setMessage] = useState('');
  const [messageText, setMessageText] = useState('');

  // ── Submit ──────────────────────────────────────────────────────────────
  const [isSending, setIsSending] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const computeErrors = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    if (!channel) newErrors.channel = 'Channel is required.';

    if (!title.trim()) newErrors.title = 'Title is required.';
    else if (title.length > TITLE_MAX_LENGTH) newErrors.title = `Title must not exceed ${TITLE_MAX_LENGTH} characters.`;

    if (!messageText.trim()) newErrors.message = 'Message is required.';
    else if (messageText.length > MESSAGE_MAX_LENGTH) newErrors.message = `Message must not exceed ${MESSAGE_MAX_LENGTH} characters.`;

    if (scheduleForLater && !scheduledAt) newErrors.scheduledAt = 'Pick a date and time.';

    if (audienceSource === 'customLists' && customListIds.length === 0) {
      newErrors.audience = 'Select at least one custom list.';
    }

    return newErrors;
  }, [channel, title, messageText, scheduleForLater, scheduledAt, audienceSource, customListIds]);

  const errors = useMemo(() => (attemptedSubmit ? computeErrors() : {}), [attemptedSubmit, computeErrors]);

  const handleCancel = () => navigate('/organizer/membership/member-alerts');

  const handleSend = async (): Promise<FormErrors> => {
    setAttemptedSubmit(true);
    const newErrors = computeErrors();
    if (Object.keys(newErrors).length > 0) return newErrors;
    setIsConfirmOpen(true);
    return {};
  };

  const closeConfirm = () => setIsConfirmOpen(false);

  const handleConfirmSend = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      const payload: CreateAlertPayload = {
        title: title.trim(),
        body: message,
        priority,
        channels: CHANNEL_VALUE_MAP[channel] ?? 0,
        scheduledAtUtc: scheduleForLater && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        customListUniqueIds: audienceSource === 'customLists' ? customListIds : [],
        membershipStatuses: membershipStatus ? [membershipStatus] : [],
        membershipTypeUniqueIds: membershipType ? [membershipType] : [],
        recipientUniqueIds: [],
      };

      const res = await memberAlertService.create(payload);
      toast({
        title: res.data?.message ?? 'Alert sent.',
        status: 'success',
        position: 'top-right',
      });
      setIsConfirmOpen(false);
      navigate('/organizer/membership/member-alerts');
    } catch (err: any) {
      toast({
        title: 'Failed to send alert',
        description: err?.response?.data?.message ?? err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSending(false);
    }
  };

  return {
    priority, setPriority,
    channel, setChannel, channelOptions: CHANNEL_OPTIONS,
    scheduleForLater, setScheduleForLater,
    scheduledAt, setScheduledAt,
    title, setTitle, titleMaxLength: TITLE_MAX_LENGTH,
    message, setMessage,
    messageText, setMessageText, messageMaxLength: MESSAGE_MAX_LENGTH,

    audienceSource, handleAudienceSourceChange,

    membershipTypeOptions, membershipTypeLoading, membershipType, setMembershipType,
    membershipStatusOptions, membershipStatusLoading, membershipStatus, setMembershipStatus,

    customListOptions, customListLoading, customListIds, toggleCustomListId, clearCustomListIds,

    canApply, matchedMembers, matchedTotal, isPreviewLoading, handleApplyAudience,
    matchedPageNo, matchedPageSize: MATCHED_PAGE_SIZE, handleMatchedPageChange,

    isSending, errors, handleSend, handleCancel,
    isConfirmOpen, closeConfirm, handleConfirmSend,
  };
}
