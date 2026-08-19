import React, { useState, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  HStack,
  SimpleGrid,
  Collapse,
  useColorModeValue,
  Button,
  Input,
  FormControl,
  FormLabel,
  Divider,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react';
import {
  MdOutlineAdminPanelSettings,
  MdExpandMore,
  MdExpandLess,
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdFavorite,
  MdDashboard,
  MdEvent,
  MdSettings,
} from 'react-icons/md';
import permissionCatalogService from 'app/service/organizer/rolesPermissions/rolesService';
import type { ModuleCatalog, ScreenCatalog, PermissionItem } from 'app/service/organizer/rolesPermissions/rolesService';

const MODULE_ICONS: Record<string, any> = {
  Donation: MdFavorite,
  Event: MdEvent,
  Dashboard: MdDashboard,
  Settings: MdSettings,
};

// ─── Screen Section ───────────────────────────────────────────────────────────

function ScreenSection({
  screen,
  grantedIds,
  onToggle,
}: {
  screen: ScreenCatalog;
  grantedIds: Set<number>;
  onToggle: (id: number, screenPerms: PermissionItem[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const subText     = useColorModeValue('gray.500', 'gray.400');
  const textColor   = useColorModeValue('gray.700', 'white');

  const viewPerm    = screen.permissions.find(p => p.action.toLowerCase() === 'view');
  const viewGranted = viewPerm ? grantedIds.has(viewPerm.permissionId) : true;

  const viewFilePerm    = screen.permissions.find(p => p.action.toLowerCase() === 'view file');
  const viewFileGranted = viewFilePerm ? grantedIds.has(viewFilePerm.permissionId) : false;

  return (
    <Box mb={4}>
      {/* Screen header — dropdown style */}
      <Flex
        align="center"
        justify="space-between"
        cursor="pointer"
        onClick={() => setOpen(v => !v)}
        px={3} py={2}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        bg="white"
        _hover={{ bg: 'gray.50' }}
      >
        <Text fontSize="sm" fontWeight="medium" color={textColor}>
          {screen.screenName}
        </Text>
        <Icon as={open ? MdExpandLess : MdExpandMore} color="gray.400" boxSize={4} />
      </Flex>

      <Collapse in={open} animateOpacity>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3} mt={3}>
          {screen.permissions.map((perm: PermissionItem) => {
            const granted  = grantedIds.has(perm.permissionId);
            const isView   = perm.action.toLowerCase() === 'view';
            const dependsOnViewFile = !!viewFilePerm && ['approve', 'reject'].includes(perm.action.toLowerCase());
            const disabled = isView ? false : dependsOnViewFile ? !viewFileGranted : !viewGranted;
            return (
              <Box
                key={perm.permissionId}
                borderWidth="1px"
                borderColor={disabled ? borderColor : granted ? 'blue.300' : borderColor}
                borderRadius="lg"
                p={3}
                bg={disabled ? 'gray.100' : granted ? '#eef3ff' : 'gray.50'}
                position="relative"
                cursor={disabled ? 'not-allowed' : 'pointer'}
                opacity={disabled ? 0.5 : 1}
                onClick={() => !disabled && onToggle(perm.permissionId, screen.permissions)}
                _hover={disabled ? {} : { boxShadow: 'sm' }}
                transition="all 0.15s"
                title={disabled ? (dependsOnViewFile ? 'Grant View File permission first' : 'Grant View permission first') : undefined}
              >
                <HStack spacing={2} mb={1}>
                  <Icon
                    as={granted ? MdCheckCircle : MdRadioButtonUnchecked}
                    color={granted ? 'blue.500' : 'gray.300'}
                    boxSize={5}
                    flexShrink={0}
                  />
                  <Text fontSize="xs" fontWeight="bold" color={textColor}>
                    {perm.action}
                  </Text>
                </HStack>
                <Text fontSize="xs" color={subText} pl={7}>
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

// ─── Module Section ───────────────────────────────────────────────────────────

function ModuleSection({
  mod,
  grantedIds,
  onToggle,
}: {
  mod: ModuleCatalog;
  grantedIds: Set<number>;
  onToggle: (id: number, screenPerms: PermissionItem[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor   = useColorModeValue('gray.700', 'white');
  const ModIcon     = MODULE_ICONS[mod.moduleName] ?? MdDashboard;
  

  return (
    <Box mb={4}>
      {/* Module header */}
      <Flex
        align="center"
        justify="space-between"
        cursor="pointer"
        onClick={() => setOpen(v => !v)}
        py={3}
      >
        <HStack spacing={2}>
          <Icon as={ModIcon} color="blue.400" boxSize={5} />
          <Text fontSize="md" fontWeight="semibold" color={textColor}>
            {mod.moduleName}
          </Text>
        </HStack>
        <Icon as={open ? MdExpandLess : MdExpandMore} color="gray.400" boxSize={5} />
      </Flex>

      <Collapse in={open} animateOpacity>
        <Box pl={2}>
          {mod.screens.map(screen => (
            <ScreenSection
              key={screen.screenName}
              screen={screen}
              grantedIds={grantedIds}
              onToggle={onToggle}
            />
          ))}
        </Box>
      </Collapse>

      <Divider mt={2} />
    </Box>
  );
}

// ─── Create Role Form ─────────────────────────────────────────────────────────

interface CreateRoleFormProps {
  catalogModules: ModuleCatalog[];
  onCancel: () => void;
}

export default function CreateRoleForm({ catalogModules, onCancel }: CreateRoleFormProps) {
  const [roleName,    setRoleName]    = useState('');
  const [description, setDescription] = useState('');
  const [grantedIds,  setGrantedIds]  = useState<Set<number>>(new Set());
  const [submitting,  setSubmitting]  = useState(false);


  const bgColor     = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor   = useColorModeValue('gray.700', 'white');
  const subText     = useColorModeValue('gray.500', 'gray.400');
  const toast       = useToast();

    const [touched, setTouched] = useState({ roleName: false, description: false });

const errors = {
  roleName:    !roleName.trim()           ? 'Role name is required'              :
               roleName.trim().length > 20 ? 'Role name must be max 20 characters' : '',
  description: description.length > 70    ? 'Description must be max 70 characters' : '',
};

const isValid = !Object.values(errors).some(Boolean);


  const allPermissionIds = catalogModules.flatMap(mod =>
    mod.screens.flatMap(sc => sc.permissions.map(p => p.permissionId))
  );
  const allSelected = allPermissionIds.length > 0 && allPermissionIds.every(id => grantedIds.has(id));

  const handleSelectAll = () => setGrantedIds(new Set(allPermissionIds));
  const handleDeselectAll = () => setGrantedIds(new Set());

  const handleToggle = useCallback((id: number, screenPerms: PermissionItem[]) => {
    const viewPerm     = screenPerms.find(p => p.action.toLowerCase() === 'view');
    const viewFilePerm = screenPerms.find(p => p.action.toLowerCase() === 'view file');
    const isViewPerm     = viewPerm?.permissionId === id;
    const isViewFilePerm = viewFilePerm?.permissionId === id;
    const viewFileDependents = viewFilePerm
      ? screenPerms.filter(p => ['approve', 'reject'].includes(p.action.toLowerCase()))
      : [];
    const isViewFileDependent = viewFileDependents.some(p => p.permissionId === id);
    setGrantedIds(prev => {
      const next = new Set(prev);
      if (!next.has(id)) {
        next.add(id);
        if (!isViewPerm && viewPerm) next.add(viewPerm.permissionId);
        if (isViewFileDependent && viewFilePerm) next.add(viewFilePerm.permissionId);
      } else {
        next.delete(id);
        if (isViewPerm) screenPerms.forEach(p => next.delete(p.permissionId));
        if (isViewFilePerm) viewFileDependents.forEach(p => next.delete(p.permissionId));
      }
      return next;
    });
  }, []);

  const handleCreate = async () => {
    setTouched({ roleName: true, description: true });
  if (!isValid) return; 
    setSubmitting(true);
    try {
      const result = await permissionCatalogService.createRole({
        name: roleName.trim(),
        permissionIds: Array.from(grantedIds),
      });
      if (result.success) {
        toast({
          title: 'Role created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
        onCancel(); // return to roles list
      } else {
        throw new Error(result.message || 'Failed to create role');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to create role',
        description: error?.response?.data?.message || error?.message || 'Something went wrong',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
    >
      {/* Form header */}
      <Box px={6} py={5} borderBottomWidth="1px" borderColor={borderColor}>
        <HStack spacing={2} mb={1}>
          <Icon as={MdOutlineAdminPanelSettings} color="blue.500" boxSize={5} />
          <Text fontSize="lg" fontWeight="bold" color={textColor}>
            Create New Role
          </Text>
        </HStack>
        <Text fontSize="sm" color={subText}>
          Define a new role with specific permissions
        </Text>
      </Box>

      {/* Form body */}
      <Box px={6} py={5}>
        {/* Role name + description row */}
        <HStack spacing={4} mb={6} align="flex-start">
         <FormControl flex={1} isInvalid={touched.roleName && !!errors.roleName}>
  <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>
    Role Name <Text as="span" color="red.500">*</Text>
  </FormLabel>
  <Input
    placeholder="e.g., Content Manager"
    value={roleName}
    onChange={e => setRoleName(e.target.value)}
    onBlur={() => setTouched(t => ({ ...t, roleName: true }))}
    borderColor={borderColor}
    _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299e1' }}
    fontSize="sm"
    maxLength={20}
  />
  <FormErrorMessage fontSize="xs">{errors.roleName}</FormErrorMessage>
</FormControl>

<FormControl flex={1} isInvalid={touched.description && !!errors.description}>
  <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>
    Description
  </FormLabel>
  <Input
    placeholder="Brief description of this role"
    value={description}
    onChange={e => setDescription(e.target.value)}
    onBlur={() => setTouched(t => ({ ...t, description: true }))}
    borderColor={borderColor}
    _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299e1' }}
    fontSize="sm"
    maxLength={70}
  />
  <FormErrorMessage fontSize="xs">{errors.description}</FormErrorMessage>
</FormControl>
        </HStack>

        {/* Permission catalog */}
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontSize="sm" fontWeight="medium" color={textColor}>Permissions</Text>
          <Button
            size="xs"
            variant="outline"
            colorScheme="blue"
            onClick={allSelected ? handleDeselectAll : handleSelectAll}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
        </Flex>
        {catalogModules.map(mod => (
          <ModuleSection
            key={mod.moduleName}
            mod={mod}
            grantedIds={grantedIds}
            onToggle={handleToggle}
          />
        ))}

        {/* Action buttons */}
        <Flex justify="flex-end" mt={6} gap={3}>
          <Button
            variant="ghost"
            color={textColor}
            _hover={{ bg: 'gray.100' }}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            leftIcon={<Icon as={MdOutlineAdminPanelSettings} />}
            bg="#044bd9"
            color="white"
            _hover={{ bg: '#033fb6' }}
          isDisabled={touched.roleName && !isValid}
            isLoading={submitting}
            onClick={handleCreate}
          >
            + Create Role
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
