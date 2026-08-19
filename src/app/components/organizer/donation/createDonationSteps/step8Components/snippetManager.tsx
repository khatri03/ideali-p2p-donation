import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import {
  MdBookmark,
  MdBookmarkAdd,
  MdArrowDropDown,
  MdArrowDropUp,
  MdChevronLeft,
  MdDelete,
  MdEdit,
} from 'react-icons/md';
import campaignEditorService, {
  SnippetItem,
} from '../../../../../service/organizer/donation/campaignEditorService';
import { hasPermission } from '../../../../../service/organizer/rolesPermissions/permissionsService';

// ─── Types ────────────────────────────────────────────────────────────────────
type MenuView  = 'root' | 'list';

interface SnippetManagerProps {
  editorHtml: string;
  onInsert: (html: string) => void;
}

const ROW: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
  userSelect: 'none', transition: 'background 0.1s',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SnippetManager({ editorHtml, onInsert }: SnippetManagerProps) {


  // ── dropdown ─────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen]     = useState(false);
  const [menuView, setMenuView] = useState<MenuView>('root');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const wrapperRef              = useRef<HTMLDivElement>(null);

  // ── snippets ──────────────────────────────────────────────────────────────
  const [snippets, setSnippets]           = useState<SnippetItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError]         = useState<string | null>(null);

  // ── snippet held in ref — never cleared before API fires ─────────────────
  const snippetRef = useRef<SnippetItem | null>(null);

  // ── form (create / save-as-new) ───────────────────────────────────────────
  const [formName, setFormName]               = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSaving, setIsSaving]               = useState(false);
  const [isDeleting, setIsDeleting]           = useState(false);

  // ── disclosures ───────────────────────────────────────────────────────────
  const { isOpen: isFormOpen,   onOpen: onFormOpen,   onClose: onFormClose }   = useDisclosure();
  const { isOpen: isUpdateOpen, onOpen: onUpdateOpen, onClose: onUpdateClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelUpdateRef = useRef<HTMLButtonElement>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const [formNameError, setFormNameError] = useState('');

  // ── outside click closes dropdown ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);



  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchSnippets = useCallback(async () => {
    if (!hasPermission('donation:email-snippet:view')) return;
    setIsLoadingList(true);
    setListError(null);
    try {
      const res  = await campaignEditorService.getSnippets();
      const data = res?.data as any;
      if (Array.isArray(data)) {
        setSnippets(data);
      } else if (data?.pageData && Array.isArray(data.pageData)) {
        setSnippets(data.pageData);
      } else {
        setSnippets([]);
      }
    } catch {
      setListError('Failed to load snippets.');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => { fetchSnippets(); }, [fetchSnippets]);

  // ── compute dropdown position ─────────────────────────────────────────────
  const computeDropdownStyle = (): React.CSSProperties => {
    if (!wrapperRef.current) return {};
    const DROPDOWN_W = 240;
    const MARGIN     = 8;
    const rect       = wrapperRef.current.getBoundingClientRect();
    const vpW        = window.innerWidth;

    let left = rect.right - DROPDOWN_W;
    if (left < MARGIN) left = MARGIN;
    if (left + DROPDOWN_W > vpW - MARGIN) left = vpW - DROPDOWN_W - MARGIN;

    return {
      position: 'fixed',
      top:  rect.bottom + 4,
      left: Math.max(MARGIN, left),
      width: Math.min(DROPDOWN_W, vpW - MARGIN * 2),
    };
  };

  const closeDropdown = () => { setIsOpen(false); setMenuView('root'); };

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      setMenuView('root');
      setDropdownStyle(computeDropdownStyle());
      setIsOpen(true);
    }
  };

  const goToList = () => { setMenuView('list'); };


  const hoverGray = (e: React.MouseEvent, on: boolean) => { (e.currentTarget as HTMLElement).style.background = on ? '#F7FAFC' : ''; };
  const hoverBlue = (e: React.MouseEvent, on: boolean) => { (e.currentTarget as HTMLElement).style.background = on ? '#EBF8FF' : ''; };
  const hoverRed  = (e: React.MouseEvent, on: boolean) => { (e.currentTarget as HTMLElement).style.background = on ? '#FFF5F5' : ''; };

  // ── open create modal ─────────────────────────────────────────────────────
  const openCreate = () => {
    setFormName('');
    setFormDescription('');
    setFormNameError(''); 
    closeDropdown();
    onFormOpen();
  };

  // ── open delete confirm for a specific snippet ────────────────────────────
  const openDeleteConfirm = (e: React.MouseEvent, s: SnippetItem) => {
    e.stopPropagation();
    snippetRef.current = s;
    closeDropdown();
    onDeleteOpen();
  };

  // ── open update confirm (overwrites template) ─────────────────────────────
  const openUpdateConfirm = (e: React.MouseEvent, s: SnippetItem) => {
    e.stopPropagation();
    snippetRef.current = s;
    closeDropdown();
    onUpdateOpen();
  };

  // ── API: create new snippet ───────────────────────────────────────────────
  const handleFormSave = useCallback(async () => {
    if (!formName.trim()) return;
    setIsSaving(true);
    try {
      const res = await campaignEditorService.createSnippet({
        name: formName.trim(),
        template: editorHtml,
        ...(formDescription.trim() ? { description: formDescription.trim() } : {}),
      });
      if (res?.success) {
        const saved: SnippetItem = res.data?.uniqueId
          ? res.data
          : { uniqueId: Date.now().toString(), name: formName.trim(), template: editorHtml, description: formDescription.trim() || undefined };
        setSnippets((prev) => [...prev, saved]);
        toast({ title: 'Snippet created', status: 'success', duration: 3000, isClosable: true, position: 'top-right' });
        onFormClose();
      } else {
        toast({ title: 'Failed to save', description: res?.message ?? 'Please try again.', status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
    } finally {
      setIsSaving(false);
    }
  }, [formName, formDescription, editorHtml, onFormClose, toast]);

  // ── API: update template of existing snippet ──────────────────────────────
  const handleUpdate = useCallback(async () => {
    const s = snippetRef.current;
    if (!s) return;
    setIsSaving(true);
    try {
      const res = await campaignEditorService.updateSnippet(s.uniqueId, {
        uniqueId:    s.uniqueId,
        name:        s.name,
        template:    editorHtml,
        description: s.description,
      });
      if (res?.success) {
        setSnippets((prev) => prev.map((x) => x.uniqueId === s.uniqueId ? { ...x, template: editorHtml } : x));
        toast({ title: 'Snippet updated', description: `"${s.name}" template updated.`, status: 'success', duration: 3000, isClosable: true, position: 'top-right' });
        onUpdateClose();
        snippetRef.current = null;
      } else {
        toast({ title: 'Failed to update', description: res?.message ?? 'Please try again.', status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
    } finally {
      setIsSaving(false);
    }
  }, [editorHtml, onUpdateClose, toast]);

  // ── API: delete ───────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    const s = snippetRef.current;
    if (!s) return;
    setIsDeleting(true);
    try {
      const res = await campaignEditorService.deleteSnippet(s.uniqueId);
      if (res?.success) {
        setSnippets((prev) => prev.filter((x) => x.uniqueId !== s.uniqueId));
        toast({ title: 'Snippet deleted', description: `"${s.name}" deleted.`, status: 'info', duration: 3000, isClosable: true, position: 'top-right' });
        onDeleteClose();
        snippetRef.current = null;
      } else {
        toast({ title: 'Failed to delete', description: res?.message ?? 'Please try again.', status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
    } finally {
      setIsDeleting(false);
    }
  }, [onDeleteClose, toast]);

  // ── hide entirely when user lacks the view permission ─────────────────────
  if (!hasPermission('donation:email-snippet:view')) return null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Box ref={wrapperRef} position="relative" display="inline-block">

        {/* Trigger button */}
        <Tooltip label="Snippets" fontSize="xs" openDelay={400}>
          <Button size="xs" variant="ghost" h="26px" px={2}
            leftIcon={<MdBookmark size={14} />}
            rightIcon={isOpen ? <MdArrowDropUp /> : <MdArrowDropDown />}
            onClick={toggleDropdown}
          >
            <Text fontSize="11px">Snippets</Text>
          </Button>
        </Tooltip>

        {/* Dropdown */}
        {isOpen && (
          <Box
            style={dropdownStyle}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="8px"
            boxShadow="lg"
            zIndex={2000}
            overflow="hidden"
          >

            {/* ══ ROOT ══ */}
            {menuView === 'root' && (
              <>
                {hasPermission('donation:email-snippet:view') && snippets.length > 0 && (
                  <Flex style={ROW} justify="space-between"
                    onMouseEnter={(e) => hoverGray(e, true)} onMouseLeave={(e) => hoverGray(e, false)}
                    onClick={goToList}
                  >
                    <Flex align="center" gap={2}>
                      <MdBookmark size={14} color="#4A5568" />
                      <Text fontSize="13px" color="gray.700">Your snippets</Text>
                    </Flex>
                    <Box as={MdArrowDropDown} size="18px" color="#A0AEC0" />
                  </Flex>
                )}

                {hasPermission('donation:email-snippet:view') && snippets.length > 0 && <Box borderTop="1px solid" borderColor="gray.100" />}

                {hasPermission('donation:email-snippet:create') && (
                  <Flex style={ROW}
                    onMouseEnter={(e) => hoverGray(e, true)} onMouseLeave={(e) => hoverGray(e, false)}
                    onClick={openCreate}
                  >
                    <MdBookmarkAdd size={14} color="#4A5568" />
                    <Text fontSize="13px" color="gray.700">Save as new snippet</Text>
                  </Flex>
                )}


              </>
            )}

            {/* ══ LIST ══ */}
            {menuView === 'list' && (
              <>
                {/* Back header */}
                <Flex style={ROW} borderBottom="1px solid" borderColor="gray.100"
                  onMouseEnter={(e) => hoverGray(e, true)} onMouseLeave={(e) => hoverGray(e, false)}
                  onClick={() => setMenuView('root')}
                >
                  <MdChevronLeft size={16} color="#718096" />
                  <Text fontSize="12px" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.04em">
                    Your snippets
                  </Text>
                </Flex>

                <Box maxH="260px" overflowY="auto">
                  {isLoadingList ? (
                    <Flex align="center" gap={2} px={3} py={3}>
                      <Spinner size="xs" color="blue.500" />
                      <Text fontSize="xs" color="gray.500">Loading…</Text>
                    </Flex>
                  ) : listError ? (
                    <Text fontSize="xs" color="red.400" px={3} py={3}>{listError}</Text>
                  ) : snippets.length === 0 ? (
                    <Text fontSize="xs" color="gray.400" px={3} py={3}>No snippets saved yet</Text>
                  ) : snippets.map((s) => (
                    <Flex
                      key={s.uniqueId}
                      align="center"
                      px={3} py="8px"
                      borderBottom="1px solid" borderColor="gray.50"
                      style={{ transition: 'background 0.1s' }}
                      onMouseEnter={(e) => hoverBlue(e, true)}
                      onMouseLeave={(e) => hoverBlue(e, false)}
                    >
                      {/* Snippet name — click to insert */}
                      <Box flex={1} minW={0} cursor="pointer"
                        onClick={() => { onInsert(s.template); closeDropdown(); }}
                      >
                        <Text fontSize="13px" fontWeight="500" color="blue.600" noOfLines={1}>
                          {s.name}
                        </Text>
                        {s.description && (
                          <Text fontSize="11px" color="gray.400" noOfLines={1}>{s.description}</Text>
                        )}
                      </Box>

                      {/* Action icons */}
                      <Flex gap={1} flexShrink={0} ml={2}>
                        {hasPermission('donation:email-snippet:edit') && (
                          <Tooltip label="Update template" fontSize="xs" openDelay={300}>
                            <IconButton
                              aria-label="Update template"
                              icon={<MdEdit size={13} />}
                              size="xs"
                              variant="ghost"
                              colorScheme="green"
                              h="22px" w="22px" minW="22px"
                              onClick={(e) => openUpdateConfirm(e, s)}
                            />
                          </Tooltip>
                        )}

                        {hasPermission('donation:email-snippet:delete') && (
                          <Tooltip label="Delete snippet" fontSize="xs" openDelay={300}>
                            <IconButton
                              aria-label="Delete snippet"
                              icon={<MdDelete size={13} />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              h="22px" w="22px" minW="22px"
                              onClick={(e) => openDeleteConfirm(e, s)}
                            />
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

      {/* ════════ CREATE / EDIT NAME MODAL ════════ */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="md">Save as New Snippet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" gap={3}>
              <Box>
  <Text fontSize="xs" fontWeight="medium" mb={1}>
    Snippet Name <Text as="span" color="red.400">*</Text>
  </Text>
  <Input size="sm" placeholder="e.g. My closing message" value={formName} autoFocus
    onChange={(e) => {
      const val = e.target.value;
      setFormName(val);
      if (val.trim().length > 0 && (val.trim().length < 3 || val.trim().length > 40)) {
        setFormNameError('Name must be between 3 and 40 characters.');
      } else {
        setFormNameError('');
      }
    }}
    onKeyDown={(e) => e.key === 'Enter' && !isSaving && handleFormSave()}
    isInvalid={!!formNameError}
  />
  {formNameError && (
    <Text fontSize="xs" color="red.400" mt={1}>{formNameError}</Text>
  )}
</Box>
              <Box>
                <Text fontSize="xs" fontWeight="medium" mb={1}>
                  Description <Text as="span" color="gray.400" fontWeight="normal">(optional)</Text>
                </Text>
                <Textarea size="sm" placeholder="Short description…" value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)} rows={2} resize="none" />
              </Box>
              <Box>
                <Text fontSize="xs" fontWeight="medium" mb={1} color="gray.500">Template preview</Text>
                <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={2}
                  maxH="80px" overflowY="auto" bg="gray.50" fontSize="11px" color="gray.600" lineHeight="1.4"
                  dangerouslySetInnerHTML={{ __html: editorHtml || '<em style="color:#A0AEC0">Editor is empty</em>' }} />
              </Box>
            </Flex>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button size="sm" variant="ghost" onClick={onFormClose} isDisabled={isSaving}>Cancel</Button>
            <Button size="sm" colorScheme="blue" isLoading={isSaving} loadingText="Saving…"
  isDisabled={!formName.trim() || !!formNameError || formName.trim().length < 3}
  onClick={handleFormSave}>
  Save Snippet
</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ════════ UPDATE TEMPLATE CONFIRM ════════ */}
      <AlertDialog isOpen={isUpdateOpen} leastDestructiveRef={cancelUpdateRef} onClose={onUpdateClose} isCentered>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="md" fontWeight="bold">Update Snippet Template</AlertDialogHeader>
          <AlertDialogBody>
            <Text fontSize="sm">
              Are you sure you want to update{' '}
              <Text as="span" fontWeight="semibold">"{snippetRef.current?.name}"</Text>?
            </Text>
            <Text fontSize="xs" color="gray.500" mt={1}>
              This will replace its saved template with the current editor content.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter gap={2}>
            <Button ref={cancelUpdateRef} size="sm" variant="ghost" onClick={onUpdateClose} isDisabled={isSaving}>Cancel</Button>
            <Button size="sm" colorScheme="blue" onClick={handleUpdate} isLoading={isSaving} loadingText="Updating…">Yes, Update</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ════════ DELETE CONFIRM ════════ */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelDeleteRef} onClose={onDeleteClose} isCentered>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="md" fontWeight="bold">Delete Snippet</AlertDialogHeader>
          <AlertDialogBody>
            <Text fontSize="sm">
              Are you sure you want to delete{' '}
              <Text as="span" fontWeight="semibold">"{snippetRef.current?.name}"</Text>?
            </Text>
            <Text fontSize="xs" color="gray.500" mt={1}>This action cannot be undone.</Text>
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