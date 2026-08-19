import React from 'react'; // eslint-disable-line
import {
  Badge, Box, Button, Flex, Icon, Input, InputGroup, InputLeftElement,
  Skeleton, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VStack, useToast,
} from '@chakra-ui/react';
import {
  MdArrowBack, MdDescription, MdDownload, MdInsertDriveFile, MdSearch,
} from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import memberDocumentService, {
  MemberDocument, MemberDocumentCategoryDetail,
} from '../services/memberDocumentService';

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFileType(doc: MemberDocument) {
  if (doc.contentType?.includes('/')) {
    return doc.contentType.split('/')[1].toUpperCase();
  }
  const parts = doc.fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

const PAGE_SIZE = 10;

export default function MemberDocumentCategoryPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();

  const [category, setCategory] = React.useState<MemberDocumentCategoryDetail | null>(null);
  const [documents, setDocuments] = React.useState<MemberDocument[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [pageNo, setPageNo] = React.useState(1);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!categoryId) return;

    setIsLoading(true);
    Promise.all([
      memberDocumentService.getCategoryDetail(categoryId),
      memberDocumentService.getCategoryDocuments(categoryId),
    ])
      .then(([detail, docs]) => {
        setCategory(detail);
        setDocuments(docs);
      })
      .catch((err: any) => {
        toast({
          title: 'Failed to load documents',
          description: err?.response?.data?.message ?? err?.message ?? 'Please try again.',
          status: 'error',
          position: 'top-right',
        });
      })
      .finally(() => setIsLoading(false));
  }, [categoryId, toast]);

  const filtered = documents.filter((doc) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return doc.fileName.toLowerCase().includes(term);
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(pageNo, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleDownload = async (doc: MemberDocument) => {
    setDownloadingId(doc.uniqueId);
    try {
      await memberDocumentService.downloadDocument(doc.uniqueId, doc.fileName);
    } catch (err: any) {
      toast({
        title: 'Failed to download document',
        description: err?.response?.data?.message ?? err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" pt={16} pb={8}>
      <Box mx={{ base: 2, md: 4 }} mt={4}>
        <Button
          size="sm" variant="outline" leftIcon={<Icon as={MdArrowBack} />}
          borderRadius="lg" mb={4} fontSize="xs" fontWeight="700"
          onClick={() => navigate('/member/documents')}
        >
          Back to documents
        </Button>

        <Box bg="white" borderRadius="xl"
          boxShadow="0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)"
          overflow="hidden"
        >
          {/* Header */}
          <Box p={5} borderBottom="1px solid" borderColor="gray.100">
            {isLoading ? (
              <Skeleton h="44px" w="280px" borderRadius="lg" />
            ) : (
              <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} flexDirection={{ base: 'column', md: 'row' }} gap={3}>
                <Flex align="center" gap={3}>
                  <Flex w="44px" h="44px" borderRadius="lg" bg="#044bd9" align="center" justify="center" flexShrink={0}>
                    <Text color="white" fontSize="sm" fontWeight="800">{getInitials(category?.name ?? '?')}</Text>
                  </Flex>
                  <Box>
                    <Text fontSize="lg" fontWeight="800" color="gray.900">{category?.name ?? 'Category'}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {category?.description || 'Shared documents'} · {filtered.length} file{filtered.length === 1 ? '' : 's'}
                    </Text>
                  </Box>
                </Flex>
                {/* <Badge
                  bg="blue.50" color="blue.700" border="1px solid" borderColor="blue.200"
                  borderRadius="md" px={2.5} py={1} fontSize="11px" fontWeight="bold"
                  display="inline-flex" alignItems="center" gap={1} textTransform="uppercase"
                >
                  <Icon as={MdDownload} boxSize={3} />
                  Download
                </Badge> */}
              </Flex>
            )}
          </Box>

          {/* Search */}
          <Box p={4} borderBottom="1px solid" borderColor="gray.100">
            <InputGroup size="md" maxW={{ base: 'full', md: '360px' }}>
              <InputLeftElement pointerEvents="none">
                <Icon as={MdSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search files"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPageNo(1); }}
                bg="gray.50" borderColor="gray.200" borderRadius="lg"
                _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
              />
            </InputGroup>
          </Box>

          {/* Table */}
          {isLoading ? (
            <Box display={{ base: 'none', md: 'block' }}>
              <TableContainer>
                <Table variant="simple" size="md">
                  <Thead bg="gray.200">
                    <Tr>
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">File</Th>
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Type</Th>
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Size</Th>
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Uploaded</Th>
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Tr key={i} bg={(i + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                        {Array.from({ length: 5 }).map((__, j) => (
                          <Td key={j}><Skeleton h="16px" borderRadius="md" /></Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          ) : paged.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={16} gap={3}>
              <Flex w="56px" h="56px" borderRadius="xl" bg="blue.50"
                border="1px solid" borderColor="blue.100" align="center" justify="center"
              >
                <Icon as={MdDescription} boxSize={7} color="blue.300" />
              </Flex>
              <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                {search.trim() ? 'No files found' : 'No documents yet'}
              </Text>
              <Text color="gray.400" fontSize="xs">
                {search.trim() ? `No files match "${search}"` : 'Documents shared in this category will appear here.'}
              </Text>
            </Flex>
          ) : (
            <>
              {/* Desktop table */}
              <Box display={{ base: 'none', md: 'block' }}>
                <TableContainer>
                  <Table variant="simple" size="md">
                    <Thead bg="gray.200">
                      <Tr>
                        <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">File</Th>
                        <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Type</Th>
                        <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Size</Th>
                        <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Uploaded</Th>
                        <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {paged.map((doc, i) => (
                        <Tr key={doc.uniqueId} bg={(i + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                          <Td>
                            <Flex align="center" gap={2}>
                              <Icon as={MdInsertDriveFile} boxSize={4} color="gray.400" />
                              <Text fontWeight="semibold" fontSize="sm" color="gray.800" noOfLines={1} maxW="360px">
                                {doc.fileName}
                              </Text>
                            </Flex>
                          </Td>
                          <Td>
                            <Text fontSize="sm" fontWeight="bold" color="red.500">{formatFileType(doc)}</Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color="gray.700">{formatFileSize(doc.fileSize)}</Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color="gray.700">{fmtDateTime(doc.uploadedOnUtc)}</Text>
                          </Td>
                          <Td>
                            <Flex gap={2}>
                              <Button
                                size="xs" bg="#044bd9" color="white" borderRadius="md" leftIcon={<Icon as={MdDownload} boxSize={3} />}
                                isLoading={downloadingId === doc.uniqueId}
                                onClick={() => handleDownload(doc)}
                                _hover={{ bg: '#0340b8' }}
                              >
                                Download
                              </Button>
                            </Flex>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Mobile card list */}
              <Box display={{ base: 'block', md: 'none' }}>
                <VStack spacing={0} divider={<Box h="1px" bg="gray.100" w="full" />}>
                  {paged.map((doc) => (
                    <Box key={doc.uniqueId} px={4} py={4} w="full">
                      <Flex align="center" gap={2} mb={1.5}>
                        <Icon as={MdInsertDriveFile} boxSize={4} color="gray.400" />
                        <Text fontWeight="semibold" fontSize="sm" color="gray.800" noOfLines={1}>{doc.fileName}</Text>
                      </Flex>
                      <Flex gap={4} flexWrap="wrap" mb={2}>
                        <Box>
                          <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Type</Text>
                          <Text fontSize="xs" color="red.500" fontWeight="bold">{formatFileType(doc)}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Size</Text>
                          <Text fontSize="xs" color="gray.700" fontWeight="medium">{formatFileSize(doc.fileSize)}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="bold" mb={0.5}>Uploaded</Text>
                          <Text fontSize="xs" color="gray.700" fontWeight="medium">{fmtDateTime(doc.uploadedOnUtc)}</Text>
                        </Box>
                      </Flex>
                      <Flex gap={2}>
                        <Button
                          size="xs" bg="#044bd9" color="white" borderRadius="md" leftIcon={<Icon as={MdDownload} boxSize={3} />}
                          isLoading={downloadingId === doc.uniqueId}
                          onClick={() => handleDownload(doc)}
                          _hover={{ bg: '#0340b8' }}
                        >
                          Download
                        </Button>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </Box>

              {/* Pagination */}
              {pageCount > 1 && (
                <Flex justify="space-between" align="center" px={4} py={3} borderTopWidth="1px" borderColor="gray.100">
                  <Text color="gray.500" fontSize="sm">
                    Page {currentPage} of {pageCount} · {filtered.length} total
                  </Text>
                  <Flex gap="6px">
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                      <Box
                        key={p}
                        w="30px" h="30px"
                        borderRadius="8px"
                        display="flex" alignItems="center" justifyContent="center"
                        cursor="pointer"
                        bg={p === currentPage ? 'brand.500' : 'transparent'}
                        color={p === currentPage ? 'white' : 'gray.500'}
                        fontWeight="600"
                        fontSize="sm"
                        onClick={() => setPageNo(p)}
                        _hover={{ bg: p === currentPage ? 'brand.500' : 'gray.100' }}
                      >
                        {p}
                      </Box>
                    ))}
                  </Flex>
                </Flex>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
