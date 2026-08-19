import React, { useState } from 'react';
import {
  Badge, Box, Button, Flex, Icon, Input, InputGroup, InputLeftElement,
  Menu, MenuButton, MenuList, MenuItem, Spinner, VStack,
  Table, TableContainer, Text, Th, Thead, Tr,
} from '@chakra-ui/react';
import {
  MdFilterListOff, MdFilterList, MdSearch, MdMoreVert, MdPeople,
} from 'react-icons/md';
import { FaFileCsv, FaFileExcel } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { ZebraTbody } from 'app/components/common/ZebraTable';
import type { Column } from 'app/components/common/ZebraTable';
import Pagination from 'app/components/organizer/donation/organizerDonationComponents/Pagination';
import { ExportButton } from 'app/components/organizer/donation/organizerDonationComponents/ExportButtonProps';
import { ExportConfirmDialog } from 'app/components/organizer/donation/organizerDonationComponents/ExportConfirmDialog';
import Loader from 'app/components/common/Loader';
import { useMembershipMembers, MemberListItem } from './useMembershipMembers';
import MembershipHeroHeader from '../../common/MembershipHeroHeader';
import MultiSelectDropdown from '../../common/MultiSelectDropdown';
import PermissionGate from 'app/components/common/PermissionGate';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';
import membershipMembersService from '../../services/membershipMembersService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  Active:          'green.600',
  Expired:         'red.500',
  Pending:         'orange.500',
  PendingApproval: 'orange.500',
  Cancelled:       'gray.500',
  Inactive:        'gray.400',
  InActive:        'gray.400',
  Rejected:        'red.400',
  Upgraded:        'blue.500',
};

const STATUS_BG: Record<string, string> = {
  Active:          'green.50',
  Expired:         'red.50',
  Pending:         'orange.50',
  PendingApproval: 'orange.50',
  Cancelled:       'gray.100',
  Inactive:        'gray.100',
  InActive:        'gray.100',
  Rejected:        'red.50',
  Upgraded:        'blue.50',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function StatusBadge({ v }: { v: string }) {
  return (
    <Badge
      bg={STATUS_BG[v] ?? 'gray.100'} color={STATUS_COLOR[v] ?? 'gray.500'}
      border="1px solid" borderColor={STATUS_COLOR[v] ?? 'gray.300'}
      borderRadius="md" fontSize="xs" fontWeight="bold" px={2.5} py={1}
    >
      {v}
    </Badge>
  );
}

function MembershipBadge({ v }: { v: string }) {
  return (
    <Badge bg="teal.50" color="teal.700" border="1px solid" borderColor="teal.200"
      borderRadius="md" fontSize="xs" fontWeight="medium" px={2.5} py={1}
    >
      {v}
    </Badge>
  );
}

function EmailBadge({ v }: { v: string }) {
  return (
    <Badge bg="gray.100" color="gray.600" border="1px solid" borderColor="gray.300"
      borderRadius="md" fontSize="xs" fontWeight="medium" px={2.5} py={1} textTransform="none"
    >
      {v}
    </Badge>
  );
}

function ActionMenu({
  row,
  onDetail,
}: {
  row: MemberListItem;
  onDetail: (row: MemberListItem) => void;
}) {
  if (!hasPermission('membership:member:view-file')) return null;

  return (
    <Menu>
      <MenuButton
        as={Box} cursor="pointer" display="inline-flex" alignItems="center"
        p={1.5} borderRadius="full" _hover={{ bg: 'blue.50' }}
      >
        <Icon as={MdMoreVert} boxSize={4} color="gray.500" />
      </MenuButton>
      <MenuList minW="140px" shadow="lg" borderRadius="xl" border="1px solid" borderColor="gray.100" py={1}>
        <MenuItem fontSize="sm" _hover={{ bg: 'blue.50' }} onClick={() => onDetail(row)}>
          Detail
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MembershipMembersPage() {
  const navigate = useNavigate();
  const {
    search, setSearch,
    selectedTypeIds, toggleTypeId, clearTypeIds,
    selectedStatuses, toggleStatus, clearStatuses,
    membershipTypeOptions, typesLoading, handleMembershipTypesOpen,
    statusOptions,
    filtered, totalCount, page, pageSize, isLoading,
    hasActiveFilters,
    appliedSearch, appliedTypeIds, appliedStatuses,
    handleApplyFilter, handleClearFilters, handlePageChange,
  } = useMembershipMembers();

  const openMemberProfile = (member: MemberListItem) => {
    navigate(
      `/organizer/membership/member-profile?uniqueId=${encodeURIComponent(member.uniqueId)}`,
    );
  };

  const canExport = hasPermission('membership:member:export');

  // ── Export ─────────────────────────────────────────────────────────────────
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [pendingExportFormat, setPendingExportFormat] = useState('');

  const handleExport = (exportFormat: string) => {
    setPendingExportFormat(exportFormat);
    setShowExportDialog(true);
  };

  const executeExport = async (exportAll: boolean) => {
    try {
      await membershipMembersService.exportMembers(pendingExportFormat, {
        pageNo: exportAll ? 1 : page,
        pageSize: exportAll ? 5000 : pageSize,
        searchTerm: appliedSearch || undefined,
        membershipTypeUniqueIds: appliedTypeIds.length ? appliedTypeIds : undefined,
        membershipStatuses: appliedStatuses.length ? appliedStatuses : undefined,
      });
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setShowExportDialog(false);
    }
  };

  const canViewMemberFile = hasPermission('membership:member:view-file');

  const columns: Column<MemberListItem>[] = [
    ...(canViewMemberFile ? [{
      key: 'actions',
      header: 'Actions',
      width: '60px',
      render: (_: any, row: MemberListItem) => (
        <ActionMenu row={row} onDetail={openMemberProfile} />
      ),
    }] : []),
    {
      key: 'memberFullName',
      header: 'Member',
      render: (v: string) => (
        <Text fontSize="sm" fontWeight="semibold" color="gray.800">{v}</Text>
      ),
    },
    {
      key: 'activeMembershipName',
      header: 'Active Membership',
      render: (v: string) => <MembershipBadge v={v} />,
    },
    {
      key: 'membershipStatus',
      header: 'Membership Status',
      render: (v: string) => <StatusBadge v={v} />,
    },
    {
      key: 'email',
      header: 'Email',
      render: (v: string) => <EmailBadge v={v} />,
    },
    {
      key: 'membershipExpiryUtc',
      header: 'Membership Expiry',
      render: (v: string | null) => {
        const isExpired = v && new Date(v) < new Date();
        return (
          <Text fontSize="sm" color={isExpired ? 'red.500' : 'gray.600'} fontWeight={isExpired ? 'semibold' : 'normal'}>
            {fmtDate(v)}
          </Text>
        );
      },
    },
  ];

  return (
    <PermissionGate permission="membership:member:view" showAccessDenied>
    <Box minH="100vh" bg="gray.50" pt={16} pb={8}>

      <MembershipHeroHeader
        eyebrow="Membership Members"
        title="Registered members"
        description="Review enrolled members, their active membership, contact email, and expiry date in one place."
      />

      <Box mx={{ base: 2, md: 4 }} mt={4}>

        {/* Filters card */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} mb={4} boxShadow="sm">
          <Flex align="center" justify="space-between" gap={2} mb={4} pb={3} borderBottom="1px solid" borderColor="gray.100">
            <Flex align="center" gap={2}>
              <Flex w="28px" h="28px" borderRadius="md" bg="blue.50" align="center" justify="center" flexShrink={0}>
                <Icon as={MdFilterList} boxSize={4} color="blue.500" />
              </Flex>
              <Text fontSize="md" fontWeight="700" color="gray.800">Filters</Text>
            </Flex>

            {/* Export Buttons */}
            {canExport && (
              <Flex gap={1} align="center" bg="gray.500" borderRadius="md" h="36px" flexShrink={0}>
                <ExportButton
                  icon={FaFileCsv}
                  label="Export CSV"
                  onClick={() => handleExport('Csv')}
                />
                <ExportButton
                  icon={FaFileExcel}
                  label="Export Excel"
                  onClick={() => handleExport('Excel')}
                />
              </Flex>
            )}
          </Flex>

          <Flex gap={3} flexWrap="wrap" mb={4}>
            <Box flex="1" minW="200px">
              <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase" letterSpacing="wider" mb={1.5}>Search</Text>
              <InputGroup size="md">
                <InputLeftElement><Icon as={MdSearch} color="gray.400" /></InputLeftElement>
                <Input
                  placeholder="Name or email…"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  bg="gray.50" borderColor="gray.200" borderRadius="lg"
                  _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
                />
              </InputGroup>
            </Box>

            <Box flex="1" minW="200px">
              <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase" letterSpacing="wider" mb={1.5}>
                Membership Type
                {typesLoading && <Spinner size="xs" ml={2} color="#044bd9" />}
              </Text>
              <MultiSelectDropdown
                options={membershipTypeOptions}
                selected={selectedTypeIds}
                onToggle={toggleTypeId}
                onClear={clearTypeIds}
                placeholder="All membership types"
                onOpen={handleMembershipTypesOpen}
              />
            </Box>

            <Box flex="1" minW="200px">
              <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase" letterSpacing="wider" mb={1.5}>Membership Status</Text>
              <MultiSelectDropdown
                options={statusOptions}
                selected={selectedStatuses}
                onToggle={toggleStatus}
                onClear={clearStatuses}
                placeholder="All statuses"
              />
            </Box>
          </Flex>

          <Flex gap={3} justify="flex-end">
            <Button
              size="sm" variant="outline" borderRadius="lg" px={5}
              borderColor={hasActiveFilters ? 'red.300' : 'gray.300'}
              color={hasActiveFilters ? 'red.500' : 'gray.500'}
              leftIcon={<Icon as={MdFilterListOff} />}
              onClick={handleClearFilters}
              _hover={{ bg: hasActiveFilters ? 'red.50' : 'gray.50' }}
            >
              Clear
            </Button>
            <Button size="sm" bg="#044bd9" color="white" borderRadius="lg" px={6}
              onClick={handleApplyFilter} _hover={{ bg: '#0340b8' }} _active={{ bg: '#02308a' }}
            >
              Apply filter
            </Button>
          </Flex>
        </Box>

        {/* Table / Cards */}
        {isLoading ? (
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={8} boxShadow="sm">
            <Loader message="Loading Members" subtitle="Fetching enrolled member data..." />
          </Box>
        ) : filtered.length === 0 ? (
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm">
            <Flex direction="column" align="center" py={12} gap={2}>
              <Icon as={MdPeople} boxSize={8} color="gray.300" />
              <Text fontSize="sm" color="gray.400">No members found</Text>
            </Flex>
          </Box>
        ) : (
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="hidden" boxShadow="sm">

            {/* Desktop table */}
            <Box display={{ base: 'none', lg: 'block' }}>
              <TableContainer>
                <Table variant="simple" size="md">
                  <Thead bg="gray.200" borderBottom="2px solid" borderColor="gray.100">
                    <Tr>
                      {canViewMemberFile && (
                        <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase" w="60px">Actions</Th>
                      )}
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Member</Th>
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Active Membership</Th>
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Membership Status</Th>
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Email</Th>
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Membership Expiry</Th>
                    </Tr>
                  </Thead>
                  <ZebraTbody data={filtered} columns={columns} />
                </Table>
              </TableContainer>
            </Box>

            {/* Mobile card list */}
            <Box display={{ base: 'block', lg: 'none' }}>
              <VStack spacing={0} divider={<Box h="1px" bg="gray.100" w="full" />}>
                {filtered.map((m) => {
                  const isExpired = m.membershipExpiryUtc && new Date(m.membershipExpiryUtc) < new Date();
                  return (
                    <Box key={m.uniqueId} px={4} py={4} w="full">
                      <Flex justify="space-between" align="flex-start">
                        <Box flex="1" minW={0} mr={2}>
                          <Text fontSize="sm" fontWeight="semibold" color="gray.800" mb={2} noOfLines={1}>
                            {m.memberFullName}
                          </Text>
                          <Flex gap={1.5} flexWrap="wrap" mb={2}>
                            <MembershipBadge v={m.activeMembershipName} />
                            <StatusBadge v={m.membershipStatus} />
                          </Flex>
                          <Flex gap={3} flexWrap="wrap">
                            <Box>
                              <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Email</Text>
                              <EmailBadge v={m.email} />
                            </Box>
                            <Box>
                              <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Expiry</Text>
                              <Text fontSize="xs" color={isExpired ? 'red.500' : 'gray.600'} fontWeight={isExpired ? 'semibold' : 'normal'}>
                                {fmtDate(m.membershipExpiryUtc)}
                              </Text>
                            </Box>
                          </Flex>
                        </Box>
                        <ActionMenu row={m} onDetail={openMemberProfile} />
                      </Flex>
                    </Box>
                  );
                })}
              </VStack>
            </Box>

            {totalCount > 0 && (
              <Pagination
                currentPage={page}
                totalRecords={totalCount}
                entriesPerPage={10}
                displayedItemsCount={filtered.length}
                onPageChange={handlePageChange}
              />
            )}
          </Box>
        )}

      </Box>

      {/* Export Confirmation Dialog */}
      <ExportConfirmDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onConfirm={executeExport}
        titlePlaceholder="members"
      />
    </Box>
    </PermissionGate>
  );
}
