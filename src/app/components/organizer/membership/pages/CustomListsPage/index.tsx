import React from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useToast,
} from '@chakra-ui/react';
import {
  MdArrowDownward,
  MdArrowUpward,
  MdAdd,
  MdDelete,
  MdEdit,
  MdFilterList,
  MdFilterListOff,
  MdGroupAdd,
  MdMoreVert,
  MdSearch,
  MdUnfoldMore,
  MdWarningAmber,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Pagination from 'app/components/organizer/donation/organizerDonationComponents/Pagination';
import MembershipHeroHeader from '../../common/MembershipHeroHeader';
import MultiSelectDropdown from '../../common/MultiSelectDropdown';
import customListService, {
  CustomListItem,
  CustomListMemberOption,
} from '../../services/customListService';
import { SortConfig, SortField, useCustomLists } from './useCustomLists';
import PermissionGate from 'app/components/common/PermissionGate';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';

function SortIcon({ field, sort }: { field: SortField; sort: SortConfig }) {
  if (sort.field !== field) {
    return <Icon as={MdUnfoldMore} boxSize={3.5} color="gray.400" ml={1} />;
  }

  return (
    <Icon
      as={sort.dir === 'asc' ? MdArrowUpward : MdArrowDownward}
      boxSize={3.5}
      color="#044bd9"
      ml={1}
    />
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

type AddMemberRow = {
  uniqueId: string;
  fullName: string;
  email: string;
  membershipTypeUniqueId: string;
  membershipTypeName: string;
};

const getMemberId = (member: CustomListMemberOption) =>
  member.uniqueId ??
  member.memberUniqueId ??
  member.membershipMemberUniqueId ??
  member.participantUniqueId ??
  member.userUniqueId ??
  '';

const normalizeMember = (member: CustomListMemberOption): AddMemberRow => ({
  uniqueId: getMemberId(member),
  fullName: member.fullName ?? member.memberFullName ?? member.name ?? '-',
  email: member.email ?? '-',
  membershipTypeUniqueId:
    member.membershipTypeUniqueId ??
    member.membershipUniqueId ??
    member.activeMembershipUniqueId ??
    '',
  membershipTypeName:
    member.membershipTypeName ?? member.activeMembershipName ?? '-',
});

function ActionsMenu({
  row,
  onEdit,
  onAddMembers,
  onDelete,
}: {
  row: CustomListItem;
  onEdit: (row: CustomListItem) => void;
  onAddMembers: (row: CustomListItem) => void;
  onDelete: (row: CustomListItem) => void;
}) {
  const canEdit = hasPermission('membership:custom-list:edit');
  const canAddMembers = hasPermission('membership:custom-list:create');
  const canDelete = hasPermission('membership:custom-list:delete');

  if (!canEdit && !canAddMembers && !canDelete) return null;

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        icon={<Icon as={MdMoreVert} />}
        variant="ghost"
        size="sm"
        borderRadius="full"
        aria-label="Actions"
        _hover={{ bg: 'blue.50', color: 'blue.500' }}
      />
      <MenuList
        minW="160px"
        shadow="xl"
        borderRadius="xl"
        border="1px solid"
        borderColor="gray.100"
        py={2}
        overflow="hidden"
      >
        {canEdit && (
          <MenuItem
            icon={<Icon as={MdEdit} color="gray.600" />}
            fontSize="sm"
            fontWeight="medium"
            _hover={{ bg: 'gray.50' }}
            onClick={() => onEdit(row)}
          >
            Edit List
          </MenuItem>
        )}
        {canAddMembers && (
          <MenuItem
            icon={<Icon as={MdGroupAdd} color="gray.600" />}
            fontSize="sm"
            fontWeight="medium"
            _hover={{ bg: 'gray.50' }}
            onClick={() => onAddMembers(row)}
          >
            Add Members
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem
            icon={<Icon as={MdDelete} color="red.500" />}
            fontSize="sm"
            fontWeight="medium"
            color="red.500"
            _hover={{ bg: 'red.50' }}
            onClick={() => onDelete(row)}
          >
            Delete
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  );
}

export default function CustomListsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const {
    filtered,
    isLoading,
    pageNo,
    pageSize,
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
  } = useCustomLists();

  const canEditList = hasPermission('membership:custom-list:edit');
  const canAddMembersToList = hasPermission('membership:custom-list:create');
  const canDeleteList = hasPermission('membership:custom-list:delete');
  const canShowActions = canEditList || canAddMembersToList || canDeleteList;

  const [deleteTarget, setDeleteTarget] = React.useState<CustomListItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [addTarget, setAddTarget] = React.useState<CustomListItem | null>(null);
  const [addMembershipTypeOptions, setAddMembershipTypeOptions] =
    React.useState<{ value: string; text: string }[]>([]);
  const [addMembershipTypesLoading, setAddMembershipTypesLoading] =
    React.useState(false);
  const [selectedAddMembershipTypeIds, setSelectedAddMembershipTypeIds] =
    React.useState<string[]>([]);
  const [addMemberOptions, setAddMemberOptions] = React.useState<
    AddMemberRow[]
  >([]);
  const [selectedAddMemberIds, setSelectedAddMemberIds] = React.useState<
    string[]
  >([]);
  const [addMemberSearch, setAddMemberSearch] = React.useState('');
  const [addMembersLoading, setAddMembersLoading] = React.useState(false);
  const [isAddingMembers, setIsAddingMembers] = React.useState(false);
  const [addMemberPageNo, setAddMemberPageNo] = React.useState(1);
  const ADD_MEMBER_PAGE_SIZE = 10;

  const openEditList = (row: CustomListItem) => {
    navigate(
      `/organizer/membership/custom-lists/${encodeURIComponent(row.uniqueId)}/edit`,
    );
  };

  const loadAddMembershipTypes = async () => {
    if (addMembershipTypeOptions.length > 0 || addMembershipTypesLoading)
      return;

    setAddMembershipTypesLoading(true);
    try {
      const response = await customListService.getMembershipTypeOptions();
      setAddMembershipTypeOptions(
        (response.data?.data ?? []).map((type) => ({
          value: type.uniqueId,
          text: `${type.name} (${type.activeMemberCount})`,
        })),
      );
    } catch (err: any) {
      toast({
        title: 'Failed to load membership types',
        description: err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setAddMembershipTypesLoading(false);
    }
  };

  const openAddMembers = (row: CustomListItem) => {
    setAddTarget(row);
    setSelectedAddMembershipTypeIds([]);
    setAddMemberOptions([]);
    setSelectedAddMemberIds([]);
    setAddMemberSearch('');
    setAddMemberPageNo(1);
    loadAddMembershipTypes();
  };

  const closeAddMembersModal = (force = false) => {
    if (isAddingMembers && !force) return;
    setAddTarget(null);
    setSelectedAddMembershipTypeIds([]);
    setAddMemberOptions([]);
    setSelectedAddMemberIds([]);
    setAddMemberSearch('');
    setAddMemberPageNo(1);
  };

  const toggleAddMembershipTypeId = (value: string) =>
    setSelectedAddMembershipTypeIds((prev) =>
      prev.includes(value)
        ? prev.filter((id) => id !== value)
        : [...prev, value],
    );

  const clearAddMembershipTypeIds = () => setSelectedAddMembershipTypeIds([]);

  const toggleAddMember = (memberId: string) =>
    setSelectedAddMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );

  const fetchAddMemberOptions = async () => {
    if (!addTarget || selectedAddMembershipTypeIds.length === 0) {
      setAddMemberOptions([]);
      setSelectedAddMemberIds([]);
      setAddMemberPageNo(1);
      return;
    }

    setAddMembersLoading(true);
    try {
      const [currentMembers, availableMembers] = await Promise.all([
        customListService.getMembers(addTarget.uniqueId, {
          pageNo: 1,
          pageSize: 1000,
          sortBy: 'fullName',
          sortOrder: 'asc',
        }),
        customListService.getMemberOptions({
          pageNo: 1,
          pageSize: 1000,
          sortBy: 'fullName',
          sortOrder: 'asc',
          membershipTypeUniqueIds: selectedAddMembershipTypeIds,
        }),
      ]);

      const currentMemberIds = new Set(
        (currentMembers.pageData ?? []).map(getMemberId).filter(Boolean),
      );
      const selectedTypeNames = addMembershipTypeOptions
        .filter((type) => selectedAddMembershipTypeIds.includes(type.value))
        .map((type) => type.text.replace(/\s*\(\d+\)\s*$/, '').toLowerCase());
      const options = (availableMembers.pageData ?? [])
        .map(normalizeMember)
        .filter((member) => member.uniqueId)
        .filter((member) => !currentMemberIds.has(member.uniqueId))
        .filter((member) => {
          if (member.membershipTypeUniqueId) {
            return selectedAddMembershipTypeIds.includes(
              member.membershipTypeUniqueId,
            );
          }

          return selectedTypeNames.includes(
            member.membershipTypeName.toLowerCase(),
          );
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

  const confirmAddMembers = async () => {
    if (!addTarget || selectedAddMemberIds.length === 0 || isAddingMembers)
      return;

    setIsAddingMembers(true);
    try {
      const response = await customListService.addMembers(
        addTarget.uniqueId,
        selectedAddMemberIds,
      );
      toast({
        title: response.data?.message ?? 'Members added to list.',
        status: 'success',
        position: 'top-right',
      });
      closeAddMembersModal(true);
      await refreshLists();
    } catch (err: any) {
      toast({
        title: 'Failed to add members',
        description:
          err?.response?.data?.message ?? err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsAddingMembers(false);
    }
  };

  const onDelete = (row: CustomListItem) => {
    setDeleteTarget(row);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const result = await handleDeleteList(deleteTarget);
      toast({
        title: result?.message ?? 'Custom list deleted.',
        status: 'success',
        position: 'top-right',
      });
      setDeleteTarget(null);
    } catch (err: any) {
      toast({
        title: 'Failed to delete custom list',
        description:
          err?.response?.data?.message ?? err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAddMemberOptions = addMemberOptions.filter((member) => {
    const term = addMemberSearch.trim().toLowerCase();
    if (!term) return true;

    return (
      member.fullName.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term)
    );
  });

  const pagedAddMemberOptions = filteredAddMemberOptions.slice(
    (addMemberPageNo - 1) * ADD_MEMBER_PAGE_SIZE,
    addMemberPageNo * ADD_MEMBER_PAGE_SIZE,
  );

  const pagedAddMemberIds = pagedAddMemberOptions.map(
    (member) => member.uniqueId,
  );
  const allAddMembersSelected =
    pagedAddMemberIds.length > 0 &&
    pagedAddMemberIds.every((id) => selectedAddMemberIds.includes(id));

  const toggleAllAddMembers = () =>
    setSelectedAddMemberIds((prev) => {
      if (allAddMembersSelected) {
        return prev.filter((id) => !pagedAddMemberIds.includes(id));
      }

      return Array.from(new Set([...prev, ...pagedAddMemberIds]));
    });

  return (
    <PermissionGate permission="membership:custom-list:view" showAccessDenied>
      <Box minH="100vh" bg="gray.50" pt={16} pb={8}>
        <MembershipHeroHeader
          eyebrow="Membership Lists"
          title="Member Lists"
          description="Group members into reusable named lists for quick access, filtering, and organization-wide workflows."
          action={
            hasPermission('membership:custom-list:new-custom-list') ? (
              <Button
                size="sm"
                bg="white"
                color="#044bd9"
                borderRadius="lg"
                fontSize="xs"
                fontWeight="700"
                leftIcon={<Icon as={MdAdd} />}
                onClick={() =>
                  navigate('/organizer/membership/custom-lists/create')
                }
                _hover={{ bg: 'whiteAlpha.900' }}
                _active={{ bg: 'gray.100' }}
              >
                New Custom List
              </Button>
            ) : undefined
          }
        />

        <Box mx={{ base: 2, md: 4 }} mt={4}>
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            p={5}
            mb={4}
            boxShadow="sm"
          >
            <Flex
              align="center"
              justify="space-between"
              gap={2}
              mb={4}
              pb={3}
              borderBottom="1px solid"
              borderColor="gray.100"
            >
              <Flex align="center" gap={2}>
                <Flex
                  w="28px"
                  h="28px"
                  borderRadius="md"
                  bg="blue.50"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={MdFilterList} boxSize={4} color="blue.500" />
                </Flex>
                <Text fontSize="md" fontWeight="700" color="gray.800">
                  Filters
                </Text>
              </Flex>
            </Flex>

            <Flex gap={3} flexWrap="wrap" mb={4}>
              <Box flex="1" minW="220px">
                <Text
                  fontSize="11px"
                  fontWeight="700"
                  color="gray.700"
                  textTransform="uppercase"
                  mb={1.5}
                >
                  Custom Lists
                  {optionsLoading && (
                    <Spinner size="xs" ml={2} color="#044bd9" />
                  )}
                </Text>
                <MultiSelectDropdown
                  options={customListOptions}
                  selected={selectedCustomListIds}
                  onToggle={toggleCustomListId}
                  onClear={clearCustomListIds}
                  placeholder="All custom lists"
                  onOpen={handleCustomListsOpen}
                />
              </Box>

              <Box flex="1" minW="220px">
                <Text
                  fontSize="11px"
                  fontWeight="700"
                  color="gray.700"
                  textTransform="uppercase"
                  mb={1.5}
                >
                  Name
                </Text>
                <InputGroup size="md">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={MdSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    bg="gray.50"
                    borderColor="gray.200"
                    borderRadius="lg"
                    fontSize="sm"
                    _focus={{
                      borderColor: '#044bd9',
                      boxShadow: '0 0 0 1px #044bd9',
                      bg: 'white',
                    }}
                  />
                </InputGroup>
              </Box>
            </Flex>

            <Flex gap={3} justify="flex-end">
              <Button
                size="sm"
                variant="outline"
                borderRadius="lg"
                px={5}
                borderColor={hasActiveFilters ? 'red.300' : 'gray.300'}
                color={hasActiveFilters ? 'red.500' : 'gray.500'}
                fontSize="xs"
                fontWeight="700"
                leftIcon={<Icon as={MdFilterListOff} />}
                onClick={handleClearFilters}
                _hover={{ bg: hasActiveFilters ? 'red.50' : 'gray.50' }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                bg="#044bd9"
                color="white"
                borderRadius="lg"
                px={6}
                fontSize="xs"
                fontWeight="700"
                onClick={handleApplyFilter}
                _hover={{ bg: '#0340b8' }}
                _active={{ bg: '#02308a' }}
              >
                Apply filter
              </Button>
            </Flex>
          </Box>

          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            overflow="hidden"
            boxShadow="sm"
          >
            <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.100">
              <Flex
                justify="space-between"
                align="center"
                gap={3}
                flexWrap="wrap"
              >
                <Box>
                  <Text fontSize="sm" fontWeight="800" color="gray.800">
                    Custom Lists
                  </Text>
                  <Text fontSize="xs" fontWeight="500" color="gray.500">
                    Showing organized member groups stored for your
                    organization.
                  </Text>
                </Box>
                <Badge
                  bg="blue.50"
                  color="blue.700"
                  border="1px solid"
                  borderColor="blue.200"
                  borderRadius="md"
                  px={2.5}
                  py={1}
                  fontSize="11px"
                  fontWeight="semibold"
                >
                  {totalRecords} total
                </Badge>
              </Flex>
            </Box>

            {isLoading ? (
              <Box px={4} py={4}>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead bg="gray.200">
                      <Tr>
                        <Th
                          color="gray.800"
                          fontWeight="700"
                          fontSize="11px"
                          textTransform="uppercase"
                          w="60px"
                        >
                          Actions
                        </Th>
                        <Th
                          color="gray.800"
                          fontWeight="700"
                          fontSize="11px"
                          textTransform="uppercase"
                        >
                          List Name
                        </Th>
                        <Th
                          color="gray.800"
                          fontWeight="700"
                          fontSize="11px"
                          textTransform="uppercase"
                        >
                          Members
                        </Th>
                        <Th
                          color="gray.800"
                          fontWeight="700"
                          fontSize="11px"
                          textTransform="uppercase"
                        >
                          Created
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Tr
                          key={i}
                          bg={
                            (i + 1) % 2 === 0
                              ? 'rgba(226,232,240,0.44)'
                              : 'white'
                          }
                        >
                          {Array.from({ length: 4 }).map((__, j) => (
                            <Td key={j}>
                              <Skeleton h="16px" borderRadius="md" />
                            </Td>
                          ))}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            ) : filtered.length === 0 ? (
              <Flex direction="column" align="center" py={14} gap={2}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                  No custom lists found
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Custom lists will appear here once they are created.
                </Text>
              </Flex>
            ) : (
              <>
                <Box display={{ base: 'none', lg: 'block' }}>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.200">
                        <Tr>
                          {canShowActions && (
                            <Th
                              color="gray.800"
                              fontWeight="700"
                              fontSize="11px"
                              textTransform="uppercase"
                              w="60px"
                            >
                              Actions
                            </Th>
                          )}
                          {(
                            [
                              'name',
                              'memberCount',
                              'createdOnUtc',
                            ] as SortField[]
                          ).map((field, index) => {
                            const labels = ['List Name', 'Members', 'Created'];
                            return (
                              <Th
                                key={field}
                                color="gray.800"
                                fontWeight="700"
                                fontSize="11px"
                                textTransform="uppercase"
                                cursor="pointer"
                                userSelect="none"
                                onClick={() => handleSort(field)}
                                isNumeric={field === 'memberCount'}
                              >
                                <Flex
                                  align="center"
                                  justify={
                                    field === 'memberCount'
                                      ? 'flex-end'
                                      : 'flex-start'
                                  }
                                >
                                  {labels[index]}{' '}
                                  <SortIcon field={field} sort={sort} />
                                </Flex>
                              </Th>
                            );
                          })}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filtered.map((row, i) => (
                          <Tr
                            key={row.uniqueId}
                            bg={
                              (i + 1) % 2 === 0
                                ? 'rgba(226,232,240,0.44)'
                                : 'white'
                            }
                          >
                            {canShowActions && (
                              <Td>
                                <ActionsMenu
                                  row={row}
                                  onEdit={openEditList}
                                  onAddMembers={openAddMembers}
                                  onDelete={onDelete}
                                />
                              </Td>
                            )}
                            <Td>
                              <Text
                                fontSize="xs"
                                fontWeight="700"
                                color="gray.800"
                              >
                                {row.name}
                              </Text>
                            </Td>
                            <Td isNumeric>
                              <Badge
                                bg="teal.50"
                                color="teal.700"
                                border="1px solid"
                                borderColor="teal.200"
                                borderRadius="md"
                                px={2.5}
                                py={1}
                                fontSize="11px"
                                fontWeight="bold"
                              >
                                {row.memberCount}
                              </Badge>
                            </Td>
                            <Td>
                              <Text
                                fontSize="xs"
                                color="gray.700"
                                fontWeight="500"
                              >
                                {fmtDate(row.createdOnUtc)}
                              </Text>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>

                <Box display={{ base: 'block', lg: 'none' }}>
                  <VStack
                    spacing={0}
                    divider={<Box h="1px" bg="gray.100" w="full" />}
                  >
                    {filtered.map((row) => (
                      <Box key={row.uniqueId} px={4} py={4} w="full">
                        <Flex justify="space-between" align="flex-start">
                          <Box flex="1" minW={0} mr={2}>
                            <Text
                              fontSize="sm"
                              fontWeight="semibold"
                              color="gray.800"
                              mb={1}
                              noOfLines={1}
                            >
                              {row.name}
                            </Text>
                            <Flex gap={3} flexWrap="wrap">
                              <Box>
                                <Text
                                  fontSize="10px"
                                  color="gray.400"
                                  textTransform="uppercase"
                                  fontWeight="bold"
                                  mb={0.5}
                                >
                                  Members
                                </Text>
                                <Badge
                                  bg="teal.50"
                                  color="teal.700"
                                  border="1px solid"
                                  borderColor="teal.200"
                                  borderRadius="md"
                                  px={2.5}
                                  py={1}
                                  fontSize="xs"
                                  fontWeight="bold"
                                >
                                  {row.memberCount}
                                </Badge>
                              </Box>
                              <Box>
                                <Text
                                  fontSize="10px"
                                  color="gray.400"
                                  textTransform="uppercase"
                                  fontWeight="bold"
                                  mb={0.5}
                                >
                                  Created
                                </Text>
                                <Text
                                  fontSize="xs"
                                  color="gray.700"
                                  fontWeight="medium"
                                >
                                  {fmtDate(row.createdOnUtc)}
                                </Text>
                              </Box>
                            </Flex>
                          </Box>
                          <ActionsMenu
                            row={row}
                            onEdit={openEditList}
                            onAddMembers={openAddMembers}
                            onDelete={onDelete}
                          />
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </>
            )}

            {!isLoading && totalRecords > 0 && (
              <Pagination
                currentPage={pageNo}
                totalRecords={totalRecords}
                entriesPerPage={pageSize}
                onPageChange={handlePageChange}
                displayedItemsCount={filtered.length}
              />
            )}
          </Box>
        </Box>

        <Modal
          isOpen={!!addTarget}
          onClose={() => closeAddMembersModal()}
          size="4xl"
          isCentered
          scrollBehavior="inside"
        >
          <ModalOverlay bg="blackAlpha.500" />
          <ModalContent borderRadius="xl" maxH="85vh">
            <ModalHeader pb={2}>
              <Text fontSize="lg" fontWeight="800" color="gray.900">
                Add Members
              </Text>
              <Text fontSize="xs" fontWeight="400" color="gray.500">
                Adding to {addTarget?.name}. Members already in this list are
                hidden.
              </Text>
            </ModalHeader>
            <ModalCloseButton isDisabled={isAddingMembers} />
            <ModalBody>
              <Box mb={4}>
                <Text fontSize="sm" fontWeight="700" color="gray.700" mb={1.5}>
                  Membership Type
                  {addMembershipTypesLoading && (
                    <Spinner size="xs" ml={2} color="#044bd9" />
                  )}
                </Text>
                <Flex
                  gap={3}
                  align={{ base: 'stretch', md: 'center' }}
                  flexDirection={{ base: 'column', md: 'row' }}
                >
                  <Box flex="1">
                    <MultiSelectDropdown
                      options={addMembershipTypeOptions}
                      selected={selectedAddMembershipTypeIds}
                      onToggle={toggleAddMembershipTypeId}
                      onClear={clearAddMembershipTypeIds}
                      placeholder={
                        addMembershipTypesLoading
                          ? 'Loading membership types...'
                          : 'All membership types'
                      }
                    />
                  </Box>
                  <Button
                    h="40px"
                    minH="40px"
                    bg="#044bd9"
                    color="white"
                    borderRadius="lg"
                    fontSize="sm"
                    fontWeight="700"
                    onClick={() => {
                      setSelectedAddMemberIds([]);
                      fetchAddMemberOptions();
                    }}
                    isDisabled={
                      selectedAddMembershipTypeIds.length === 0 ||
                      addMembershipTypesLoading
                    }
                    isLoading={addMembersLoading}
                    _hover={{ bg: '#0340b8' }}
                  >
                    Apply Filter
                  </Button>
                  <Button
                    h="40px"
                    minH="40px"
                    variant="outline"
                    borderRadius="lg"
                    fontSize="sm"
                    fontWeight="600"
                    onClick={() => {
                      clearAddMembershipTypeIds();
                      setAddMemberOptions([]);
                      setSelectedAddMemberIds([]);
                      setAddMemberPageNo(1);
                    }}
                  >
                    Clear Filter
                  </Button>
                </Flex>
              </Box>

              <Box
                border="1px solid"
                borderColor="gray.200"
                borderRadius="xl"
                overflow="hidden"
              >
                <Flex
                  justify="space-between"
                  align="center"
                  gap={3}
                  px={4}
                  py={3}
                  flexWrap="wrap"
                >
                  <InputGroup size="sm" maxW={{ base: 'full', md: '360px' }}>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={MdSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      value={addMemberSearch}
                      onChange={(e) => {
                        setAddMemberSearch(e.target.value);
                        setAddMemberPageNo(1);
                      }}
                      placeholder="Search by name or email"
                      bg="gray.50"
                      borderColor="gray.200"
                      borderRadius="lg"
                    />
                  </InputGroup>
                  <Flex
                    gap={2}
                    align="center"
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="lg"
                    px={3}
                    py={2}
                  >
                    <Text fontSize="xs" fontWeight="800" color="gray.800">
                      {filteredAddMemberOptions.length} members
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {selectedAddMemberIds.length} selected
                    </Text>
                  </Flex>
                </Flex>

                {addMembersLoading ? (
                  <Box px={4} py={4}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} h="28px" borderRadius="md" mb={3} />
                    ))}
                  </Box>
                ) : filteredAddMemberOptions.length === 0 ? (
                  <Flex
                    minH="140px"
                    align="center"
                    justify="center"
                    px={4}
                    textAlign="center"
                  >
                    <Text fontSize="xs" color="gray.500">
                      {selectedAddMembershipTypeIds.length > 0
                        ? 'No available members found for the selected membership type.'
                        : 'Select membership type, then apply filter to load available members.'}
                    </Text>
                  </Flex>
                ) : (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.100">
                        <Tr>
                          <Th w="42px">
                            <Checkbox
                              isChecked={allAddMembersSelected}
                              onChange={toggleAllAddMembers}
                            />
                          </Th>
                          <Th color="gray.500" fontSize="11px" fontWeight="700">
                            Member
                          </Th>
                          <Th color="gray.500" fontSize="11px" fontWeight="700">
                            Email
                          </Th>
                          <Th color="gray.500" fontSize="11px" fontWeight="700">
                            Membership Type
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {pagedAddMemberOptions.map((member, index) => (
                          <Tr
                            key={member.uniqueId}
                            bg={
                              (index + 1) % 2 === 0
                                ? 'rgba(226,232,240,0.44)'
                                : 'white'
                            }
                          >
                            <Td>
                              <Checkbox
                                isChecked={selectedAddMemberIds.includes(
                                  member.uniqueId,
                                )}
                                onChange={() =>
                                  toggleAddMember(member.uniqueId)
                                }
                              />
                            </Td>
                            <Td>
                              <Text
                                fontSize="xs"
                                fontWeight="700"
                                color="gray.800"
                              >
                                {member.fullName}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="xs" color="gray.600">
                                {member.email}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="xs" color="gray.600">
                                {member.membershipTypeName}
                              </Text>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}

                {filteredAddMemberOptions.length > 0 && (
                  <Pagination
                    currentPage={addMemberPageNo}
                    totalRecords={filteredAddMemberOptions.length}
                    entriesPerPage={ADD_MEMBER_PAGE_SIZE}
                    onPageChange={setAddMemberPageNo}
                    displayedItemsCount={pagedAddMemberOptions.length}
                  />
                )}
              </Box>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button
                size="sm"
                variant="outline"
                borderRadius="lg"
                onClick={() => closeAddMembersModal()}
                isDisabled={isAddingMembers}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                bg="#044bd9"
                color="white"
                borderRadius="lg"
                onClick={confirmAddMembers}
                isDisabled={selectedAddMemberIds.length === 0}
                isLoading={isAddingMembers}
                loadingText="Adding"
                _hover={{ bg: '#0340b8' }}
              >
                Add Members
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal
          isOpen={!!deleteTarget}
          onClose={closeDeleteModal}
          isCentered
          size="md"
        >
          <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
          <ModalContent borderRadius="2xl" px={2} py={3}>
            <ModalHeader pb={2}>
              <Flex align="center" gap={3}>
                <Flex
                  w="40px"
                  h="40px"
                  borderRadius="xl"
                  bg="red.50"
                  color="red.500"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={MdWarningAmber} boxSize={5} />
                </Flex>
                <Text fontSize="lg" fontWeight="800" color="gray.900">
                  Delete custom list
                </Text>
              </Flex>
            </ModalHeader>
            <ModalCloseButton isDisabled={isDeleting} top={4} right={4} />
            <ModalBody pt={1}>
              <Text fontSize="sm" color="gray.600">
                Delete{' '}
                <Text as="span" fontWeight="800" color="gray.800">
                  {deleteTarget?.name}
                </Text>
                ? Its {deleteTarget?.memberCount ?? 0} members will be removed
                from the list. The members themselves are not deleted.
              </Text>
            </ModalBody>
            <ModalFooter gap={3} pt={6}>
              <Button
                minW="108px"
                variant="outline"
                borderRadius="xl"
                onClick={closeDeleteModal}
                isDisabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                minW="136px"
                bg="red.500"
                color="white"
                borderRadius="xl"
                onClick={confirmDelete}
                isLoading={isDeleting}
                loadingText="Deleting"
                _hover={{ bg: 'red.600' }}
                _active={{ bg: 'red.700' }}
              >
                Delete list
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </PermissionGate>
  );
}
