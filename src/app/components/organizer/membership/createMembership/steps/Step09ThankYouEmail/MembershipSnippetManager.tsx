import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter,
  AlertDialogHeader, AlertDialogOverlay, Box, Button, Flex, IconButton,
  Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter,
  ModalHeader, ModalOverlay, Spinner, Text, Textarea, Tooltip,
  useDisclosure, useToast,
} from '@chakra-ui/react';
import {
  MdBookmark, MdBookmarkAdd, MdArrowDropDown, MdArrowDropUp,
  MdChevronLeft, MdDelete, MdEdit,
} from 'react-icons/md';
import membershipEmailTemplateService from 'app/components/organizer/membership/services/membershipEmailTemplateService';
import { SnippetItem } from 'app/service/organizer/donation/campaignEditorService';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';

interface Props {
  editorHtml: string;
  onInsert: (html: string) => void;
}

const ROW: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
  userSelect: 'none', transition: 'background 0.1s',
};

type MenuView = 'root' | 'list';

export default function MembershipSnippetManager({ editorHtml, onInsert }: Props) {
  const [isOpen, setIsOpen]               = useState(false);
  const [menuView, setMenuView]           = useState<MenuView>('root');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const wrapperRef                        = useRef<HTMLDivElement>(null);

  const [snippets, setSnippets]           = useState<SnippetItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError]         = useState<string | null>(null);
  const snippetRef                        = useRef<SnippetItem | null>(null);

  const [formName, setFormName]               = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNameError, setFormNameError]     = useState('');
  const [isSaving, setIsSaving]               = useState(false);
  const [isDeleting, setIsDeleting]           = useState(false);

  const { isOpen: isFormOpen,   onOpen: onFormOpen,   onClose: onFormClose }   = useDisclosure();
  const { isOpen: isUpdateOpen, onOpen: onUpdateOpen, onClose: onUpdateClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelUpdateRef = useRef<HTMLButtonElement>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) closeDropdown();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!hasPermission('membership:email-snippet:view')) return;
    setIsLoadingList(true);
    membershipEmailTemplateService.getSnippets()
      .then((res) => {
        const data = res?.data as any;
        if (Array.isArray(data)) setSnippets(data);
        else if (data?.pageData && Array.isArray(data.pageData)) setSnippets(data.pageData);
        else setSnippets([]);
      })
      .catch(() => setListError('Failed to load snippets.'))
      .finally(() => setIsLoadingList(false));
  }, []);

  const computeStyle = (): React.CSSProperties => {
    if (!wrapperRef.current) return {};
    const W    = 240;
    const M    = 8;
    const rect = wrapperRef.current.getBoundingClientRect();
    const vpW  = window.innerWidth;
    let left   = rect.right - W;
    if (left < M) left = M;
    if (left + W > vpW - M) left = vpW - W - M;
    return { position: 'fixed', top: rect.bottom + 4, left: Math.max(M, left), width: Math.min(W, vpW - M * 2) };
  };

  const closeDropdown = () => { setIsOpen(false); setMenuView('root'); };
  const toggleDropdown = () => {
    if (isOpen) { closeDropdown(); }
    else { setMenuView('root'); setDropdownStyle(computeStyle()); setIsOpen(true); }
  };
  const goToList = () => { setMenuView('list'); };
  const hoverGray = (e: React.MouseEvent, on: boolean) => { (e.currentTarget as HTMLElement).style.background = on ? '#F7FAFC' : ''; };
  const hoverBlue = (e: React.MouseEvent, on: boolean) => { (e.currentTarget as HTMLElement).style.background = on ? '#EBF8FF' : ''; };

  const openCreate = () => { setFormName(''); setFormDescription(''); setFormNameError(''); closeDropdown(); onFormOpen(); };
  const openDeleteConfirm = (e: React.MouseEvent, s: SnippetItem) => { e.stopPropagation(); snippetRef.current = s; closeDropdown(); onDeleteOpen(); };
  const openUpdateConfirm = (e: React.MouseEvent, s: SnippetItem) => { e.stopPropagation(); snippetRef.current = s; closeDropdown(); onUpdateOpen(); };

  const handleFormSave = useCallback(async () => {
    if (!formName.trim()) return;
    setIsSaving(true);
    try {
      const res = await membershipEmailTemplateService.createSnippet({ name: formName.trim(), template: editorHtml, ...(formDescription.trim() ? { description: formDescription.trim() } : {}) });
      if (res?.success) {
        const saved: SnippetItem = res.data?.uniqueId ? res.data : { uniqueId: Date.now().toString(), name: formName.trim(), template: editorHtml };
        setSnippets((prev) => [...prev, saved]);
        toast({ title: 'Snippet created', status: 'success', duration: 3000, isClosable: true, position: 'top-right' });
        onFormClose();
      } else toast({ title: 'Failed to save', status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
    } catch { toast({ title: 'Error', status: 'error', duration: 4000, isClosable: true, position: 'top-right' }); }
    finally { setIsSaving(false); }
  }, [formName, formDescription, editorHtml, onFormClose, toast]);

  const handleUpdate = useCallback(async () => {
    const s = snippetRef.current;
    if (!s) return;
    setIsSaving(true);
    try {
      const res = await membershipEmailTemplateService.updateSnippet(s.uniqueId, { uniqueId: s.uniqueId, name: s.name, template: editorHtml, description: s.description });
      if (res?.success) {
        setSnippets((prev) => prev.map((x) => x.uniqueId === s.uniqueId ? { ...x, template: editorHtml } : x));
        toast({ title: 'Snippet updated', status: 'success', duration: 3000, isClosable: true, position: 'top-right' });
        onUpdateClose(); snippetRef.current = null;
      } else toast({ title: 'Failed to update', status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
    } catch { toast({ title: 'Error', status: 'error', duration: 4000, isClosable: true, position: 'top-right' }); }
    finally { setIsSaving(false); }
  }, [editorHtml, onUpdateClose, toast]);

  const handleDelete = useCallback(async () => {
    const s = snippetRef.current;
    if (!s) return;
    setIsDeleting(true);
    try {
      const res = await membershipEmailTemplateService.deleteSnippet(s.uniqueId);
      if (res?.success) {
        setSnippets((prev) => prev.filter((x) => x.uniqueId !== s.uniqueId));
        toast({ title: 'Snippet deleted', status: 'info', duration: 3000, isClosable: true, position: 'top-right' });
        onDeleteClose(); snippetRef.current = null;
      } else toast({ title: 'Failed to delete', status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
    } catch { toast({ title: 'Error', status: 'error', duration: 4000, isClosable: true, position: 'top-right' }); }
    finally { setIsDeleting(false); }
  }, [onDeleteClose, toast]);

  if (!hasPermission('membership:email-snippet:view')) return null;

  return (
    <>
      <Box ref={wrapperRef} position="relative" display="inline-block">
        <Tooltip label="Snippets" fontSize="xs" openDelay={400}>
          <Button size="xs" variant="ghost" h="26px" px={2}
            leftIcon={<MdBookmark size={14} />}
            rightIcon={isOpen ? <MdArrowDropUp /> : <MdArrowDropDown />}
            onClick={toggleDropdown}>
            <Text fontSize="11px">Snippets</Text>
          </Button>
        </Tooltip>

        {isOpen && (
          <Box style={dropdownStyle} bg="white" border="1px solid" borderColor="gray.200"
            borderRadius="8px" boxShadow="lg" zIndex={2000} overflow="hidden">

            {menuView === 'root' && (
              <>
                {snippets.length > 0 && (
                  <Flex style={ROW} justify="space-between"
                    onMouseEnter={(e) => hoverGray(e, true)} onMouseLeave={(e) => hoverGray(e, false)}
                    onClick={goToList}>
                    <Flex align="center" gap={2}>
                      <MdBookmark size={14} color="#4A5568" />
                      <Text fontSize="13px" color="gray.700">Your snippets</Text>
                    </Flex>
                    <Box as={MdArrowDropDown} size="18px" color="#A0AEC0" />
                  </Flex>
                )}
                {snippets.length > 0 && <Box borderTop="1px solid" borderColor="gray.100" />}
                {hasPermission('membership:email-snippet:create') && (
                  <Flex style={ROW}
                    onMouseEnter={(e) => hoverGray(e, true)} onMouseLeave={(e) => hoverGray(e, false)}
                    onClick={openCreate}>
                    <MdBookmarkAdd size={14} color="#4A5568" />
                    <Text fontSize="13px" color="gray.700">Save as new snippet</Text>
                  </Flex>
                )}
              </>
            )}

            {menuView === 'list' && (
              <>
                <Flex style={ROW} borderBottom="1px solid" borderColor="gray.100"
                  onMouseEnter={(e) => hoverGray(e, true)} onMouseLeave={(e) => hoverGray(e, false)}
                  onClick={() => setMenuView('root')}>
                  <MdChevronLeft size={16} color="#718096" />
                  <Text fontSize="12px" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.04em">Your snippets</Text>
                </Flex>
                <Box maxH="260px" overflowY="auto">
                  {isLoadingList ? (
                    <Flex align="center" gap={2} px={3} py={3}><Spinner size="xs" color="blue.500" /><Text fontSize="xs" color="gray.500">Loading…</Text></Flex>
                  ) : listError ? (
                    <Text fontSize="xs" color="red.400" px={3} py={3}>{listError}</Text>
                  ) : snippets.length === 0 ? (
                    <Text fontSize="xs" color="gray.400" px={3} py={3}>No snippets saved yet</Text>
                  ) : snippets.map((s) => (
                    <Flex key={s.uniqueId} align="center" px={3} py="8px"
                      borderBottom="1px solid" borderColor="gray.50"
                      style={{ transition: 'background 0.1s' }}
                      onMouseEnter={(e) => hoverBlue(e, true)} onMouseLeave={(e) => hoverBlue(e, false)}>
                      <Box flex={1} minW={0} cursor="pointer" onClick={() => { onInsert(s.template); closeDropdown(); }}>
                        <Text fontSize="13px" fontWeight="500" color="blue.600" noOfLines={1}>{s.name}</Text>
                        {s.description && <Text fontSize="11px" color="gray.400" noOfLines={1}>{s.description}</Text>}
                      </Box>
                      <Flex gap={1} flexShrink={0} ml={2}>
                        {hasPermission('membership:email-snippet:edit') && (
                          <Tooltip label="Update template" fontSize="xs" openDelay={300}>
                            <IconButton aria-label="Update" icon={<MdEdit size={13} />} size="xs" variant="ghost" colorScheme="green" h="22px" w="22px" minW="22px" onClick={(e) => openUpdateConfirm(e, s)} />
                          </Tooltip>
                        )}
                        {hasPermission('membership:email-snippet:delete') && (
                          <Tooltip label="Delete snippet" fontSize="xs" openDelay={300}>
                            <IconButton aria-label="Delete" icon={<MdDelete size={13} />} size="xs" variant="ghost" colorScheme="red" h="22px" w="22px" minW="22px" onClick={(e) => openDeleteConfirm(e, s)} />
                          </Tooltip>
                        )}
                      </Flex>
                    </Flex>
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Create modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="md">Save as New Snippet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" gap={3}>
              <Box>
                <Text fontSize="xs" fontWeight="medium" mb={1}>Snippet Name <Text as="span" color="red.400">*</Text></Text>
                <Input size="sm" placeholder="e.g. My closing message" value={formName} autoFocus
                  onChange={(e) => { const v = e.target.value; setFormName(v); setFormNameError(v.trim().length > 0 && (v.trim().length < 3 || v.trim().length > 40) ? 'Name must be 3–40 characters.' : ''); }}
                  onKeyDown={(e) => e.key === 'Enter' && !isSaving && handleFormSave()} isInvalid={!!formNameError} />
                {formNameError && <Text fontSize="xs" color="red.400" mt={1}>{formNameError}</Text>}
              </Box>
              <Box>
                <Text fontSize="xs" fontWeight="medium" mb={1}>Description <Text as="span" color="gray.400" fontWeight="normal">(optional)</Text></Text>
                <Textarea size="sm" placeholder="Short description…" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} resize="none" />
              </Box>
            </Flex>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button size="sm" variant="ghost" onClick={onFormClose} isDisabled={isSaving}>Cancel</Button>
            <Button size="sm" colorScheme="blue" isLoading={isSaving} loadingText="Saving…"
              isDisabled={!formName.trim() || !!formNameError || formName.trim().length < 3}
              onClick={handleFormSave}>Save Snippet</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Update confirm */}
      <AlertDialog isOpen={isUpdateOpen} leastDestructiveRef={cancelUpdateRef} onClose={onUpdateClose} isCentered>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="md" fontWeight="bold">Update Snippet Template</AlertDialogHeader>
          <AlertDialogBody>
            <Text fontSize="sm">Update <Text as="span" fontWeight="semibold">"{snippetRef.current?.name}"</Text> with current editor content?</Text>
          </AlertDialogBody>
          <AlertDialogFooter gap={2}>
            <Button ref={cancelUpdateRef} size="sm" variant="ghost" onClick={onUpdateClose} isDisabled={isSaving}>Cancel</Button>
            <Button size="sm" colorScheme="blue" onClick={handleUpdate} isLoading={isSaving} loadingText="Updating…">Yes, Update</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelDeleteRef} onClose={onDeleteClose} isCentered>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="md" fontWeight="bold">Delete Snippet</AlertDialogHeader>
          <AlertDialogBody>
            <Text fontSize="sm">Delete <Text as="span" fontWeight="semibold">"{snippetRef.current?.name}"</Text>? This cannot be undone.</Text>
          </AlertDialogBody>
          <AlertDialogFooter gap={2}>
            <Button ref={cancelDeleteRef} size="sm" variant="ghost" onClick={onDeleteClose} isDisabled={isDeleting}>Cancel</Button>
            <Button size="sm" colorScheme="red" onClick={handleDelete} isLoading={isDeleting} loadingText="Deleting…">Yes, Delete</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
