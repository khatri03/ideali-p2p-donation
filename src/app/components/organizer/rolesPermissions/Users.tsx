import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Badge,
  IconButton,
  Table,
  Thead,
  Tr,
  Th,
  TableContainer,
  Tabs,
  TabList,
  Tab,
  Icon,
  HStack,
  useColorModeValue,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { MdPeople, MdOutlineAdminPanelSettings, MdEdit } from 'react-icons/md';
import { FiMoreHorizontal } from 'react-icons/fi';
import { ZebraTbody } from 'app/components/common/ZebraTable';
import type { Column } from 'app/components/common/ZebraTable';
import Loader from 'app/components/common/Loader';
import Pagination from '../donation/organizerDonationComponents/Pagination';
import RolesList from './Roles';
import CreateUserModal, { UserModalInitialData } from './CreateUserModal';
import userListService, { UserListItem } from 'app/service/organizer/rolesPermissions/usersService';

// Deterministic avatar color from name initial
const AVATAR_PALETTE = [
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#fce7f3', color: '#be185d' },
  { bg: '#dcfce7', color: '#15803d' },
  { bg: '#fed7aa', color: '#c2410c' },
  { bg: '#ede9fe', color: '#6d28d9' },
  { bg: '#fef9c3', color: '#a16207' },
  { bg: '#fee2e2', color: '#b91c1c' },
];

function getAvatarColors(name: string) {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return displayName.slice(0, 2).toUpperCase();
}

export default function RolesPermissions() {
  const [tabIndex,      setTabIndex]      = useState(0);
  const [users,         setUsers]         = useState<UserListItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [totalRecords,  setTotalRecords]  = useState(0);
  const [addUserOpen,   setAddUserOpen]   = useState(false);
  const [editData,      setEditData]      = useState<UserModalInitialData | null>(null);
  const [modalMode,     setModalMode]     = useState<'create' | 'edit'>('create');
  const entriesPerPage = 50;

  const bgColor     = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor   = useColorModeValue('gray.700', 'white');
  const headerBg    = useColorModeValue('gray.200', 'gray.700');
  const subText     = useColorModeValue('gray.500', 'gray.400');
  const toast       = useToast();

  const fetchUsers = (page = currentPage) => {
    setLoading(true);
    userListService
      .getUserList(page, entriesPerPage)
      .then(data => {
        setUsers(data.pageData);
        setTotalRecords(data.totalRecordsCount);
      })
      .catch(() =>
        toast({ title: 'Failed to load users', status: 'error', duration: 3000, isClosable: true, position: 'top-right' })
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tabIndex === 0) fetchUsers(currentPage);
  }, [tabIndex, currentPage]);

  const handleEdit = async (userId: string) => {
    try {
      const detail = await userListService.getUserDetail(userId);
      setEditData({
        userId:    detail.uniqueId,
        firstName: detail.firstName,
        lastName:  detail.lastName,
        email:     detail.userName,
        roleId:    detail.roles?.[0]?.roleId ?? '',
      });
      setModalMode('edit');
      setAddUserOpen(true);
    } catch {
      toast({ title: 'Failed to load user', status: 'error', duration: 3000, isClosable: true, position: 'top-right' });
    }
  };

  const columns: Column<UserListItem>[] = [
    {
      key: 'displayName',
      header: 'User',
      render: (_val, row) => {
        const initials = getInitials(row.displayName);
        const colors   = getAvatarColors(row.displayName);
        return (
          <HStack spacing={3}>
            <Box
              w="36px" h="36px"
              borderRadius="full"
              bg={colors.bg}
              display="flex" alignItems="center" justifyContent="center"
              flexShrink={0}
            >
              <Text fontSize="xs" fontWeight="bold" color={colors.color}>
                {initials}
              </Text>
            </Box>
            <Box>
              <Text fontWeight="medium" color={textColor}>{row.displayName}</Text>
              <Text fontSize="xs" color={subText}>{row.userName}</Text>
            </Box>
          </HStack>
        );
      },
    },
    {
      key: 'roles',
      header: 'Role',
      render: (_val, row) => (
        <HStack spacing={1} flexWrap="wrap">
          {row.roles.map(r => (
            <Badge
              key={r}
              bg="white"
              color="gray.600"
              borderWidth="1px"
              borderColor="gray.300"
              fontSize="xs"
              px={3} py={1}
              borderRadius="xl"
            >
              {r}
            </Badge>
          ))}
        </HStack>
      ),
    },
    {
      key: 'userId',
      header: 'Actions',
      render: (_val, row) => (
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="More options"
            icon={<FiMoreHorizontal />}
            variant="ghost"
            size="sm"
            color="gray.500"
            _hover={{ bg: 'gray.100' }}
          />
          <MenuList minW="140px" shadow="md" borderRadius="md" py={1}>
            <MenuItem
              icon={<Icon as={MdEdit} boxSize={4} />}
              fontSize="sm"
              onClick={() => handleEdit(row.userId)}
            >
              Edit
            </MenuItem>
          </MenuList>
        </Menu>
      ),
    },
  ];

  return (
    <Box mt={24}>
      {/* Tabs */}
      <Tabs index={tabIndex} onChange={setTabIndex} variant="unstyled" mb={3}>
        <TabList
          bg="gray.200"
          borderRadius="xl"
          p={1}
          display="inline-flex"
          gap={0}
        >
          {[
            { label: 'Users', icon: MdPeople },
            { label: 'Roles', icon: MdOutlineAdminPanelSettings },
          ].map((t, i) => (
            <Tab
              key={t.label}
              px={5} py={1.5}
              borderRadius="xl"
              fontSize="sm"
              fontWeight={tabIndex === i ? 'bold' : 'medium'}
              color={tabIndex === i ? 'gray.800' : 'gray.500'}
              bg={tabIndex === i ? 'white' : 'transparent'}
              boxShadow={tabIndex === i ? 'sm' : 'none'}
              _hover={{ color: 'gray.700' }}
              _focus={{ boxShadow: 'none' }}
            >
              <HStack spacing={1.5}>
                <Icon as={t.icon} boxSize={4} />
                <Text>{t.label}</Text>
              </HStack>
            </Tab>
          ))}
        </TabList>
      </Tabs>

      <CreateUserModal
        isOpen={addUserOpen}
        mode={modalMode}
        initialData={editData ?? undefined}
        onClose={() => { setAddUserOpen(false); setEditData(null); setModalMode('create'); }}
        onCreated={() => { setAddUserOpen(false); setEditData(null); setModalMode('create'); fetchUsers(currentPage); }}
      />

      {/* Roles tab */}
      {tabIndex === 1 && <RolesList />}

      {/* Users tab Card */}
      {tabIndex === 0 && (
        <Box
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          overflow="hidden"
        >
          {/* Header */}
          <HStack
            justify="space-between"
            align="center"
            px={6} py={4}
            bg="white"
            borderBottomWidth="1px"
            borderColor={borderColor}
          >
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              Users 
            </Text>
            <Button
              leftIcon={<MdPeople />}
              bg="#044bd9"
              color="white"
              _hover={{ bg: '#033fb6' }}
              size="md"
              fontSize="sm"
              fontWeight="medium"
              onClick={() => { setModalMode('create'); setEditData(null); setAddUserOpen(true); }}
            >
              Add User
            </Button>
          </HStack>

          {loading ? (
            <Loader message="Loading Users..." subtitle="Please wait while we fetch users" />
          ) : users.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Text color={textColor} fontSize="md">No users found.</Text>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table variant="simple" size="md">
                  <Thead bg={headerBg}>
                    <Tr>
                      {columns.map(col => (
                        <Th
                          key={col.key}
                          fontSize="sm"
                          color="gray.800"
                          textTransform="uppercase"
                          fontWeight="bold"
                        >
                          {col.header}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <ZebraTbody data={users} columns={columns} />
                </Table>
              </TableContainer>

              <Pagination
                currentPage={currentPage}
                totalRecords={totalRecords}
                entriesPerPage={entriesPerPage}
                onPageChange={setCurrentPage}
                displayedItemsCount={users.length}
              />
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
