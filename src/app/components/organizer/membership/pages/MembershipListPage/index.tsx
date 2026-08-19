import React from 'react'; // eslint-disable-line
import {
  Badge, Box, Button, Flex, Icon, IconButton, Input, InputGroup,
  InputLeftElement, Menu, MenuButton, MenuDivider, MenuGroup, MenuItem,
  MenuList, Skeleton, Table, TableContainer, Tbody, Td, Text, Th, Thead,
  Tr, VStack, useDisclosure,
} from '@chakra-ui/react';
import {
  MdAdd, MdCheck, MdClose, MdDelete, MdEdit, MdMoreVert, MdQrCode2, MdSearch,
} from 'react-icons/md';
import { FaFileCsv, FaFileExcel } from 'react-icons/fa';
import Pagination from 'app/components/organizer/donation/organizerDonationComponents/Pagination';
import { ExportButton } from 'app/components/organizer/donation/organizerDonationComponents/ExportButtonProps';
import { useExportHandler } from 'app/components/organizer/donation/organizerDonationComponents/useExportHandler';
import { ExportConfirmDialog } from 'app/components/organizer/donation/organizerDonationComponents/ExportConfirmDialog';
import { useMembershipList } from './useMembershipList';
import MembershipHeroHeader from '../../common/MembershipHeroHeader';
import MembersSubMenu from './MembersSubMenu';
import StatusSubMenu from './StatusSubMenu';
import EmptyState from './EmptyState';
import MembershipQRModal from './MembershipQRModal';
import { MembershipListItem } from '../../types';
import membershipService from '../../services/membershipService';
import PermissionGate from 'app/components/common/PermissionGate';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';

export default function MembershipListPage() {
  const {
    filtered, isLoading, search, setSearch, appliedSearch,
    handleCreate, handleEdit, handleAddMember, handleStatusChanged,
    pageNo, pageSize, pageCount, totalRecords, goToPage,
  } = useMembershipList();

  const { showExportDialog, handleExport, executeExport, closeExportDialog } =
    useExportHandler({
      currentPage: pageNo,
      entriesPerPage: pageSize,
      searchQuery: appliedSearch,
      archived: false,
      exportServiceFn: membershipService.exportMembershipTypeList,
    });

  const { isOpen: isQrOpen, onOpen: onQrOpen, onClose: onQrClose } = useDisclosure();
  const [qrMembership, setQrMembership] = React.useState<{ id: string; name: string } | null>(null);

  const handleShareQr = (id: string, name: string) => {
    setQrMembership({ id, name });
    onQrOpen();
  };

  const canCreate = hasPermission('membership:membershiptype:create');
  const canExport = hasPermission('membership:membershiptype:export');

  return (
    <PermissionGate permission="membership:membershiptype:type-view" showAccessDenied>
    <Box minH="100vh" bg="gray.50" pt={16}>

      <MembershipHeroHeader
        eyebrow="Membership Management"
        title="Membership Types"
        description="Design plans that fit how your members give. Configure pricing, branding, questions and more — all in one place."
        action={
          canCreate ? (
            <Button
              leftIcon={<Icon as={MdAdd} />} bg="white" color="blue.600"
              fontWeight="semibold" size="md" borderRadius="lg" boxShadow="md"
              w={{ base: 'full', md: 'auto' }}
              _hover={{ bg: 'blue.50', transform: 'translateY(-1px)', boxShadow: 'lg' }}
              transition="all 0.2s" onClick={handleCreate}
            >
              Create Type
            </Button>
          ) : undefined
        }
      />

      {/* Search + list */}
      <Box mx={{ base: 2, md: 4 }} mt={4} bg="white" borderRadius="xl"
        boxShadow="0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" overflow="hidden"
      >
        {/* Search bar */}
        <Flex px={4} py={3} align="center" justify="space-between" gap={3} borderBottomWidth="1px" borderColor="gray.100">
          <InputGroup size="sm" maxW={{ base: 'full', md: '320px' }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={MdSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search membership types..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              borderRadius="lg" bg="gray.50" borderColor="gray.200"
              _focus={{ borderColor: 'blue.400', bg: 'white' }}
            />
          </InputGroup>

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

        {/* Desktop table */}
        <Box display={{ base: 'none', md: 'block' }}>
          <TableContainer>
            <Table variant="simple" size="md">
              <Thead bg="gray.200">
                <Tr>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase" w="70px">Actions</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Membership Type</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Pricing</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Signup</Th>
                  <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Tenure</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Tr key={i} bg={(i + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <Td key={j}><Skeleton h="16px" borderRadius="md" /></Td>
                      ))}
                    </Tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((m, i) => (
                    <Tr key={m.uniqueId} bg={(i + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                      <Td>
                        <ActionMenu m={m} onEdit={handleEdit} onAddMember={handleAddMember} onStatusChanged={handleStatusChanged} onShareQr={handleShareQr} />
                      </Td>
                      <Td>
                        <Text fontWeight="semibold" fontSize="sm" color="gray.800" mb={1}>{m.name}</Text>
                        <Flex gap={1} flexWrap="wrap"><StatusBadges m={m} /></Flex>
                      </Td>
                      <Td>
                        <PricingCell m={m} />
                      </Td>
                      <Td>
                        <Badge
                          bg={m.availableForSignUp ? 'green.50' : 'gray.100'}
                          color={m.availableForSignUp ? 'green.700' : 'gray.500'}
                          border="1px solid"
                          borderColor={m.availableForSignUp ? 'green.300' : 'gray.300'}
                          borderRadius="md" px={2.5} py={1} fontSize="xs" fontWeight="bold"
                          display="inline-flex" alignItems="center" gap={1}
                        >
                          <Icon as={m.availableForSignUp ? MdCheck : MdClose} boxSize={3} />
                          {m.availableForSignUp ? 'Yes' : 'No'}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.700" fontWeight="medium">{m.tenureText ?? '—'}</Text>
                        {m.annualExpiryMonth && m.annualExpiryDay && (
                          <Text fontSize="xs" color="gray.400" mt={0.5}>
                            🗓 Renewal due on {m.annualExpiryDay}-{new Date(2000, m.annualExpiryMonth - 1).toLocaleString('en', { month: 'short' })}
                          </Text>
                        )}
                      </Td>
                    </Tr>
                  ))
                ) : null}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        {/* Mobile card list */}
        <Box display={{ base: 'block', md: 'none' }}>
          {isLoading ? (
            <VStack spacing={0} divider={<Box h="1px" bg="gray.100" w="full" />}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Box key={i} px={4} py={4} w="full">
                  <Skeleton h="16px" mb={2} borderRadius="md" />
                  <Skeleton h="12px" w="60%" borderRadius="md" />
                </Box>
              ))}
            </VStack>
          ) : filtered.length > 0 ? (
            <VStack spacing={0} divider={<Box h="1px" bg="gray.100" w="full" />}>
              {filtered.map((m) => (
                <Box key={m.uniqueId} px={4} py={4} w="full">
                  <Flex justify="space-between" align="flex-start">
                    <Box flex="1" minW={0} mr={2}>
                      <Text fontWeight="semibold" fontSize="sm" color="gray.800" mb={1} noOfLines={1}>{m.name}</Text>
                      <Flex gap={1} flexWrap="wrap" mb={2}><StatusBadges m={m} /></Flex>
                      <Flex gap={4} flexWrap="wrap">
                        <Box>
                          <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Pricing</Text>
                          <PricingCell m={m} small />
                        </Box>
                        <Box>
                          <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Signup</Text>
                          <Badge
                            bg={m.availableForSignUp ? 'green.50' : 'gray.100'}
                            color={m.availableForSignUp ? 'green.700' : 'gray.500'}
                            border="1px solid"
                            borderColor={m.availableForSignUp ? 'green.300' : 'gray.300'}
                            borderRadius="md" px={2.5} py={1} fontSize="xs" fontWeight="semibold"
                          >
                            {m.availableForSignUp ? '✓ Yes' : '✗ No'}
                          </Badge>
                        </Box>
                        <Box>
                          <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Tenure</Text>
                          <Text fontSize="xs" color="gray.700" fontWeight="medium">{m.tenureText ?? '—'}</Text>
                        </Box>
                      </Flex>
                    </Box>
                    <ActionMenu m={m} onEdit={handleEdit} onAddMember={handleAddMember} onStatusChanged={handleStatusChanged} onShareQr={handleShareQr} isMobile />
                  </Flex>
                </Box>
              ))}
            </VStack>
          ) : null}
        </Box>

        {!isLoading && filtered.length === 0 && (
          search.trim()
            ? (
              <Flex direction="column" align="center" justify="center" py={16} gap={2}>
                <Text fontSize="md" fontWeight="semibold" color="gray.600">No results found</Text>
                <Text fontSize="sm" color="gray.400">No membership types match &ldquo;{search}&rdquo;</Text>
              </Flex>
            )
            : <EmptyState onCreateClick={handleCreate} canCreate={canCreate} />
        )}

        {/* Pagination */}
        {!isLoading && totalRecords > 0 && (
          <Pagination
            currentPage={pageNo}
            totalRecords={totalRecords}
            entriesPerPage={pageSize}
            onPageChange={goToPage}
            displayedItemsCount={filtered.length}
          />
        )}
      </Box>

      {/* Export Confirmation Dialog */}
      <ExportConfirmDialog
        isOpen={showExportDialog}
        onClose={closeExportDialog}
        onConfirm={executeExport}
        titlePlaceholder="membership types"
      />

      {/* Share via QR Code Modal */}
      <MembershipQRModal
        isOpen={isQrOpen}
        onClose={onQrClose}
        membershipId={qrMembership?.id ?? ''}
        membershipName={qrMembership?.name ?? ''}
      />
    </Box>
    </PermissionGate>
  );
}

// ─── Local presentational components ─────────────────────────────────────────

function StatusBadges({ m }: { m: MembershipListItem }) {
  return (
    <>
      {m.setupState === 'Published' && (
        <Badge bg="green.50" color="green.700" border="1px solid" borderColor="green.300"
          borderRadius="md" fontSize="xs" fontWeight="bold" px={2.5} py={1}
          display="inline-flex" alignItems="center" gap={1}
        >
          <Box as="span" w="5px" h="5px" borderRadius="full" bg="green.500" display="inline-block" mr={1} flexShrink={0} />
          LIVE
        </Badge>
      )}
      {m.setupState === 'Draft' && (
        <Badge bg="orange.50" color="orange.700" border="1px solid" borderColor="orange.300"
          borderRadius="md" fontSize="xs" fontWeight="semibold" px={2.5} py={1}
        >
          Draft
        </Badge>
      )}
      {m.setupState === 'ReadyForReview' && (
        <Badge bg="purple.50" color="purple.700" border="1px solid" borderColor="purple.300"
          borderRadius="md" fontSize="xs" fontWeight="semibold" px={2.5} py={1}
        >
          Ready for Review
        </Badge>
      )}
      {m.paymentMerchant && (
        <Badge bg="blue.50" color="blue.700" border="1px solid" borderColor="blue.200"
          borderRadius="md" fontSize="xs" fontWeight="semibold" px={2.5} py={1}
        >
          {m.paymentMerchant}
        </Badge>
      )}
      {m.paymentCurrencyCode && (
        <Badge bg="gray.100" color="gray.700" border="1px solid" borderColor="gray.300"
          borderRadius="md" fontSize="xs" fontWeight="semibold" px={2.5} py={1}
        >
          {m.paymentCurrencyCode}
        </Badge>
      )}
    </>
  );
}

function PricingCell({ m, small }: { m: MembershipListItem; small?: boolean }) {
  const size = small ? 'xs' : 'sm';
  if (m.isFree) return <Text fontSize={size} fontWeight="semibold" color="gray.800">Free</Text>;
  if (m.membershipCharges > 0) return <Text fontSize={size} fontWeight="semibold" color="gray.800">{m.paymentCurrencyCode ?? ''}{m.membershipCharges}.00</Text>;
  return <Text fontSize={size} color="gray.400">—</Text>;
}

function ActionMenu({
  m, onEdit, onAddMember, onStatusChanged, onShareQr, isMobile = false,
}: {
  m: MembershipListItem;
  onEdit: (id: string) => void;
  onAddMember: (id: string) => void;
  onStatusChanged: (id: string, newStatus: boolean) => void;
  onShareQr: (id: string, name: string) => void;
  isMobile?: boolean;
}) {
  const canEdit = hasPermission('membership:membershiptype:edit');
  const canViewMembers = hasPermission('membership:member:view');

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        icon={<Icon as={MdMoreVert} />}
        variant="ghost" size="sm" borderRadius="full"
        aria-label="Actions"
        flexShrink={isMobile ? 0 : undefined}
        _hover={{ bg: 'blue.50', color: 'blue.500' }}
      />
      <MenuList minW="180px" shadow="xl" borderRadius="xl" border="1px solid" borderColor="gray.100" py={2} overflow="hidden">
        {m.setupState === 'Published' && (
          <>
            <MembersSubMenu
              membershipId={m.uniqueId}
              onAddMember={() => onAddMember(m.uniqueId)}
              canViewActiveMembers={canViewMembers}
            />
            <MenuDivider my={1} />
          </>
        )}
        <MenuItem
          icon={<Icon as={MdQrCode2} color={m.availableForSignUp ? 'purple.500' : 'gray.400'} />}
          fontSize="sm" fontWeight="medium"
          isDisabled={!m.availableForSignUp}
          _hover={{ bg: 'purple.50' }}
          _disabled={{ color: 'gray.400', opacity: 1, cursor: 'not-allowed' }}
          onClick={() => onShareQr(m.uniqueId, m.name)}
        >
          Share via QR code
        </MenuItem>
        <MenuDivider my={1} />
        {(m.setupState === 'Published' || m.setupState === 'ReadyForReview') && (
          <>
            <StatusSubMenu membershipId={m.uniqueId} currentStatus={m.availableForSignUp} onStatusChanged={onStatusChanged} />
            <MenuDivider my={1} />
          </>
        )}
        <MenuGroup>
          <Box px={3} py={1}>
            <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">Membership</Text>
          </Box>
          {canEdit && (
            <MenuItem icon={<Icon as={MdEdit} color="gray.500" />} fontSize="sm" fontWeight="medium" _hover={{ bg: 'gray.50' }} onClick={() => onEdit(m.uniqueId)}>Edit</MenuItem>
          )}
          <MenuItem icon={<Icon as={MdDelete} color="red.400" />} fontSize="sm" fontWeight="medium" color="red.500" _hover={{ bg: 'red.50' }}>Delete</MenuItem>
        </MenuGroup>
      </MenuList>
    </Menu>
  );
}
