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
  useDisclosure,
} from '@chakra-ui/react';
import {
  MdArrowBack,
  MdArrowDownward,
  MdArrowUpward,
  MdDelete,
  MdFilterList,
  MdMoreVert,
  MdPersonAdd,
  MdSearch,
  MdUnfoldMore,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Pagination from 'app/components/organizer/donation/organizerDonationComponents/Pagination';
import MultiSelectDropdown from '../../common/MultiSelectDropdown';
import {
  CustomListMemberRow,
  MemberSortConfig,
  MemberSortField,
  useCreateCustomList,
} from './useCreateCustomList';
import PermissionGate from 'app/components/common/PermissionGate';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';

function SortIcon({ field, sort }: { field: MemberSortField; sort: MemberSortConfig }) {
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

function MemberCards({
  members,
  selectedMemberIds,
  onToggle,
}: {
  members: CustomListMemberRow[];
  selectedMemberIds: string[];
  onToggle: (memberId: string) => void;
}) {
  return (
    <VStack spacing={0} divider={<Box h="1px" bg="gray.100" w="full" />}>
      {members.map((member) => (
        <Box key={member.uniqueId} px={4} py={4} w="full">
          <Flex align="flex-start" gap={3}>
            <Checkbox
              isChecked={selectedMemberIds.includes(member.uniqueId)}
              onChange={() => onToggle(member.uniqueId)}
              mt={0.5}
            />
            <Box flex="1" minW={0}>
              <Text fontSize="xs" fontWeight="700" color="gray.800" noOfLines={1}>
                {member.fullName}
              </Text>
              <Text fontSize="11px" color="gray.500" noOfLines={1}>
                {member.email}
              </Text>
              <Badge
              mt={2}
                bg="blue.50"
                color="blue.700"
                border="1px solid"
                borderColor="blue.200"
                borderRadius="md"
                px={2.5}
                py={1}
                fontSize="11px"
                fontWeight="medium"
              >
                {member.membershipTypeName}
              </Badge>
            </Box>
          </Flex>
        </Box>
      ))}
    </VStack>
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CreateCustomListPage() {
  const navigate = useNavigate();
  const addMembersModal = useDisclosure();
  const addMembersConfirmModal = useDisclosure();
  const {
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
    members,
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
  } = useCreateCustomList();

  const selectedMembers = members.filter((member) => selectedMemberIds.includes(member.uniqueId));
  const editDisplayedCount = totalRecords;
  const listTitle = listName || 'this list';

  const filteredAddModalMembers = addMemberOptions.filter((member) => {
    const term = memberSearch.trim().toLowerCase();
    if (!term) return true;
    return member.fullName.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term);
  });
  const pagedAddModalMembers = filteredAddModalMembers.slice(
    (addMemberPageNo - 1) * ADD_MEMBER_PAGE_SIZE,
    addMemberPageNo * ADD_MEMBER_PAGE_SIZE,
  );
  const pagedAddModalMemberIds = pagedAddModalMembers.map((member) => member.uniqueId);
  const allAddModalMembersSelected = pagedAddModalMemberIds.length > 0 &&
    pagedAddModalMemberIds.every((id) => addModalSelectedMemberIds.includes(id));

  const closeAddMembersModal = () => {
    addMembersModal.onClose();
    clearAddMemberFilter();
  };

  const saveAddedMembers = async () => {
    await handleAddMembers();
    addMembersConfirmModal.onClose();
    closeAddMembersModal();
  };

  if (isEditMode) {
    return (
      <PermissionGate permission="membership:custom-list:edit" showAccessDenied>
      <Box minH="100vh" bg="gray.50" pt={16} pb={8}>
        <Box mx={{ base: 2, md: 4 }} mt={4}>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Icon as={MdArrowBack} />}
            borderRadius="lg"
            mb={4}
            fontSize="xs"
            fontWeight="700"
            onClick={() => navigate('/organizer/membership/custom-lists')}
          >
            Back to lists
          </Button>

          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm" p={{ base: 4, md: 5 }} mb={4}>
            <Text fontSize="lg" fontWeight="700" color="gray.900" mb={5}>
              {listName || 'Custom list'}
            </Text>
            <Text fontSize="11px" fontWeight="700" color="gray.700" mb={1.5}>
              List name <Text as="span" color="red.500">*</Text>
            </Text>
            <Flex gap={3} align={{ base: 'stretch', md: 'center' }} flexDirection={{ base: 'column', md: 'row' }}>
              <Input
                size="md"
                maxW={{ base: 'full', md: '460px' }}
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                isDisabled={isDetailLoading}
                bg="white"
                borderColor="gray.200"
                borderRadius="xl"
                fontSize="sm"
                _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
              />
              <Button
                size="md"
                borderRadius="xl"
                px={8}
                bg="gray.500"
                color="white"
                fontSize="sm"
                fontWeight="700"
                onClick={handleSaveName}
                isDisabled={!canSaveName}
                isLoading={isSavingName}
                loadingText="Saving"
                _hover={{ bg: 'gray.600' }}
              >
                Save name
              </Button>
            </Flex>
          </Box>

          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm" p={{ base: 4, md: 5 }}>
            <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} flexDirection={{ base: 'column', md: 'row' }} mb={4}>
              <Box>
                <Text fontSize="sm" fontWeight="700" color="gray.800">
                  Members
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Sort any column, search, or remove a member from this list.
                </Text>
              </Box>
              {hasPermission('membership:custom-list:create') && (
                <Button
                  size="md"
                  bg="#5b35ff"
                  color="white"
                  borderRadius="xl"
                  leftIcon={<Icon as={MdPersonAdd} />}
                  fontSize="sm"
                  fontWeight="700"
                  onClick={addMembersModal.onOpen}
                  _hover={{ bg: '#4b2fd6' }}
                >
                  Add members
                </Button>
              )}
            </Flex>

            <Box border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="hidden">
              {checkedMemberIds.length > 0 && (
                <Flex align="center" gap={4} px={4} py={3} borderBottom="1px solid" borderColor="gray.100" flexWrap="wrap">
                  <Text fontSize="sm" fontWeight="800" color="#044bd9">
                    {checkedMemberIds.length} selected
                  </Text>
                  <Button size="sm" variant="ghost" fontSize="sm" fontWeight="500" onClick={clearCheckedMembers}>
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    bg="red.500"
                    color="white"
                    borderRadius="lg"
                    leftIcon={<Icon as={MdDelete} />}
                    fontSize="sm"
                    fontWeight="700"
                    onClick={() => handleRemoveMembers(checkedMemberIds)}
                    isLoading={isRemovingMembers}
                    loadingText="Removing"
                    _hover={{ bg: 'red.600' }}
                  >
                    Remove from list
                  </Button>
                </Flex>
              )}
              <Box bg="gray.50" px={4} py={4}>
                <Text fontSize="sm" fontWeight="800" color="gray.900">
                  {editDisplayedCount} members
                </Text>
              </Box>

              {membersLoading || isDetailLoading ? (
                <Box px={4} py={4}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} h="26px" borderRadius="md" mb={3} />
                  ))}
                </Box>
              ) : selectedMembers.length === 0 ? (
                <Flex minH="140px" align="center" justify="center" px={4} textAlign="center">
                  <Text fontSize="xs" color="gray.500">
                    No selected members found for this list.
                  </Text>
                </Flex>
              ) : (
                <>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="white">
                        <Tr>
                          <Th w="42px"><Checkbox isChecked={allVisibleSelected} onChange={toggleVisibleMembers} /></Th>
                          <Th color="gray.800" fontSize="11px" fontWeight="700" textTransform="none">Actions</Th>
                          {(['fullName', 'email', 'membershipTypeName'] as MemberSortField[]).map((field, index) => {
                            const labels = ['Member', 'Email', 'Membership Type'];
                            return (
                              <Th key={field} color="gray.800" fontSize="11px" fontWeight="700" textTransform="none" cursor="pointer" onClick={() => handleSort(field)}>
                                <Flex align="center">{labels[index]} <SortIcon field={field} sort={sort} /></Flex>
                              </Th>
                            );
                          })}
                          <Th color="gray.800" fontSize="11px" fontWeight="700" textTransform="none">Added</Th>
                          <Th color="gray.800" fontSize="11px" fontWeight="700" textTransform="none">Also In</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {selectedMembers.map((member, index) => (
                          <Tr key={member.uniqueId} bg={(index + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                            <Td>
                              <Checkbox
                                isChecked={checkedMemberIds.includes(member.uniqueId)}
                                onChange={() => toggleCheckedMember(member.uniqueId)}
                              />
                            </Td>
                            <Td>
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  icon={<Icon as={MdMoreVert} />}
                                  aria-label="Member actions"
                                  size="sm"
                                  variant="outline"
                                  borderRadius="full"
                                />
                                <MenuList minW="170px">
                                  <MenuItem
                                    icon={<Icon as={MdDelete} color="red.500" />}
                                    color="red.500"
                                    onClick={() => handleRemoveMembers([member.uniqueId])}
                                  >
                                    Remove from list
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                            <Td><Text fontSize="xs" fontWeight="700" color="gray.800">{member.fullName}</Text></Td>
                            <Td><Text fontSize="xs" color="gray.500">{member.email}</Text></Td>
                            <Td><Text fontSize="xs" color="gray.500">{member.membershipTypeName}</Text></Td>
                            <Td><Text fontSize="xs" color="gray.500">{fmtDate(member.addedOnUtc)}</Text></Td>
                            <Td>
                              <Flex gap={1.5} flexWrap="wrap">
                                {member.alsoIn.length === 0 ? (
                                  <Text fontSize="xs" color="gray.400">-</Text>
                                ) : member.alsoIn.map((listName) => (
                                  <Badge key={listName} borderRadius="full" px={2.5} py={1} fontSize="11px" color="gray.800" bg="gray.100">
                                    {listName}
                                  </Badge>
                                ))}
                              </Flex>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                  {totalRecords > 0 && (
                    <Pagination
                      currentPage={pageNo}
                      totalRecords={totalRecords}
                      entriesPerPage={pageSize}
                      displayedItemsCount={selectedMembers.length}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </Box>
          </Box>
        </Box>

        <Modal isOpen={addMembersModal.isOpen} onClose={closeAddMembersModal} size="4xl" isCentered scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent borderRadius="xl" maxH="85vh">
            <ModalHeader pb={2}>
              <Text fontSize="lg" fontWeight="800" color="gray.900">
                Add Members
              </Text>
              <Text fontSize="xs" fontWeight="400" color="gray.500">
                Adding to {listTitle}. Members already in this list are hidden.
              </Text>
            </ModalHeader>
            <ModalBody>
              <Box mb={4}>
                <Text fontSize="sm" fontWeight="700" color="gray.700" mb={1.5}>
                  Membership Type
                  {membershipTypesLoading && <Spinner size="xs" ml={2} color="#044bd9" />}
                </Text>
                <Flex gap={3} align={{ base: 'stretch', md: 'center' }} flexDirection={{ base: 'column', md: 'row' }}>
                  <Box flex="1">
                    <MultiSelectDropdown
                      options={membershipTypeOptions}
                      selected={selectedMembershipTypeIds}
                      onToggle={toggleMembershipTypeId}
                      onClear={clearMembershipTypeIds}
                      placeholder={membershipTypesLoading ? 'Loading membership types...' : 'All membership types'}
                    />
                  </Box>
                  <Button
                    size="md"
                    bg="#044bd9"
                    color="white"
                    borderRadius="lg"
                    fontSize="sm"
                    fontWeight="700"
                    onClick={() => {
                      clearAddModalSelectedMembers();
                      fetchAddMemberOptions();
                    }}
                    isDisabled={selectedMembershipTypeIds.length === 0 || membershipTypesLoading}
                    _hover={{ bg: '#0340b8' }}
                  >
                    Apply Filter
                  </Button>
                  <Button size="md" variant="outline" borderRadius="lg" fontSize="sm" fontWeight="600" onClick={clearAddMemberFilter}>
                    Clear Filter
                  </Button>
                </Flex>
                <Text fontSize="xs" color="gray.500" mt={3}>
                  Adding to {listTitle}. Members already in this list are hidden.
                </Text>
              </Box>

              <Box border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="hidden">
                <Flex justify="space-between" align="center" gap={3} px={4} py={3} flexWrap="wrap">
                  <InputGroup size="sm" maxW={{ base: 'full', md: '360px' }}>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={MdSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      value={memberSearch}
                      onChange={(e) => {
                        setMemberSearch(e.target.value);
                        setAddMemberPageNo(1);
                      }}
                      placeholder="Search by name or email"
                      bg="gray.50"
                      borderColor="gray.200"
                      borderRadius="lg"
                    />
                  </InputGroup>
                  <Flex gap={2} align="center" bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="lg" px={3} py={2}>
                    <Text fontSize="xs" fontWeight="800" color="gray.800">
                      {filteredAddModalMembers.length} members
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {addModalSelectedMemberIds.length} selected
                    </Text>
                  </Flex>
                </Flex>

                {addMembersLoading ? (
                  <Box px={4} py={4}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} h="28px" borderRadius="md" mb={3} />
                    ))}
                  </Box>
                ) : addMemberOptions.length === 0 ? (
                  <Flex minH="140px" align="center" justify="center" px={4} textAlign="center">
                    <Text fontSize="xs" color="gray.500">
                      Select membership type, then apply filter to load available members.
                    </Text>
                  </Flex>
                ) : (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.100">
                        <Tr>
                          <Th w="42px">
                            <Checkbox
                              isChecked={allAddModalMembersSelected}
                              onChange={() => toggleAllAddModalMembers(pagedAddModalMemberIds)}
                            />
                          </Th>
                          <Th color="gray.500" fontSize="11px" fontWeight="700">Member</Th>
                          <Th color="gray.500" fontSize="11px" fontWeight="700">Email</Th>
                          <Th color="gray.500" fontSize="11px" fontWeight="700">Membership Type</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {pagedAddModalMembers
                          .map((member, index) => (
                            <Tr key={member.uniqueId} bg={(index + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                              <Td>
                                <Checkbox
                                  isChecked={addModalSelectedMemberIds.includes(member.uniqueId)}
                                  onChange={() => toggleAddModalMember(member.uniqueId)}
                                />
                              </Td>
                              <Td><Text fontSize="xs" fontWeight="700" color="gray.800">{member.fullName}</Text></Td>
                              <Td><Text fontSize="xs" color="gray.600">{member.email}</Text></Td>
                              <Td><Text fontSize="xs" color="gray.600">{member.membershipTypeName}</Text></Td>
                            </Tr>
                          ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}

                {filteredAddModalMembers.length > 0 && (
                  <Pagination
                    currentPage={addMemberPageNo}
                    totalRecords={filteredAddModalMembers.length}
                    entriesPerPage={ADD_MEMBER_PAGE_SIZE}
                    onPageChange={setAddMemberPageNo}
                    displayedItemsCount={pagedAddModalMembers.length}
                  />
                )}
              </Box>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button size="sm" variant="outline" borderRadius="lg" onClick={closeAddMembersModal}>
                Cancel
              </Button>
              <Button
                size="sm"
                bg="#044bd9"
                color="white"
                borderRadius="lg"
                onClick={addMembersConfirmModal.onOpen}
                isDisabled={addModalSelectedMemberIds.length === 0}
                _hover={{ bg: '#0340b8' }}
              >
                Add a member
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={addMembersConfirmModal.isOpen} onClose={addMembersConfirmModal.onClose} size="md" isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="2xl" p={2}>
            <ModalHeader>
              <Flex align="center" gap={3}>
                <Icon as={MdPersonAdd} color="#5b35ff" boxSize={5} />
                <Text fontSize="lg" fontWeight="800" color="gray.900">
                  Add member
                </Text>
              </Flex>
            </ModalHeader>
            <ModalBody pt={0}>
              <Text fontSize="sm" color="gray.600">
                Add {addModalSelectedMemberIds.length} member{addModalSelectedMemberIds.length === 1 ? '' : 's'} to{' '}
                <Text as="span" fontWeight="800" color="gray.800">{listTitle}</Text>? You can remove them from the list afterwards.
              </Text>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button size="md" variant="outline" borderRadius="xl" px={8} onClick={addMembersConfirmModal.onClose}>
                Cancel
              </Button>
              <Button
                size="md"
                bg="#5b35ff"
                color="white"
                borderRadius="xl"
                px={8}
                onClick={saveAddedMembers}
                isLoading={isAddingMembers}
                loadingText="Adding"
                _hover={{ bg: '#4b2fd6' }}
              >
                Add member
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
      </PermissionGate>
    );
  }

  return (
    <PermissionGate permission="membership:custom-list:new-custom-list" showAccessDenied>
    <Box minH="100vh" bg="gray.50" pt={16} pb={8}>
      <Box mx={{ base: 2, md: 4 }} mt={4}>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Icon as={MdArrowBack} />}
          borderRadius="lg"
          mb={4}
          fontSize="xs"
          fontWeight="700"
          onClick={() => navigate('/organizer/membership/custom-lists')}
        >
          Back to lists
        </Button>

        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm" overflow="hidden">
          <Box px={{ base: 4, md: 5 }} py={5}>
            <Box mb={5}>
              <Text fontSize="lg" fontWeight="700" color="gray.900">
                {isEditMode ? 'Edit custom list' : 'New custom list'}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Name the list and pick at least one member. List names must be unique within your organization.
              </Text>
            </Box>

            <Box maxW={{ base: 'full', md: '360px' }} mb={6}>
              <Text fontSize="12px" fontWeight="700" color="gray.700" mb={2}>
                List name <Text as="span" color="red.500">*</Text>
              </Text>
              <Input
                size="md"
                h="44px"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="APPNA Voting List"
                isDisabled={isDetailLoading}
                bg="gray.50"
                borderColor="gray.200"
                borderRadius="lg"
                fontSize="sm"
                _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
              />
            </Box>

            <Box borderTop="1px solid" borderColor="gray.100" pt={5}>
              <Text fontSize="sm" fontWeight="700" color="gray.800">
                Members
                <Text as="span" fontSize="11px" fontWeight="500" color="gray.400" ml={2}>
                  Optional - you can add members now or after the list is created.
                </Text>
              </Text>

              <Flex gap={3} align={{ base: 'stretch', md: 'flex-end' }} flexWrap="wrap" mt={3}>
                <Box flex="1" minW="240px">
                  <Text fontSize="12px" fontWeight="700" color="gray.700" mb={2}>
                    Membership type
                    {membershipTypesLoading && <Spinner size="xs" ml={2} color="#044bd9" />}
                  </Text>
                  <Box sx={{ '& > div > div:first-of-type': { minH: '44px', py: 2 } }}>
                    <MultiSelectDropdown
                      options={membershipTypeOptions}
                      selected={selectedMembershipTypeIds}
                      onToggle={toggleMembershipTypeId}
                      onClear={clearMembershipTypeIds}
                      placeholder={membershipTypesLoading ? 'Loading membership types...' : 'Select membership type'}
                    />
                  </Box>
                </Box>
                <Button
                  size="sm"
                  h="44px"
                  minH="44px"
                  bg="#044bd9"
                  color="white"
                  borderRadius="lg"
                  px={6}
                  fontSize="xs"
                  fontWeight="700"
                  onClick={handleApplyMemberFilter}
                  isDisabled={selectedMembershipTypeIds.length === 0 || membershipTypesLoading}
                  _hover={{ bg: '#0340b8' }}
                  _active={{ bg: '#02308a' }}
                >
                  Apply Filter
                </Button>
                <Button
                  size="sm"
                  h="44px"
                  minH="44px"
                  variant="outline"
                  borderRadius="lg"
                  fontSize="xs"
                  fontWeight="700"
                  onClick={handleClearMemberFilter}
                >
                  Clear
                </Button>
              </Flex>
              <Text fontSize="11px" color="gray.400" mt={1.5}>
                Members load only after you apply a membership type filter.
              </Text>
            </Box>

            <Box mt={5} border="1px solid" borderColor="gray.200" borderRadius="lg" overflow="hidden">
              <Flex justify="space-between" align="center" gap={3} px={4} py={3} flexWrap="wrap">
                <Flex gap={3} align="center">
                  <Text fontSize="xs" fontWeight="700" color="gray.800">
                    {totalRecords} members
                  </Text>
                  <Text fontSize="11px" color="gray.400">
                    {selectedMemberIds.length} selected
                  </Text>
                </Flex>
                <InputGroup size="sm" maxW={{ base: 'full', md: '280px' }}>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={MdSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Filter by name or email"
                    bg="gray.50"
                    borderColor="gray.200"
                    borderRadius="md"
                  />
                </InputGroup>
              </Flex>

              {membersLoading ? (
                <Box px={4} py={4}>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.100">
                        <Tr>
                          {Array.from({ length: 4 }).map((_, index) => (
                            <Th key={index}>
                              <Skeleton h="14px" borderRadius="md" />
                            </Th>
                          ))}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {Array.from({ length: 6 }).map((_, rowIndex) => (
                          <Tr key={rowIndex}>
                            {Array.from({ length: 4 }).map((__, cellIndex) => (
                              <Td key={cellIndex}>
                                <Skeleton h="16px" borderRadius="md" />
                              </Td>
                            ))}
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : members.length === 0 ? (
                <Flex minH="160px" align="center" justify="center" px={4} textAlign="center">
                  <Text fontSize="xs" color="gray.500">
                    {appliedMembershipTypeIds.length > 0
                      ? 'No members found for the selected membership type.'
                      : 'Select a membership type, then press Apply Filter to load members.'}
                  </Text>
                </Flex>
              ) : (
                <>
                  <Box display={{ base: 'none', lg: 'block' }}>
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead bg="gray.100">
                          <Tr>
                            <Th w="48px">
                              <Checkbox isChecked={allVisibleMembersSelected} onChange={toggleAllVisibleMembers} />
                            </Th>
                            {(['fullName', 'email', 'membershipTypeName'] as MemberSortField[]).map((field, index) => {
                              const labels = ['Member', 'Email', 'Membership Type'];
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
                                >
                                  <Flex align="center">
                                    {labels[index]} <SortIcon field={field} sort={sort} />
                                  </Flex>
                                </Th>
                              );
                            })}
                          </Tr>
                        </Thead>
                        <Tbody>
                          {members.map((member, index) => (
                            <Tr key={member.uniqueId} bg={(index + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                              <Td>
                                <Checkbox
                                  isChecked={selectedMemberIds.includes(member.uniqueId)}
                                  onChange={() => toggleMember(member.uniqueId)}
                                />
                              </Td>
                              <Td>
                                <Text fontSize="xs" color="gray.800" fontWeight="700">
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
                  </Box>

                  <Box display={{ base: 'block', lg: 'none' }}>
                    <MemberCards members={members} selectedMemberIds={selectedMemberIds} onToggle={toggleMember} />
                  </Box>
                </>
              )}

              {totalRecords > 0 && (
                <Pagination
                  currentPage={pageNo}
                  totalRecords={totalRecords}
                  entriesPerPage={pageSize}
                  displayedItemsCount={members.length}
                  onPageChange={handlePageChange}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Flex justify="space-between" mt={5} gap={3}>
          <Button size="sm" variant="outline" borderRadius="lg" fontSize="xs" fontWeight="700" onClick={() => navigate('/organizer/membership/custom-lists')}>
            Cancel
          </Button>
          <Button
            size="sm"
            bg="#044bd9"
            color="white"
            borderRadius="lg"
            px={6}
            fontSize="xs"
            fontWeight="700"
            onClick={handleCreateList}
            isDisabled={!canCreate}
            isLoading={isCreating}
            loadingText="Creating"
            _hover={{ bg: '#0340b8' }}
            _active={{ bg: '#02308a' }}
          >
            {isEditMode ? 'Update list' : 'Create list'}
          </Button>
        </Flex>
      </Box>
    </Box>
    </PermissionGate>
  );
}
