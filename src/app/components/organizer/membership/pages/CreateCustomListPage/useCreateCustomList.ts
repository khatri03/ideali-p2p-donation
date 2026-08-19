import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import customListService, {
  CustomListMemberOption,
  CustomListMembershipTypeOption,
} from '../../services/customListService';

export type MemberSortField = 'fullName' | 'email' | 'membershipTypeName';
export type MemberSortConfig = { field: MemberSortField; dir: 'asc' | 'desc' };

export interface CustomListMemberRow {
  uniqueId: string;
  fullName: string;
  email: string;
  membershipTypeUniqueId: string;
  membershipTypeName: string;
  addedOnUtc: string | null;
  alsoIn: string[];
}

const getMemberId = (member: CustomListMemberOption) =>
  member.uniqueId ??
  member.memberUniqueId ??
  member.membershipMemberUniqueId ??
  member.participantUniqueId ??
  member.userUniqueId ??
  '';

const normalizeMember = (member: CustomListMemberOption): CustomListMemberRow => ({
  uniqueId: getMemberId(member),
  fullName: member.fullName ?? member.memberFullName ?? member.name ?? '-',
  email: member.email ?? '-',
  membershipTypeUniqueId: member.membershipTypeUniqueId ?? member.membershipUniqueId ?? member.activeMembershipUniqueId ?? '',
  membershipTypeName: member.membershipTypeName ?? member.activeMembershipName ?? '-',
  addedOnUtc: member.addedOnUtc ?? member.createdOnUtc ?? null,
  alsoIn: member.alsoIn ?? member.alsoInCustomLists ?? member.customListNames ?? [],
});

export function useCreateCustomList() {
  const toast = useToast();
  const navigate = useNavigate();
  const { customListId } = useParams<{ customListId?: string }>();
  const isEditMode = !!customListId;

  const [listName, setListName] = useState('');
  const [membershipTypes, setMembershipTypes] = useState<CustomListMembershipTypeOption[]>([]);
  const [membershipTypesLoading, setMembershipTypesLoading] = useState(true);
  const [selectedMembershipTypeIds, setSelectedMembershipTypeIds] = useState<string[]>([]);
  const [appliedMembershipTypeIds, setAppliedMembershipTypeIds] = useState<string[]>([]);

  const [members, setMembers] = useState<CustomListMemberRow[]>([]);
  const [addMemberOptions, setAddMemberOptions] = useState<CustomListMemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addMembersLoading, setAddMembersLoading] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sort, setSort] = useState<MemberSortConfig>({ field: 'fullName', dir: 'asc' });
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [checkedMemberIds, setCheckedMemberIds] = useState<string[]>([]);
  const [addModalSelectedMemberIds, setAddModalSelectedMemberIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isRemovingMembers, setIsRemovingMembers] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [addMemberPageNo, setAddMemberPageNo] = useState(1);
  const ADD_MEMBER_PAGE_SIZE = 10;

  useEffect(() => {
    customListService.getMembershipTypeOptions()
      .then((res) => setMembershipTypes(res.data?.data ?? []))
      .catch((err: any) => {
        toast({
          title: 'Failed to load membership types',
          description: err?.message ?? 'Please try again.',
          status: 'error',
          position: 'top-right',
        });
      })
      .finally(() => setMembershipTypesLoading(false));
  }, [toast]);

  const fetchMembers = useCallback(async (
    membershipTypeIds: string[],
    nextPageNo: number,
    nextSort: MemberSortConfig,
    pinnedMembers: CustomListMemberRow[] = [],
  ) => {
    if (membershipTypeIds.length === 0) {
      setMembers(pinnedMembers);
      setTotalRecords(pinnedMembers.length);
      return;
    }

    setMembersLoading(true);
    try {
      const data = await customListService.getMemberOptions({
        pageNo: nextPageNo,
        pageSize,
        sortBy: nextSort.field,
        sortOrder: nextSort.dir,
        membershipTypeUniqueIds: membershipTypeIds,
      });

      const selectedTypeNames = membershipTypes
        .filter((type) => membershipTypeIds.includes(type.uniqueId))
        .map((type) => type.name.toLowerCase());
      const normalizedMembers = (data.pageData ?? [])
        .map(normalizeMember)
        .filter((member) => member.uniqueId)
        .filter((member) => {
          if (member.membershipTypeUniqueId) {
            return membershipTypeIds.includes(member.membershipTypeUniqueId);
          }

          return selectedTypeNames.includes(member.membershipTypeName.toLowerCase());
        });

      const mergedMembers = [
        ...pinnedMembers,
        ...normalizedMembers.filter((member) =>
          !pinnedMembers.some((pinnedMember) => pinnedMember.uniqueId === member.uniqueId),
        ),
      ];

      setMembers(mergedMembers);
      setTotalRecords(data.totalRecordsCount ?? mergedMembers.length);
    } catch (err: any) {
      toast({
        title: 'Failed to load members',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setMembersLoading(false);
    }
  }, [membershipTypes, pageSize, toast]);

  const fetchCustomListMembers = useCallback(async (
    listId: string,
    nextPageNo: number,
    nextSort: MemberSortConfig,
  ) => {
    setMembersLoading(true);
    try {
      const data = await customListService.getMembers(listId, {
        pageNo: nextPageNo,
        pageSize,
        sortBy: nextSort.field,
        sortOrder: nextSort.dir,
      });
      const normalizedMembers = (data.pageData ?? [])
        .map(normalizeMember)
        .filter((member) => member.uniqueId);

      setMembers(normalizedMembers);
      setSelectedMemberIds((prev) => Array.from(new Set([
        ...prev,
        ...normalizedMembers.map((member) => member.uniqueId),
      ])));
      setCheckedMemberIds([]);
      setTotalRecords(data.totalRecordsCount ?? normalizedMembers.length);
    } catch (err: any) {
      toast({
        title: 'Failed to load custom list members',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setMembersLoading(false);
    }
  }, [pageSize, toast]);

  useEffect(() => {
    if (!customListId) return;

    setIsDetailLoading(true);
    customListService.getById(customListId)
      .then((res) => {
        const detail = res.data?.data;
        if (!detail) return;

        const detailMembers = detail.members ??
          detail.selectedMembers ??
          detail.customListMembers ??
          detail.pageData ??
          [];
        const normalizedMembers = detailMembers
          .map(normalizeMember)
          .filter((member) => member.uniqueId);
        const memberIds = detail.memberUniqueIds ??
          normalizedMembers.map((member) => member.uniqueId);
        const selectedTypeIds = detail.membershipTypeUniqueIds ??
          Array.from(new Set(normalizedMembers.map((member) => member.membershipTypeUniqueId).filter(Boolean)));

        setListName(detail.name ?? '');
        setSelectedMemberIds(memberIds);
        setSelectedMembershipTypeIds(selectedTypeIds);
        setAppliedMembershipTypeIds(selectedTypeIds);
        setPageNo(1);

        if (customListId) {
          fetchCustomListMembers(customListId, 1, { field: 'fullName', dir: 'asc' });
        } else if (selectedTypeIds.length > 0) {
          fetchMembers(selectedTypeIds, 1, { field: 'fullName', dir: 'asc' }, normalizedMembers);
        } else {
          setMembers(normalizedMembers);
          setTotalRecords(normalizedMembers.length);
        }
      })
      .catch((err: any) => {
        toast({
          title: 'Failed to load custom list',
          description: err?.message ?? 'Please try again.',
          status: 'error',
          position: 'top-right',
        });
      })
      .finally(() => setIsDetailLoading(false));
  }, [customListId, fetchCustomListMembers, fetchMembers, toast]);

  const handleApplyMemberFilter = () => {
    setAppliedMembershipTypeIds(selectedMembershipTypeIds);
    setPageNo(1);
    if (!isEditMode) setSelectedMemberIds([]);
    fetchMembers(selectedMembershipTypeIds, 1, sort);
  };

  const handleClearMemberFilter = () => {
    setSelectedMembershipTypeIds([]);
    setAppliedMembershipTypeIds([]);
    setMembers([]);
    setTotalRecords(0);
    setPageNo(1);
    setSelectedMemberIds([]);
  };

  const handlePageChange = (nextPage: number) => {
    setPageNo(nextPage);
    if (customListId) {
      fetchCustomListMembers(customListId, nextPage, sort);
      return;
    }
    fetchMembers(appliedMembershipTypeIds, nextPage, sort);
  };

  const handleSort = (field: MemberSortField) => {
    const nextSort: MemberSortConfig = sort.field === field
      ? { field, dir: sort.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: 'asc' };

    setSort(nextSort);
    setPageNo(1);
    if (customListId) {
      fetchCustomListMembers(customListId, 1, nextSort);
      return;
    }
    fetchMembers(appliedMembershipTypeIds, 1, nextSort);
  };

  const visibleMembers = useMemo(() => {
    const term = memberSearch.trim().toLowerCase();
    if (!term) return members;

    return members.filter((member) =>
      member.fullName.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term),
    );
  }, [memberSearch, members]);

  const toggleMember = (memberId: string) =>
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );

  const visibleMemberIds = visibleMembers.map((member) => member.uniqueId);
  const allVisibleSelected = visibleMemberIds.length > 0 &&
    visibleMemberIds.every((id) => checkedMemberIds.includes(id));

  const toggleVisibleMembers = () => {
    setCheckedMemberIds((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !visibleMemberIds.includes(id));
      }

      return Array.from(new Set([...prev, ...visibleMemberIds]));
    });
  };

  const allVisibleMembersSelected = visibleMemberIds.length > 0 &&
    visibleMemberIds.every((id) => selectedMemberIds.includes(id));

  const toggleAllVisibleMembers = () => {
    setSelectedMemberIds((prev) => {
      if (allVisibleMembersSelected) {
        return prev.filter((id) => !visibleMemberIds.includes(id));
      }

      return Array.from(new Set([...prev, ...visibleMemberIds]));
    });
  };

  const canCreate = listName.trim().length > 0 && selectedMemberIds.length > 0 && !isCreating;
  const canSaveName = isEditMode && listName.trim().length > 0 && !isSavingName;

  const membershipTypeOptions = useMemo(() => membershipTypes.map((type) => ({
    value: type.uniqueId,
    text: `${type.name} (${type.activeMemberCount})`,
  })), [membershipTypes]);

  const toggleMembershipTypeId = (value: string) =>
    setSelectedMembershipTypeIds((prev) =>
      prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value],
    );

  const clearMembershipTypeIds = () => setSelectedMembershipTypeIds([]);

  const fetchAddMemberOptions = async () => {
    if (selectedMembershipTypeIds.length === 0) {
      setAddMemberOptions([]);
      setAddModalSelectedMemberIds([]);
      setAddMemberPageNo(1);
      return;
    }

    setAddMembersLoading(true);
    try {
      const data = await customListService.getMemberOptions({
        pageNo: 1,
        pageSize: 1000,
        sortBy: 'fullName',
        sortOrder: 'asc',
        membershipTypeUniqueIds: selectedMembershipTypeIds,
      });
      const selectedTypeNames = membershipTypes
        .filter((type) => selectedMembershipTypeIds.includes(type.uniqueId))
        .map((type) => type.name.toLowerCase());
      const options = (data.pageData ?? [])
        .map(normalizeMember)
        .filter((member) => member.uniqueId)
        .filter((member) => !selectedMemberIds.includes(member.uniqueId))
        .filter((member) => {
          if (member.membershipTypeUniqueId) {
            return selectedMembershipTypeIds.includes(member.membershipTypeUniqueId);
          }

          return selectedTypeNames.includes(member.membershipTypeName.toLowerCase());
        });

      setAddMemberOptions(options);
      setAddMemberPageNo(1);
    } catch (err: any) {
      toast({
        title: 'Failed to load members',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setAddMembersLoading(false);
    }
  };

  const clearAddMemberFilter = () => {
    setSelectedMembershipTypeIds([]);
    setAddMemberOptions([]);
    setAddModalSelectedMemberIds([]);
    setAddMemberPageNo(1);
  };

  const clearAddModalSelectedMembers = () => setAddModalSelectedMemberIds([]);

  const toggleAddModalMember = (memberId: string) =>
    setAddModalSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );

  const toggleAllAddModalMembers = (ids: string[]) =>
    setAddModalSelectedMemberIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !ids.includes(id));
      }

      return Array.from(new Set([...prev, ...ids]));
    });

  const handleAddMembers = async () => {
    if (!customListId || addModalSelectedMemberIds.length === 0 || isAddingMembers) return;

    setIsAddingMembers(true);
    try {
      const nextMemberIds = Array.from(new Set([...selectedMemberIds, ...addModalSelectedMemberIds]));
      const response = await customListService.addMembers(customListId, addModalSelectedMemberIds);
      const addedMembers = addMemberOptions.filter((member) =>
        addModalSelectedMemberIds.includes(member.uniqueId),
      );

      setSelectedMemberIds(nextMemberIds);
      setMembers((prev) => [
        ...addedMembers.filter((member) => !prev.some((current) => current.uniqueId === member.uniqueId)),
        ...prev,
      ]);
      setTotalRecords((prev) => prev + addedMembers.length);
      setAddModalSelectedMemberIds([]);
      setAddMemberOptions((prev) => prev.filter((member) => !nextMemberIds.includes(member.uniqueId)));
      toast({
        title: response.data?.message ?? 'Members added to list.',
        status: 'success',
        position: 'top-right',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to add members',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setSelectedMemberIds((prev) => prev.filter((id) => id !== memberId));
    setCheckedMemberIds((prev) => prev.filter((id) => id !== memberId));
    setMembers((prev) => prev.filter((member) => member.uniqueId !== memberId));
    setTotalRecords((prev) => Math.max(0, prev - 1));
  };

  const toggleCheckedMember = (memberId: string) =>
    setCheckedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );

  const clearCheckedMembers = () => setCheckedMemberIds([]);

  const handleRemoveMembers = async (memberIds: string[]) => {
    if (!customListId || memberIds.length === 0 || isRemovingMembers) return;

    setIsRemovingMembers(true);
    try {
      const response = await customListService.removeMembers(customListId, memberIds);

      setSelectedMemberIds((prev) => prev.filter((id) => !memberIds.includes(id)));
      setCheckedMemberIds((prev) => prev.filter((id) => !memberIds.includes(id)));
      setMembers((prev) => prev.filter((member) => !memberIds.includes(member.uniqueId)));
      setTotalRecords((prev) => Math.max(0, prev - memberIds.length));
      toast({
        title: response.data?.message ?? 'Member removed from list.',
        status: 'success',
        position: 'top-right',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to remove member',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsRemovingMembers(false);
    }
  };

  const handleSaveName = async () => {
    if (!customListId || !canSaveName) return;

    setIsSavingName(true);
    try {
      const response = await customListService.rename(customListId, listName.trim());

      toast({
        title: response.data?.message ?? 'Custom list name saved.',
        status: 'success',
        position: 'top-right',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to save list name',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCreateList = async () => {
    if (!canCreate) return;

    setIsCreating(true);
    try {
      const payload = {
        name: listName.trim(),
        memberUniqueIds: selectedMemberIds,
      };
      const response = customListId
        ? await customListService.update(customListId, payload)
        : await customListService.create(payload);

      toast({
        title: response.data?.message ?? (customListId ? 'Custom list updated.' : 'Custom list created.'),
        status: 'success',
        position: 'top-right',
      });
      navigate('/organizer/membership/custom-lists');
    } catch (err: any) {
      toast({
        title: 'Failed to create custom list',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return {
    listName,
    setListName,
    customListId,
    isEditMode,
    isDetailLoading,
    membershipTypeOptions,
    membershipTypesLoading,
    selectedMembershipTypeIds,
    appliedMembershipTypeIds,
    toggleMembershipTypeId,
    clearMembershipTypeIds,
    members: visibleMembers,
    membersLoading,
    pageNo,
    pageSize,
    totalRecords,
    sort,
    memberSearch,
    setMemberSearch,
    selectedMemberIds,
    checkedMemberIds,
    addMemberOptions,
    addModalSelectedMemberIds,
    addMemberPageNo,
    setAddMemberPageNo,
    ADD_MEMBER_PAGE_SIZE,
    isCreating,
    isSavingName,
    isRemovingMembers,
    addMembersLoading,
    isAddingMembers,
    canCreate,
    canSaveName,
    allVisibleSelected,
    allVisibleMembersSelected,
    toggleMember,
    toggleVisibleMembers,
    toggleAllVisibleMembers,
    toggleCheckedMember,
    toggleAddModalMember,
    toggleAllAddModalMembers,
    clearAddModalSelectedMembers,
    clearCheckedMembers,
    handleRemoveMember,
    handleRemoveMembers,
    fetchAddMemberOptions,
    clearAddMemberFilter,
    handleAddMembers,
    handleSaveName,
    handleApplyMemberFilter,
    handleClearMemberFilter,
    handleCreateList,
    handlePageChange,
    handleSort,
  };
}
