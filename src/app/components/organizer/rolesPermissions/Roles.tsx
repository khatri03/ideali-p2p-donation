import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  HStack,
  IconButton,
  Badge,
  SimpleGrid,
  Collapse,
  useColorModeValue,
  Button,
  Input,
  useToast,
} from '@chakra-ui/react';
import Loader from 'app/components/common/Loader';
import {
  MdOutlineAdminPanelSettings,
  MdPeople,
  MdExpandMore,
  MdExpandLess,
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdFavorite,
  MdDashboard,
  MdEvent,
  MdSettings,
  MdEdit,
} from 'react-icons/md';
import { FiMoreHorizontal } from 'react-icons/fi';
import permissionCatalogService, {
  ModuleCatalog,
  ScreenCatalog,
  PermissionItem,
  RoleListItem,
} from 'app/service/organizer/rolesPermissions/rolesService';
import CreateRoleForm from './CreateRoleForm';

const MODULE_ICONS: Record<string, any> = {
  Donation: MdFavorite,
  Event: MdEvent,
  Dashboard: MdDashboard,
  Settings: MdSettings,
};

const ROLE_COLORS = [
  '#044bd9',
  '#7c3aed',
  '#f59e0b',
  '#ec4899',
  '#10b981',
  '#ef4444',
];

// ─── Section Panel ────────────────────────────────────────────────────────────

function SectionPanel({
  screen,
  grantedIds,
  onToggle,
}: {
  screen: ScreenCatalog;
  grantedIds: Set<number>;
  onToggle: (id: number, screenPerms: PermissionItem[]) => void;
}) {
  const viewPerm = screen.permissions.find(
    (p) => p.action.toLowerCase() === 'view',
  );
  const viewGranted = viewPerm ? grantedIds.has(viewPerm.permissionId) : true;
  const viewFilePerm = screen.permissions.find(
    (p) => p.action.toLowerCase() === 'view file',
  );
  const viewFileGranted = viewFilePerm ? grantedIds.has(viewFilePerm.permissionId) : false;
  const [open, setOpen] = useState(true);
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const subText = useColorModeValue('gray.500', 'gray.400');
  const textColor = useColorModeValue('gray.700', 'white');

  return (
    <Box mb={3}>
      <Flex
        align="center"
        justify="space-between"
        cursor="pointer"
        onClick={() => setOpen((v) => !v)}
        py={2}
        px={3}
        borderRadius="md"
        _hover={{ bg: 'gray.50' }}
      >
        <Text fontSize="sm" fontWeight="semibold" color={textColor}>
          {screen.screenName}
        </Text>
        <Icon as={open ? MdExpandLess : MdExpandMore} color="gray.400" />
      </Flex>

      <Collapse in={open} animateOpacity>
        <SimpleGrid
          columns={{ base: 1, sm: 2, md: 4 }}
          spacing={3}
          mt={2}
          px={2}
        >
          {screen.permissions.map((perm: PermissionItem) => {
            const granted = grantedIds.has(perm.permissionId);
            const isView = perm.action.toLowerCase() === 'view';
            const dependsOnViewFile = !!viewFilePerm && ['approve', 'reject'].includes(perm.action.toLowerCase());
            const disabled = isView ? false : dependsOnViewFile ? !viewFileGranted : !viewGranted;
            return (
              <Box
                key={perm.permissionId}
                borderWidth="1px"
                borderColor={
                  disabled ? borderColor : granted ? 'blue.200' : borderColor
                }
                borderRadius="lg"
                p={3}
                bg={disabled ? 'gray.100' : granted ? 'blue.50' : 'gray.50'}
                position="relative"
                cursor={disabled ? 'not-allowed' : 'pointer'}
                opacity={disabled ? 0.5 : 1}
                onClick={() =>
                  !disabled && onToggle(perm.permissionId, screen.permissions)
                }
                _hover={disabled ? {} : { boxShadow: 'sm' }}
                transition="all 0.15s"
                title={disabled ? (dependsOnViewFile ? 'Grant View File permission first' : 'Grant View permission first') : undefined}
              >
                <Icon
                  as={granted ? MdCheckCircle : MdRadioButtonUnchecked}
                  color={granted ? 'blue.500' : 'gray.300'}
                  boxSize={5}
                  position="absolute"
                  top={2}
                  right={2}
                />
                <Text fontSize="xs" fontWeight="bold" color={textColor} pr={6}>
                  {perm.action}
                </Text>
                <Text fontSize="xs" color={subText} mt={0.5}>
                  {perm.description}
                </Text>
              </Box>
            );
          })}
        </SimpleGrid>
      </Collapse>
    </Box>
  );
}

// ─── Module Panel ─────────────────────────────────────────────────────────────

function ModulePanel({
  mod,
  grantedIds,
  onToggle,
}: {
  mod: ModuleCatalog;
  grantedIds: Set<number>;
  onToggle: (id: number, screenPerms: PermissionItem[]) => void;
}) {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  const ModIcon = MODULE_ICONS[mod.moduleName] ?? MdDashboard;

  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      mb={3}
    >
      <HStack mb={3} spacing={2}>
        <Icon as={ModIcon} color="blue.400" boxSize={4} />
        <Text fontSize="sm" fontWeight="bold" color={textColor}>
          {mod.moduleName}
        </Text>
      </HStack>
      {mod.screens.map((screen) => (
        <SectionPanel
          key={screen.screenName}
          screen={screen}
          grantedIds={grantedIds}
          onToggle={onToggle}
        />
      ))}
    </Box>
  );
}

// ─── Role Row ─────────────────────────────────────────────────────────────────

function RoleRow({
  role,
  colorIndex,
  catalogModules,
}: {
  role: RoleListItem;
  colorIndex: number;
  catalogModules: ModuleCatalog[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [grantedIds, setGrantedIds] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [detailLoaded, setDetailLoaded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState(role.name);

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  const subText = useColorModeValue('gray.500', 'gray.400');
  const rowBg = useColorModeValue('white', 'gray.800');
  const toast = useToast();

  const iconColor = ROLE_COLORS[colorIndex % ROLE_COLORS.length];
  const totalPerms = catalogModules.reduce(
    (sum, mod) =>
      sum + mod.screens.reduce((s, sc) => s + sc.permissions.length, 0),
    0,
  );
  const grantedCount = detailLoaded ? grantedIds.size : role.permissionCount;

  const handleToggle = useCallback(
    (id: number, screenPerms: PermissionItem[]) => {
      if (!editMode) return;
      const viewPerm = screenPerms.find(
        (p) => p.action.toLowerCase() === 'view',
      );
      const viewFilePerm = screenPerms.find(
        (p) => p.action.toLowerCase() === 'view file',
      );
      const isViewPerm = viewPerm?.permissionId === id;
      const isViewFilePerm = viewFilePerm?.permissionId === id;
      const viewFileDependents = viewFilePerm
        ? screenPerms.filter((p) => ['approve', 'reject'].includes(p.action.toLowerCase()))
        : [];
      const isViewFileDependent = viewFileDependents.some((p) => p.permissionId === id);
      setGrantedIds((prev) => {
        const next = new Set(prev);
        if (!next.has(id)) {
          // Enabling: also auto-enable View (and View File, for Approve/Reject) if this isn't already those
          next.add(id);
          if (!isViewPerm && viewPerm) next.add(viewPerm.permissionId);
          if (isViewFileDependent && viewFilePerm) next.add(viewFilePerm.permissionId);
        } else {
          // Disabling View: also remove all other permissions in this screen
          next.delete(id);
          if (isViewPerm)
            screenPerms.forEach((p) => next.delete(p.permissionId));
          // Disabling View File: also remove permissions that depend on it (Approve/Reject)
          if (isViewFilePerm)
            viewFileDependents.forEach((p) => next.delete(p.permissionId));
        }
        return next;
      });
    },
    [editMode],
  );

  const loadDetail = () => {
    setDetailLoading(true);
    permissionCatalogService
      .getRoleDetail(role.roleUniqueId)
      .then((detail) => {
        const ids = new Set(
          detail.modules.flatMap((mod) =>
            mod.screens.flatMap((sc) =>
              sc.permissions.map((p) => p.permissionId),
            ),
          ),
        );
        setGrantedIds(ids);
        setSavedIds(new Set(ids));
        setDetailLoaded(true);
      })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  };

  const handleExpand = () => {
    const opening = !expanded;
    setExpanded(opening);
    if (opening && !detailLoaded) loadDetail();
    if (!opening) setEditMode(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!expanded) {
      setExpanded(true);
      if (!detailLoaded) loadDetail();
    }
    setEditMode(true);
  };

  const handleCancel = () => {
    setGrantedIds(new Set(savedIds));
    setEditName(role.name);
    setEditMode(false);
  };

  const allPermissionIds = catalogModules.flatMap((mod) =>
    mod.screens.flatMap((sc) => sc.permissions.map((p) => p.permissionId)),
  );
  const allSelected =
    allPermissionIds.length > 0 &&
    allPermissionIds.every((id) => grantedIds.has(id));

  const handleSelectAll = () => {
    setGrantedIds(new Set(allPermissionIds));
  };

  const handleDeselectAll = () => {
    setGrantedIds(new Set());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await permissionCatalogService.updateRole(
        role.roleUniqueId,
        {
          name: editName.trim(),
          permissionIds: Array.from(grantedIds),
        },
      );
      if (result.success) {
        setSavedIds(new Set(grantedIds));
        setEditMode(false);
        toast({
          title: 'Role updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to update role',
        description: error?.response?.data?.message || error?.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      mb={3}
    >
      <Flex
        align="center"
        justify="space-between"
        px={5}
        py={4}
        bg={rowBg}
        cursor="pointer"
        _hover={{ bg: 'gray.50' }}
        onClick={handleExpand}
      >
        <HStack spacing={3}>
          <Icon
            as={MdOutlineAdminPanelSettings}
            color={iconColor}
            boxSize={5}
          />
          <Box>
            <HStack spacing={2} align="center">
              {editMode ? (
                <Input
                  size="sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  fontWeight="bold"
                  fontSize="sm"
                  maxLength={20}
                  borderColor="blue.300"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px #4299e1',
                  }}
                  w="180px"
                />
              ) : (
                <Text fontSize="sm" fontWeight="bold" color={textColor}>
                  {editName}
                </Text>
              )}
              <Badge
                fontSize="xs"
                px={2}
                py={0.5}
                borderRadius="md"
                bg="gray.100"
                color="gray.600"
                fontWeight="medium"
              >
                {grantedCount}/{totalPerms}
              </Badge>
            </HStack>
            <Text fontSize="xs" color={subText}>
              {role.permissionCount} permission
              {role.permissionCount !== 1 ? 's' : ''} assigned
            </Text>
          </Box>
        </HStack>

        <HStack spacing={3} onClick={(e) => e.stopPropagation()}>
          <HStack spacing={1}>
            <Icon as={MdPeople} color="gray.400" boxSize={4} />
            <Text fontSize="sm" color={subText}>
              {role.assignedUserCount}
            </Text>
          </HStack>
          <IconButton
            aria-label="Edit permissions"
            icon={<MdEdit />}
            variant="ghost"
            size="sm"
            color={editMode ? 'blue.500' : 'gray.500'}
            _hover={{ bg: 'gray.100' }}
            onClick={handleEdit}
          />
          <IconButton
            aria-label="More"
            icon={<FiMoreHorizontal />}
            variant="ghost"
            size="sm"
            _hover={{ bg: 'gray.100' }}
          />
          <Icon
            as={expanded ? MdExpandLess : MdExpandMore}
            color="gray.400"
            boxSize={5}
            cursor="pointer"
            onClick={handleExpand}
          />
        </HStack>
      </Flex>

      <Collapse in={expanded} animateOpacity>
        <Box borderTopWidth="1px" borderColor={borderColor} bg="gray.50">
          {detailLoading ? (
            <Loader
              message="Loading permissions..."
              subtitle="Fetching role permissions"
            />
          ) : (
            <Box px={5} py={4}>
              {editMode && (
                <Flex
                  align="center"
                  justify="space-between"
                  mb={4}
                  px={3}
                  py={2}
                  bg="blue.50"
                  borderWidth="1px"
                  borderColor="blue.200"
                  borderRadius="md"
                >
                  <Text fontSize="xs" color="blue.600" fontWeight="medium">
                    Click permissions to grant or revoke them
                  </Text>
                  <HStack spacing={2}>
                    <Button
                      size="xs"
                      variant="outline"
                      colorScheme="blue"
                      onClick={
                        allSelected ? handleDeselectAll : handleSelectAll
                      }
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      color="gray.600"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="xs"
                      bg="#044bd9"
                      color="white"
                      _hover={{ bg: '#033fb6' }}
                      isLoading={saving}
                      isDisabled={!editName.trim()}
                      onClick={handleSave}
                    >
                      Save Changes
                    </Button>
                  </HStack>
                </Flex>
              )}
              {catalogModules.length > 0 ? (
                catalogModules.map((mod) => (
                  <ModulePanel
                    key={mod.moduleName}
                    mod={mod}
                    grantedIds={grantedIds}
                    onToggle={handleToggle}
                  />
                ))
              ) : (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                  No permissions configured.
                </Text>
              )}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// ─── Roles List ───────────────────────────────────────────────────────────────

export default function RolesList() {
  const [catalogModules, setCatalogModules] = useState<ModuleCatalog[]>([]);
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  const toast = useToast();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      permissionCatalogService.getPermissionCatalog(),
      permissionCatalogService.getRoleList(),
    ])
      .then(([catalog, roleList]) => {
        const screenOrder = (name: string) => {
          const n = name.toLowerCase();
          if (n.includes('campaign')) return 0;
          if (n.includes('invoice')) return 1;
          if (n.includes('donor')) return 2;
          if (n.includes('recurring')) return 3;
          if (n.includes('archiv')) return 4;
          return 99;
        };

        // Extract Dashboard screens from any module → promote to their own top-level module
        const dashboardScreens: (typeof catalog.modules)[0]['screens'] = [];
        const remaining = catalog.modules
          .map((mod) => ({
            ...mod,
            screens: mod.screens.filter((sc) => {
              if (sc.screenName.toLowerCase().includes('dashboard')) {
                dashboardScreens.push(sc);
                return false;
              }
              return true;
            }),
          }))
          .filter((mod) => mod.screens.length > 0);

        const donationMod = remaining.find(
          (m) => m.moduleName.toLowerCase() === 'donation',
        );
        const otherMods = remaining.filter(
          (m) => m.moduleName.toLowerCase() !== 'donation',
        );

        const sorted: typeof catalog.modules = [
          ...(dashboardScreens.length > 0
            ? [{ moduleName: 'Dashboard', screens: dashboardScreens }]
            : []),
          ...(donationMod
            ? [
                {
                  ...donationMod,
                  screens: [...donationMod.screens].sort(
                    (a, b) =>
                      screenOrder(a.screenName) - screenOrder(b.screenName),
                  ),
                },
              ]
            : []),
          ...otherMods,
        ];
        setCatalogModules(sorted);
        setRoles(roleList.pageData);
      })
      .catch(() =>
        toast({
          title: 'Failed to load roles',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        }),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (showCreate) {
    return (
      <CreateRoleForm
        catalogModules={catalogModules}
        onCancel={() => {
          setShowCreate(false);
          fetchData();
        }}
      />
    );
  }

  return (
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
        px={6}
        py={4}
        bg="white"
        borderBottomWidth="1px"
        borderColor={borderColor}
      >
        <Text fontSize="lg" fontWeight="bold" color={textColor}>
          Roles
        </Text>
        <Button
          leftIcon={<Icon as={MdOutlineAdminPanelSettings} />}
          bg="#044bd9"
          color="white"
          _hover={{ bg: '#033fb6' }}
          size="md"
          fontSize="sm"
          fontWeight="medium"
          onClick={() => setShowCreate(true)}
        >
          Add Role
        </Button>
      </HStack>

      {loading ? (
        <Loader
          message="Loading Roles..."
          subtitle="Please wait while we fetch roles"
        />
      ) : (
        <Box px={5} py={4}>
          {roles.length === 0 ? (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={6}>
              No roles found.
            </Text>
          ) : (
            roles.map((role, i) => (
              <RoleRow
                key={role.roleUniqueId}
                role={role}
                colorIndex={i}
                catalogModules={catalogModules}
              />
            ))
          )}
        </Box>
      )}
    </Box>
  );
}
