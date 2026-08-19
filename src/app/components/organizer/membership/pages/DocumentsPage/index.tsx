import React from 'react'; // eslint-disable-line
import {
  Badge, Box, Button, Flex, Icon, IconButton, Input, InputGroup,
  InputLeftElement, Menu, MenuButton, MenuItem, MenuList, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
  Skeleton, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VStack, useToast,
} from '@chakra-ui/react';
import {
  MdAdd, MdDelete, MdDescription, MdDownload, MdEdit, MdFilterList,
  MdFilterListOff, MdMoreVert, MdSearch, MdWarningAmber,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Pagination from 'app/components/organizer/donation/organizerDonationComponents/Pagination';
import MembershipHeroHeader from '../../common/MembershipHeroHeader';
import documentCategoryService, { DocumentCategoryItem } from '../../services/documentCategoryService';
import { useDocumentCategories } from './useDocumentCategories';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function AccessBadge() {
  return (
    <Badge
      bg="blue.50" color="blue.700" border="1px solid" borderColor="blue.200"
      borderRadius="md" px={2} py={0.5} fontSize="10px" fontWeight="bold"
      display="inline-flex" alignItems="center" gap={1} textTransform="uppercase"
    >
      <Icon as={MdDownload} boxSize={3} />
      Download
    </Badge>
  );
}

function ActionMenu({ row, onEdit, onDelete }: {
  row: DocumentCategoryItem;
  onEdit: (row: DocumentCategoryItem) => void;
  onDelete: (row: DocumentCategoryItem) => void;
}) {
  return (
    <Menu>
      <MenuButton
        as={IconButton}
        icon={<Icon as={MdMoreVert} />}
        variant="ghost" size="sm" borderRadius="full"
        aria-label="Actions"
        _hover={{ bg: 'blue.50', color: 'blue.500' }}
      />
      <MenuList minW="160px" shadow="xl" borderRadius="xl" border="1px solid" borderColor="gray.100" py={2} overflow="hidden">
        <MenuItem
          icon={<Icon as={MdEdit} color="gray.600" />}
          fontSize="sm" fontWeight="medium" _hover={{ bg: 'gray.50' }}
          onClick={() => onEdit(row)}
        >
          Edit Category
        </MenuItem>
        <MenuItem
          icon={<Icon as={MdDelete} color="red.500" />}
          fontSize="sm" fontWeight="medium" color="red.500" _hover={{ bg: 'red.50' }}
          onClick={() => onDelete(row)}
        >
          Delete
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

export default function DocumentsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const {
    filtered, isLoading, pageNo, pageSize, totalRecords,
    name, setName, hasActiveFilters, handleApplyFilter, handleClearFilters, handlePageChange,
    refreshList,
  } = useDocumentCategories();

  const [deleteTarget, setDeleteTarget] = React.useState<DocumentCategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const goToEdit = (row: DocumentCategoryItem) => navigate(`/organizer/membership/documents/${row.uniqueId}/edit`);

  const closeDeleteModal = () => { if (!isDeleting) setDeleteTarget(null); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const response = await documentCategoryService.deleteCategory(deleteTarget.uniqueId);
      toast({
        title: response.data?.message ?? 'Document category deleted.',
        status: 'success',
        position: 'top-right',
      });
      setDeleteTarget(null);
      await refreshList();
    } catch (err: any) {
      toast({
        title: 'Failed to delete category',
        description: err?.response?.data?.message ?? err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" pt={16} pb={8}>
      <MembershipHeroHeader
        eyebrow="Documents"
        title="Document Categories"
        description="Share downloadable documents with your members."
        action={
          <Button
            leftIcon={<Icon as={MdAdd} />} bg="white" color="blue.600"
            fontWeight="semibold" size="md" borderRadius="lg" boxShadow="md"
            w={{ base: 'full', md: 'auto' }}
            _hover={{ bg: 'blue.50', transform: 'translateY(-1px)', boxShadow: 'lg' }}
            transition="all 0.2s"
            onClick={() => navigate('/organizer/membership/documents/create')}
          >
            New Category
          </Button>
        }
      />

      <Box mx={{ base: 2, md: 4 }} mt={4}>
        {/* Filters */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} mb={4} boxShadow="sm">
          <Flex align="center" gap={2} mb={4} pb={3} borderBottom="1px solid" borderColor="gray.100">
            <Flex w="28px" h="28px" borderRadius="md" bg="blue.50" align="center" justify="center" flexShrink={0}>
              <Icon as={MdFilterList} boxSize={4} color="blue.500" />
            </Flex>
            <Text fontSize="md" fontWeight="700" color="gray.800">Filters</Text>
          </Flex>

          <Flex gap={3} flexWrap="wrap" mb={4}>
            <Box flex="1" minW="220px">
              <Text fontSize="11px" fontWeight="700" color="gray.700" textTransform="uppercase" mb={1.5}>
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
                  bg="gray.50" borderColor="gray.200" borderRadius="lg" fontSize="sm"
                  _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
                />
              </InputGroup>
            </Box>
          </Flex>

          <Flex gap={3} justify="flex-end">
            <Button
              size="sm" variant="outline" borderRadius="lg" px={5}
              borderColor={hasActiveFilters ? 'red.300' : 'gray.300'}
              color={hasActiveFilters ? 'red.500' : 'gray.500'}
              fontSize="xs" fontWeight="700"
              leftIcon={<Icon as={MdFilterListOff} />}
              onClick={handleClearFilters}
              _hover={{ bg: hasActiveFilters ? 'red.50' : 'gray.50' }}
            >
              Clear
            </Button>
            <Button
              size="sm" bg="#044bd9" color="white" borderRadius="lg" px={6}
              fontSize="xs" fontWeight="700"
              onClick={handleApplyFilter}
              _hover={{ bg: '#0340b8' }}
            >
              Apply filter
            </Button>
          </Flex>
        </Box>

        {/* Results */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="hidden" boxShadow="sm">
          <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.100">
            <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
              <Box>
                <Text fontSize="sm" fontWeight="800" color="gray.800">Document Categories</Text>
                <Text fontSize="xs" fontWeight="500" color="gray.500">
                  Downloadable document categories shared with your members.
                </Text>
              </Box>
              <Badge
                bg="blue.50" color="blue.700" border="1px solid" borderColor="blue.200"
                borderRadius="md" px={2.5} py={1} fontSize="11px" fontWeight="semibold"
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
                      <Th color="gray.800" fontWeight="700" fontSize="11px" textTransform="uppercase" w="60px">Actions</Th>
                      <Th color="gray.800" fontWeight="700" fontSize="11px" textTransform="uppercase">Name</Th>
                      <Th color="gray.800" fontWeight="700" fontSize="11px" textTransform="uppercase">Visible To</Th>
                      <Th color="gray.800" fontWeight="700" fontSize="11px" textTransform="uppercase">Access</Th>
                      <Th color="gray.800" fontWeight="700" fontSize="11px" textTransform="uppercase">Documents</Th>
                      <Th color="gray.800" fontWeight="700" fontSize="11px" textTransform="uppercase">Created</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Tr key={i} bg={(i + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <Td key={j}><Skeleton h="16px" borderRadius="md" /></Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          ) : filtered.length === 0 ? (
            <Flex direction="column" align="center" py={14} gap={2}>
              <Icon as={MdDescription} boxSize={8} color="gray.300" mb={1} />
              <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                {hasActiveFilters ? 'No categories found' : 'No document categories yet'}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {hasActiveFilters
                  ? `No document categories match "${name}"`
                  : 'Categories will appear here once you create one.'}
              </Text>
            </Flex>
          ) : (
            <>
              <Box display={{ base: 'none', lg: 'block' }}>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead bg="gray.200">
                      <Tr>
                        <Th color="gray.800" fontWeight="700" fontSize="11px" textTransform="uppercase" w="60px">Actions</Th>
                        <Th color="gray.800" fontWeight="700" fontSize="11px" textTransform="uppercase">Name</Th>
                        <Th color="gray.800" fontWeight="700" fontSize="11px" textTransform="uppercase">Visible To</Th>
                        <Th color="gray.800" fontWeight="700" fontSize="11px" textTransform="uppercase">Access</Th>
                        <Th color="gray.800" fontWeight="700" fontSize="11px" textTransform="uppercase">Documents</Th>
                        <Th color="gray.800" fontWeight="700" fontSize="11px" textTransform="uppercase">Created</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filtered.map((row, i) => (
                        <Tr key={row.uniqueId} bg={(i + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                          <Td>
                            <ActionMenu
                              row={row}
                              onEdit={goToEdit}
                              onDelete={setDeleteTarget}
                            />
                          </Td>
                          <Td>
                            <Text
                              fontSize="xs" fontWeight="700" color="#044bd9" cursor="pointer"
                              _hover={{ textDecoration: 'underline' }}
                              onClick={() => goToEdit(row)}
                            >
                              {row.name}
                            </Text>
                          </Td>
                          <Td>
                            <Flex gap={1} flexWrap="wrap">
                              {(row.membershipTypeNames ?? []).map((typeName) => (
                                <Badge
                                  key={typeName}
                                  bg="purple.50" color="purple.700" border="1px solid" borderColor="purple.200"
                                  borderRadius="md" px={2} py={0.5} fontSize="10px" fontWeight="bold" textTransform="uppercase"
                                >
                                  {typeName}
                                </Badge>
                              ))}
                            </Flex>
                          </Td>
                          <Td>
                            <AccessBadge />
                          </Td>
                          <Td>
                            <Text fontSize="xs" color="gray.700" fontWeight="600">
                              {String(row.documentCount ?? 0).padStart(2, '0')}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="xs" color="gray.700" fontWeight="500">
                              {row.createdOnUtc ? fmtDate(row.createdOnUtc) : '—'}
                            </Text>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>

              <Box display={{ base: 'block', lg: 'none' }}>
                <VStack spacing={0} divider={<Box h="1px" bg="gray.100" w="full" />}>
                  {filtered.map((row) => (
                    <Box key={row.uniqueId} px={4} py={4} w="full">
                      <Flex justify="space-between" align="flex-start">
                        <Box flex="1" minW={0} mr={2}>
                          <Text
                            fontSize="sm" fontWeight="semibold" color="#044bd9" mb={1} noOfLines={1}
                            cursor="pointer"
                            _hover={{ textDecoration: 'underline' }}
                            onClick={() => goToEdit(row)}
                          >
                            {row.name}
                          </Text>
                          <Flex gap={1} flexWrap="wrap" mb={2}>
                            {(row.membershipTypeNames ?? []).map((typeName) => (
                              <Badge
                                key={typeName}
                                bg="purple.50" color="purple.700" border="1px solid" borderColor="purple.200"
                                borderRadius="md" px={2} py={0.5} fontSize="10px" fontWeight="bold" textTransform="uppercase"
                              >
                                {typeName}
                              </Badge>
                            ))}
                          </Flex>
                          <Flex gap={4} flexWrap="wrap">
                            <Box>
                              <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Access</Text>
                              <AccessBadge />
                            </Box>
                            <Box>
                              <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Documents</Text>
                              <Text fontSize="xs" color="gray.700" fontWeight="600">
                                {String(row.documentCount ?? 0).padStart(2, '0')}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Created</Text>
                              <Text fontSize="xs" color="gray.700" fontWeight="medium">
                                {row.createdOnUtc ? fmtDate(row.createdOnUtc) : '—'}
                              </Text>
                            </Box>
                          </Flex>
                        </Box>
                        <ActionMenu
                          row={row}
                          onEdit={goToEdit}
                          onDelete={setDeleteTarget}
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

      <Modal isOpen={!!deleteTarget} onClose={closeDeleteModal} isCentered size="md">
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
        <ModalContent borderRadius="2xl" px={2} py={3}>
          <ModalHeader pb={2}>
            <Flex align="center" gap={3}>
              <Flex w="40px" h="40px" borderRadius="xl" bg="red.50" color="red.500" align="center" justify="center" flexShrink={0}>
                <Icon as={MdWarningAmber} boxSize={5} />
              </Flex>
              <Text fontSize="lg" fontWeight="800" color="gray.900">Delete category</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton isDisabled={isDeleting} top={4} right={4} />
          <ModalBody pt={1}>
            <Text fontSize="sm" color="gray.600">
              Delete{' '}
              <Text as="span" fontWeight="800" color="gray.800">{deleteTarget?.name}</Text>
              ? Its {deleteTarget?.documentCount ?? 0} document{deleteTarget?.documentCount === 1 ? '' : 's'} will be removed. This can&apos;t be undone.
            </Text>
          </ModalBody>
          <ModalFooter gap={3} pt={6}>
            <Button minW="108px" variant="outline" borderRadius="xl" onClick={closeDeleteModal} isDisabled={isDeleting}>
              Cancel
            </Button>
            <Button
              minW="136px" bg="red.500" color="white" borderRadius="xl"
              onClick={confirmDelete}
              isLoading={isDeleting}
              loadingText="Deleting"
              _hover={{ bg: 'red.600' }}
              _active={{ bg: 'red.700' }}
            >
              Delete category
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
