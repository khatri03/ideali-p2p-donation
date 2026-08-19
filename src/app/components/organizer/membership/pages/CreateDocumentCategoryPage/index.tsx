import React from 'react'; // eslint-disable-line
import {
  Box, Button, Flex, Icon, IconButton, Input, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Skeleton, Spinner,
  Table, TableContainer, Tag, TagCloseButton, TagLabel, Tbody, Td, Text, Textarea,
  Th, Thead, Tooltip, Tr,
} from '@chakra-ui/react';
import {
  MdArrowBack, MdCloudUpload, MdDelete, MdDownload, MdInsertDriveFile, MdSend, MdWarningAmber,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import MultiSelectDropdown from '../../common/MultiSelectDropdown';
import { DocumentCategoryDocument } from '../../services/documentCategoryService';
import { MAX_FILES, MAX_FILE_SIZE_MB, useCreateDocumentCategory } from './useCreateDocumentCategory';

function useUtcClock() {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return now.toLocaleString('en-US', {
    timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function CreateDocumentCategoryPage() {
  const navigate = useNavigate();
  const utcTime = useUtcClock();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const {
    isEditMode, isDetailLoading,
    name, setName,
    description, setDescription,
    membershipTypeOptions, membershipTypesLoading,
    selectedMembershipTypeIds, toggleMembershipTypeId, clearMembershipTypeIds,
    existingDocuments, downloadingDocId, deletingDocId, handleDownloadDocument, handleDeleteDocument,
    files, addFiles, removeFile,
    isSubmitting, canSubmit, handleSubmit,
  } = useCreateDocumentCategory();

  const [deleteDocTarget, setDeleteDocTarget] = React.useState<DocumentCategoryDocument | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const closeDeleteDocModal = () => { if (!deletingDocId) setDeleteDocTarget(null); };

  const confirmDeleteDoc = async () => {
    if (!deleteDocTarget) return;
    await handleDeleteDocument(deleteDocTarget);
    setDeleteDocTarget(null);
  };

  return (
    <Box minH="100vh" bg="gray.50" pt={16} pb={8}>
      <Box mx={{ base: 2, md: 4 }} mt={4}>
        <Button
          size="sm" variant="outline" leftIcon={<Icon as={MdArrowBack} />}
          borderRadius="lg" mb={4} fontSize="xs" fontWeight="700"
          onClick={() => navigate('/organizer/membership/documents')}
        >
          Back to Documents
        </Button>

        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm" p={{ base: 4, md: 6 }}>
          <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} flexDirection={{ base: 'column', md: 'row' }} gap={2} mb={6}>
            <Text fontSize="lg" fontWeight="700" color="gray.900">
              {isEditMode ? 'Edit Category' : 'New Documents'}
            </Text>
            <Text fontSize="xs" color="gray.400">Current UTC time: {utcTime} UTC</Text>
          </Flex>

          <Flex gap={5} flexWrap="wrap" mb={5}>
            <Box flex="1" minW="240px">
              <Text fontSize="12px" fontWeight="700" color="gray.700" mb={1.5}>
                Name <Text as="span" color="red.500">*</Text>
              </Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category Name"
                isDisabled={isDetailLoading}
                bg="gray.50" borderColor="gray.200" borderRadius="lg" fontSize="sm"
                _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
              />
            </Box>

            <Box flex="1" minW="240px">
              <Text fontSize="12px" fontWeight="700" color="gray.700" mb={1.5}>
                Membership Types
                {membershipTypesLoading && <Spinner size="xs" ml={2} color="#044bd9" />}
              </Text>
              <MultiSelectDropdown
                options={membershipTypeOptions}
                selected={selectedMembershipTypeIds}
                onToggle={toggleMembershipTypeId}
                onClear={clearMembershipTypeIds}
                placeholder={membershipTypesLoading ? 'Loading membership types...' : 'Select a membership types'}
              />
            </Box>
          </Flex>

          <Box mb={5}>
            <Text fontSize="12px" fontWeight="700" color="gray.700" mb={1.5}>Description</Text>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's in the category?"
              rows={4}
              isDisabled={isDetailLoading}
              bg="gray.50" borderColor="gray.200" borderRadius="lg" fontSize="sm"
              _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
            />
          </Box>

          <Box mb={isEditMode ? 6 : 2}>
            <Text fontSize="12px" fontWeight="700" color="gray.700" mb={0.5}>Documents</Text>
            <Text fontSize="11px" color="gray.400" mb={1.5}>
              Optional. These upload as soon as the category is {isEditMode ? 'saved' : 'created'}.
            </Text>

            <Box
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              cursor="pointer"
              border="2px dashed"
              borderColor={isDragging ? 'blue.400' : 'gray.200'}
              bg={isDragging ? 'blue.50' : 'gray.50'}
              borderRadius="lg"
              py={10}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              transition="all 0.15s"
              _hover={{ borderColor: 'blue.300', bg: 'blue.50' }}
            >
              <Icon as={MdCloudUpload} boxSize={8} color="gray.400" mb={2} />
              <Text fontSize="sm" fontWeight="600" color="gray.700">
                Drop files here or click to browse
              </Text>
              <Text fontSize="xs" color="gray.400" mt={0.5}>
                Up to {MAX_FILES} files, {MAX_FILE_SIZE_MB} MB each
              </Text>
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                display="none"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </Box>

            {files.length > 0 && (
              <Flex gap={2} flexWrap="wrap" mt={3}>
                {files.map((file, index) => (
                  <Tag key={`${file.name}-${file.size}`} size="md" borderRadius="md" bg="blue.50" color="blue.700" border="1px solid" borderColor="blue.200" py={1.5}>
                    <Icon as={MdInsertDriveFile} boxSize={3.5} mr={1.5} />
                    <TagLabel fontSize="xs" fontWeight="medium" maxW="220px" isTruncated>
                      {file.name} <Text as="span" color="blue.400">({formatFileSize(file.size)})</Text>
                    </TagLabel>
                    <TagCloseButton onClick={() => removeFile(index)} />
                  </Tag>
                ))}
              </Flex>
            )}
          </Box>

          {isEditMode && (
            <Box borderTop="1px solid" borderColor="gray.100" pt={5}>
              <Text fontSize="sm" fontWeight="700" color="gray.800" mb={3}>
                Uploaded documents
              </Text>

              <Box border="1px solid" borderColor="gray.200" borderRadius="lg" overflow="hidden">
                {isDetailLoading ? (
                  <Box px={4} py={4}>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} h="18px" borderRadius="md" mb={3} />
                    ))}
                  </Box>
                ) : existingDocuments.length === 0 ? (
                  <Flex minH="100px" align="center" justify="center" px={4}>
                    <Text fontSize="sm" color="gray.400">No documents</Text>
                  </Flex>
                ) : (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.100">
                        <Tr>
                          <Th color="gray.600" fontSize="11px" fontWeight="700">File</Th>
                          <Th color="gray.600" fontSize="11px" fontWeight="700">Type</Th>
                          <Th color="gray.600" fontSize="11px" fontWeight="700">Size</Th>
                          <Th color="gray.600" fontSize="11px" fontWeight="700">Uploaded</Th>
                          <Th color="gray.600" fontSize="11px" fontWeight="700" >Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {existingDocuments.map((doc, index) => (
                          <Tr key={doc.uniqueId} bg={(index + 1) % 2 === 0 ? 'rgba(226,232,240,0.44)' : 'white'}>
                            <Td>
                              <Flex align="center" gap={2}>
                                <Icon as={MdInsertDriveFile} boxSize={4} color="gray.400" />
                                <Text fontSize="xs" fontWeight="600" color="gray.800" noOfLines={1} maxW="280px">
                                  {doc.fileName}
                                </Text>
                              </Flex>
                            </Td>
                            <Td>
                              <Text fontSize="xs" color="gray.500">{doc.contentType}</Text>
                            </Td>
                            <Td>
                              <Text fontSize="xs" color="gray.500">{formatFileSize(doc.fileSize)}</Text>
                            </Td>
                            <Td>
                              <Text fontSize="xs" color="gray.500">{fmtDate(doc.uploadedOnUtc)}</Text>
                            </Td>
                            <Td>
                              <Flex align="center" gap={1}>
                                <Tooltip label="Download" fontSize="xs">
                                  <IconButton
                                    aria-label="Download document"
                                    icon={<Icon as={MdDownload} />}
                                    size="xs" variant="ghost" borderRadius="full"
                                    isLoading={downloadingDocId === doc.uniqueId}
                                    onClick={() => handleDownloadDocument(doc)}
                                    _hover={{ bg: 'blue.50', color: 'blue.500' }}
                                  />
                                </Tooltip>
                                <Tooltip label="Delete" fontSize="xs">
                                  <IconButton
                                    aria-label="Delete document"
                                    icon={<Icon as={MdDelete} />}
                                    size="xs" variant="ghost" borderRadius="full"
                                    color="red.500"
                                    isLoading={deletingDocId === doc.uniqueId}
                                    onClick={() => setDeleteDocTarget(doc)}
                                    _hover={{ bg: 'red.50' }}
                                  />
                                </Tooltip>
                              </Flex>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Box>
          )}
        </Box>

        <Flex justify="space-between" mt={5} gap={3}>
          <Button
            size="sm" variant="outline" borderRadius="lg" fontSize="xs" fontWeight="700"
            onClick={() => navigate('/organizer/membership/documents')}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="sm" bg="#044bd9" color="white" borderRadius="lg" px={6}
            fontSize="xs" fontWeight="700"
            leftIcon={<Icon as={MdSend} />}
            onClick={handleSubmit}
            isDisabled={!canSubmit}
            isLoading={isSubmitting}
            loadingText={isEditMode ? 'Saving' : 'Creating'}
            _hover={{ bg: '#0340b8' }}
            _active={{ bg: '#02308a' }}
          >
            {isEditMode ? 'Save changes' : 'Create category'}
          </Button>
        </Flex>
      </Box>

      <Modal isOpen={!!deleteDocTarget} onClose={closeDeleteDocModal} isCentered size="md">
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
        <ModalContent borderRadius="2xl" px={2} py={3}>
          <ModalHeader pb={2}>
            <Flex align="center" gap={3}>
              <Flex w="40px" h="40px" borderRadius="xl" bg="red.50" color="red.500" align="center" justify="center" flexShrink={0}>
                <Icon as={MdWarningAmber} boxSize={5} />
              </Flex>
              <Text fontSize="lg" fontWeight="800" color="gray.900">Remove document</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton isDisabled={!!deletingDocId} top={4} right={4} />
          <ModalBody pt={1}>
            <Text fontSize="sm" color="gray.600">
              Remove{' '}
              <Text as="span" fontWeight="800" color="gray.800">{deleteDocTarget?.fileName}</Text>
              {' '}from this category? This can&apos;t be undone.
            </Text>
          </ModalBody>
          <ModalFooter gap={3} pt={6}>
            <Button minW="108px" variant="outline" borderRadius="xl" onClick={closeDeleteDocModal} isDisabled={!!deletingDocId}>
              Cancel
            </Button>
            <Button
              minW="136px" bg="red.500" color="white" borderRadius="xl"
              onClick={confirmDeleteDoc}
              isLoading={!!deletingDocId}
              loadingText="Removing"
              _hover={{ bg: 'red.600' }}
              _active={{ bg: 'red.700' }}
            >
              Remove
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
