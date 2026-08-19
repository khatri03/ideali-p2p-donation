import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  MdArrowBack,
  MdAutoAwesome,
  MdClose,
  MdFormatAlignCenter,
  MdFormatAlignLeft,
  MdFormatAlignRight,
  MdFormatBold,
  MdFormatIndentDecrease,
  MdFormatIndentIncrease,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatUnderlined,
  MdImage,
  MdInsertLink,
  MdSearch,
  MdSend,
} from 'react-icons/md';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Card from 'themeComponents/card/Card';
import CharacterCounter from '../../common/CharacterCounter';
import { isRealAdmin } from '../../../service/organizer/rolesPermissions/permissionsService';
import CommonMethod from 'app/service/helpers/commonMethod';
import adminService, { OrganizerModule } from '../../../service/admin/adminService';
import notificationService from '../../../service/admin/notificationService';

// ─── Types ────────────────────────────────────────────────────────────────────

type SelectedOrganizer = {
  uniqueId: string;
  name: string;
  email: string;
};

// ─── Special characters ───────────────────────────────────────────────────────

const SPECIAL_CHARACTERS = [
  '©', '®', '™', '€', '£', '¥', '¢', '°', '±', '×', '÷',
  '•', '…', '—', '–', '¶', '§', '†', '‡', '≈', '≠', '≤',
  '≥', '←', '→', '↑', '↓', '↔', '♠', '♣', '♥', '♦', '★',
  '☆', '✓', '✗', '∞', '½', '¼', '¾', '⅓', '⅔', 'µ', 'π',
  'α', 'β', 'γ', 'δ', 'ε', 'λ', 'σ', 'ω', '∑', '∏', '∫',
  '√', '∆', '∇', '⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷',
];

// ─── Markdown → HTML converter ────────────────────────────────────────────────

const markdownToHtml = (md: string): string => {
  if (!md) return '';
  const processInline = (text: string): string =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  const lines = md.split('\n');
  const parts: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) { i++; continue; }
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(`<li>${processInline(lines[i].trim().replace(/^\d+\.\s*/, ''))}</li>`);
        i++;
      }
      parts.push(`<ol>${items.join('')}</ol>`);
      continue;
    }
    if (/^[-*]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(`<li>${processInline(lines[i].trim().replace(/^[-*]\s*/, ''))}</li>`);
        i++;
      }
      parts.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    parts.push(`<p>${processInline(trimmed)}</p>`);
    i++;
  }
  return parts.join('');
};

// ─── Toolbar button ───────────────────────────────────────────────────────────

function TBtn({ icon, label, isActive, onClick }: {
  icon: React.ReactElement;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip label={label} fontSize="xs">
      <IconButton
        aria-label={label}
        icon={icon}
        size="sm"
        variant={isActive ? 'solid' : 'ghost'}
        colorScheme={isActive ? 'blue' : 'gray'}
        onClick={onClick}
      />
    </Tooltip>
  );
}

// ─── AI inline panel ──────────────────────────────────────────────────────────

interface AiPanelProps {
  onDismiss: () => void;
  onInsert: (text: string) => void;
  onReplace: (text: string) => void;
}

function AiInlinePanel({ onDismiss, onInsert, onReplace }: AiPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onDismiss();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onDismiss]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onDismiss]);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const { default: HttpClient } = await import('app/service/httpClient/HttpClient');
      const response = await HttpClient.post('/api/OpenAI/ask', { prompt });
      const json = response.data ?? response;
      if (!json.success) throw new Error(json.message || 'AI generation failed');
      setResult(json.data || '');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to generate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      ref={panelRef}
      position="absolute" zIndex={1400} left={0} right={0} mt={1}
      bg="white" border="1px solid" borderColor="purple.200" borderRadius="lg"
      boxShadow="0 8px 32px rgba(128,0,255,0.12), 0 2px 8px rgba(0,0,0,0.10)"
      overflow="hidden" style={{ animation: 'aiPanelIn 0.18s ease' }}
    >
      <HStack px={3} py={2} bgGradient="linear(to-r, purple.500, blue.500)" justify="space-between">
        <HStack spacing={2}>
          <MdAutoAwesome size={15} color="white" />
          <Text fontSize="xs" fontWeight="bold" color="white" letterSpacing="wide">AI Notification Generator</Text>
        </HStack>
        <IconButton aria-label="Dismiss AI" icon={<MdClose size={14} />} size="xs" variant="ghost"
          color="white" _hover={{ bg: 'whiteAlpha.300' }} onClick={onDismiss} />
      </HStack>

      <HStack px={3} py={2} spacing={2} borderBottom="1px solid" borderColor="gray.100">
        <Input ref={inputRef} size="sm" placeholder="Describe what you need" value={prompt}
          onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') generate(); }}
          borderColor="purple.200" focusBorderColor="purple.400" borderRadius="md" fontSize="sm"
          disabled={loading} flex={1} />
        <Tooltip label="Generate (Enter)" fontSize="xs">
          <IconButton aria-label="Generate" icon={loading ? <Spinner size="xs" /> : <MdSend size={16} />}
            size="sm" colorScheme="purple" bgGradient="linear(to-r, purple.500, blue.500)"
            _hover={{ bgGradient: 'linear(to-r, purple.600, blue.600)' }}
            onClick={generate} isDisabled={!prompt.trim() || loading} />
        </Tooltip>
      </HStack>

      {error && (
        <Box px={3} py={2} bg="red.50" borderBottom="1px solid" borderColor="red.100">
          <Text fontSize="xs" color="red.600">{error}</Text>
        </Box>
      )}

      {loading && (
        <Box px={3} py={3}>
          <HStack spacing={2} mb={2}>
            <Spinner size="xs" color="purple.500" />
            <Text fontSize="xs" color="purple.600" fontWeight="medium">Generating…</Text>
          </HStack>
          {[80, 100, 65].map((w, i) => (
            <Box key={i} h="10px" mb={1.5} borderRadius="full" w={`${w}%`}
              sx={{ background: 'linear-gradient(90deg, #e9d5ff 25%, #c4b5fd 50%, #e9d5ff 75%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ))}
        </Box>
      )}

      {result && !loading && (
        <Box>
          <Box px={3} py={2} maxH="140px" overflowY="auto">
            <Text fontSize="xs" color="gray.500" mb={1} fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">Generated</Text>
            <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap" lineHeight="1.6">{result}</Text>
          </Box>
          <HStack px={3} py={2} spacing={2} borderTop="1px solid" borderColor="gray.100" bg="gray.50" justify="flex-end">
            <Button size="xs" variant="ghost" colorScheme="gray" onClick={generate}>↺ Regenerate</Button>
            <Button size="xs" variant="outline" colorScheme="blue" onClick={() => onInsert(result)}>Append</Button>
            <Button size="xs" colorScheme="purple" bgGradient="linear(to-r, purple.500, blue.500)"
              _hover={{ bgGradient: 'linear(to-r, purple.600, blue.600)' }} color="white"
              onClick={() => onReplace(result)}>Replace</Button>
          </HStack>
        </Box>
      )}

      {!result && !loading && !error && (
        <Box px={3} py={2} bg="purple.50">
          <Text fontSize="xs" color="purple.600">
            💡 Describe your notification and press <Text as="kbd" fontWeight="bold">Enter</Text> to generate content with AI.
          </Text>
        </Box>
      )}
    </Box>
  );
}

// ─── Organizer Multi-Select ───────────────────────────────────────────────────

type OrganizerPickerProps = {
  selected: SelectedOrganizer[];
  onChange: (selected: SelectedOrganizer[]) => void;
};

function OrganizerPicker({ selected, onChange }: OrganizerPickerProps) {
  const [organizers, setOrganizers] = useState<OrganizerModule[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const dropdownBg = useColorModeValue('white', 'gray.800');

  useEffect(() => { fetchOrganizers(); }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchOrganizers() {
    try {
      setLoadingOrgs(true);
      const response = await adminService.getActiveOrganizers(1, 200);
      setOrganizers(response.pageData || []);
    } catch { } finally { setLoadingOrgs(false); }
  }

  function toSelectedOrganizer(org: OrganizerModule): SelectedOrganizer {
    return { uniqueId: org.uniqueId, name: org.name, email: org.emailAddress };
  }

  function isSelected(org: OrganizerModule) {
    return selected.some((s) => s.uniqueId === org.uniqueId);
  }

  function toggleOrganizer(org: OrganizerModule) {
    if (isSelected(org)) onChange(selected.filter((s) => s.uniqueId !== org.uniqueId));
    else onChange([...selected, toSelectedOrganizer(org)]);
  }

  function removeSelected(uniqueId: string) {
    onChange(selected.filter((s) => s.uniqueId !== uniqueId));
  }

  const filtered = organizers.filter(
    (o) => o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.emailAddress?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box ref={containerRef} position="relative">
      <Flex minH="42px" border="1px solid" borderColor={borderColor} borderRadius="md"
        px={3} py={2} gap={2} wrap="wrap" align="center" cursor="text"
        onClick={() => setIsOpen(true)} _hover={{ borderColor: 'blue.400' }} bg="white">
        {selected.map((org) => (
          <Badge key={org.uniqueId} colorScheme="blue" borderRadius="full" px={3} py={1}
            display="flex" alignItems="center" gap={1} fontWeight="medium" fontSize="sm">
            {org.name}
            <Icon as={MdClose} w={3.5} h={3.5} cursor="pointer" ml={1}
              onClick={(e) => { e.stopPropagation(); removeSelected(org.uniqueId); }} />
          </Badge>
        ))}
        {selected.length === 0 && <Text color="gray.400" fontSize="sm" userSelect="none">Select organizers...</Text>}
        <Box ml="auto"><Icon as={MdSearch} color="gray.400" w={4} h={4} /></Box>
      </Flex>

      {selected.length > 0 && (
        <Text fontSize="xs" color="gray.500" mt={1}>
          {selected.length} organizer{selected.length !== 1 ? 's' : ''} selected
        </Text>
      )}

      {isOpen && (
        <Box position="absolute" top="calc(100% + 4px)" left={0} right={0} zIndex={1000}
          bg={dropdownBg} border="1px solid" borderColor={borderColor} borderRadius="md"
          boxShadow="lg" maxH="260px" overflow="hidden" display="flex" flexDirection="column">
          <Box p={2} borderBottom="1px solid" borderColor={borderColor}>
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none"><MdSearch color="gray" /></InputLeftElement>
              <Input placeholder="Search organizers..." value={search}
                onChange={(e) => setSearch(e.target.value)} autoFocus
                onClick={(e) => e.stopPropagation()} />
            </InputGroup>
          </Box>
          <Box overflowY="auto" flex={1}>
            {loadingOrgs ? (
              <Flex justify="center" py={4}><Spinner size="sm" color="blue.500" /></Flex>
            ) : filtered.length === 0 ? (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>No organizers found</Text>
            ) : (
              filtered.map((org) => {
                const sel = isSelected(org);
                return (
                  <Flex key={org.uniqueId} px={3} py={2} align="center" gap={2} cursor="pointer"
                    bg={sel ? 'blue.50' : 'transparent'} _hover={{ bg: sel ? 'blue.100' : 'gray.50' }}
                    onClick={() => toggleOrganizer(org)}>
                    <Box w={4} h={4} border="2px solid" borderColor={sel ? 'blue.500' : 'gray.300'}
                      borderRadius="sm" bg={sel ? 'blue.500' : 'white'} display="flex"
                      alignItems="center" justifyContent="center" flexShrink={0}>
                      {sel && (
                        <Icon viewBox="0 0 24 24" w={3} h={3} color="white">
                          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </Icon>
                      )}
                    </Box>
                    <Box flex={1} overflow="hidden">
                      <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{org.name}</Text>
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>{org.emailAddress}</Text>
                    </Box>
                  </Flex>
                );
              })
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateNotification() {
  const navigate = useNavigate();
  const toast = useToast();

  const [selectedOrganizers, setSelectedOrganizers] = useState<SelectedOrganizer[]>([]);
  const [subject, setSubject] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<{ recipients?: string; subject?: string; content?: string }>({});

  const labelColor = useColorModeValue('gray.700', 'gray.200');

  // ── Modal disclosures ─────────────────────────────────────────────────────
  const { isOpen: isCharOpen, onOpen: onCharOpen, onClose: onCharClose } = useDisclosure();
  const { isOpen: isLinkOpen, onOpen: onLinkOpen, onClose: onLinkClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();

  // ── Editor state ──────────────────────────────────────────────────────────
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [savedSelection, setSavedSelection] = useState<{ from: number; to: number } | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiAnchorTop, setAiAnchorTop] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const aiTriggerPosRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRealAdmin()) navigate('/auth/sign-in/custom');
  }, [navigate]);

  // ── TipTap editor ─────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      TextAlign.configure({ types: ['paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
      Image,
      Placeholder.configure({ placeholder: 'Write your notification content...' }),
    ],
    content: '',
    // AI feature disabled
    // onUpdate: ({ editor }) => {
    //   const from = editor.state.selection.from;
    //   const before = editor.state.doc.textBetween(Math.max(0, from - 3), from);
    //   if (before.endsWith('/ai') && !showAiPanel) {
    //     aiTriggerPosRef.current = from;
    //     const domPos = editor.view.domAtPos(from);
    //     const node = domPos.node as HTMLElement;
    //     const nodeEl = node.nodeType === 3 ? node.parentElement : (node as HTMLElement);
    //     const wrapperRect = editorWrapperRef.current?.getBoundingClientRect();
    //     const nodeRect = nodeEl?.getBoundingClientRect();
    //     if (wrapperRect && nodeRect) setAiAnchorTop(nodeRect.bottom - wrapperRect.top);
    //     setShowAiPanel(true);
    //   }
    // },
  });

  // ── AI handlers ───────────────────────────────────────────────────────────
  const deleteAiTrigger = useCallback(() => {
    if (!editor || aiTriggerPosRef.current === null) return;
    const pos = aiTriggerPosRef.current;
    editor.chain().focus().deleteRange({ from: Math.max(0, pos - 3), to: pos }).run();
    aiTriggerPosRef.current = null;
  }, [editor]);

  const dismissAiPanel = useCallback(() => {
    deleteAiTrigger();
    setShowAiPanel(false);
    editor?.chain().focus().run();
  }, [deleteAiTrigger, editor]);

  const handleAiInsert = useCallback((text: string) => {
    if (!editor) return;
    deleteAiTrigger();
    editor.chain().focus().insertContent(markdownToHtml(text)).run();
    setShowAiPanel(false);
  }, [editor, deleteAiTrigger]);

  const handleAiReplace = useCallback((text: string) => {
    if (!editor) return;
    editor.commands.setContent(markdownToHtml(text), { emitUpdate: true });
    setShowAiPanel(false);
    aiTriggerPosRef.current = null;
  }, [editor]);

  // ── Editor helpers ────────────────────────────────────────────────────────
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (savedSelection !== null) editor.chain().focus().setTextSelection(savedSelection.from).run();
      else editor.chain().focus().run();
      editor.chain().setImage({ src: base64 }).run();
      setSavedSelection(null);
      onImageClose();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [editor, savedSelection, onImageClose]);

  const insertSpecialChar = useCallback((char: string) => {
    editor?.chain().focus().insertContent(char).run();
    onCharClose();
  }, [editor, onCharClose]);

  const insertLink = useCallback(() => {
    if (!linkUrl || !editor) return;
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    if (savedSelection !== null) {
      const { from, to } = savedSelection;
      editor.chain().focus().setTextSelection(from !== to ? { from, to } : from).run();
    } else {
      editor.chain().focus().run();
    }
    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().setLink({ href: url }).run();
    } else {
      editor.chain().insertContent({
        type: 'text', text: url,
        marks: [{ type: 'link', attrs: { href: url, target: '_blank', rel: 'noopener noreferrer' } }],
      }).run();
    }
    setLinkUrl('');
    setSavedSelection(null);
    onLinkClose();
  }, [editor, linkUrl, savedSelection, onLinkClose]);

  const insertImage = useCallback(() => {
    if (!imageUrl || !editor) return;
    if (savedSelection !== null) editor.chain().focus().setTextSelection(savedSelection.from).run();
    else editor.chain().focus().run();
    editor.chain().setImage({ src: imageUrl }).run();
    setImageUrl('');
    setSavedSelection(null);
    onImageClose();
  }, [editor, imageUrl, savedSelection, onImageClose]);

  function getContentHtml(): string { return editor?.getHTML() || ''; }
  function getContentText(): string { return editor?.getText() || ''; }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (selectedOrganizers.length === 0) newErrors.recipients = 'Please select at least one recipient.';
    if (!subject.trim()) newErrors.subject = 'Subject is required.';
    if (!getContentText().trim()) newErrors.content = 'Content is required.';
    else if (getContentText().length > 2000) newErrors.content = 'Content must not exceed 2,000 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSend() {
    if (!validate()) return;
    try {
      setIsSending(true);
      const response = await notificationService.createNotification({
        subject: subject.trim(),
        content: getContentHtml(),
        organizerUniqueIds: selectedOrganizers.map((o) => o.uniqueId),
      });
      toast({
        title: 'Notification Sent',
        description: response.message || `Sent to ${selectedOrganizers.length} organiser(s).`,
        status: 'success',
        position: 'top-right',
      });
      navigate('/admin/notification-center/list');
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSending(false);
    }
  }

  const contentLength = editor?.getText().length ?? 0;

  return (
    <>
      <style>{`
        @keyframes aiPanelIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <Flex direction="column" pt={{ sm: '125px', lg: '75px' }} gap={4}>

        <HStack spacing={2} align="center">
          <IconButton aria-label="Back" icon={<MdArrowBack />} variant="ghost" size="sm"
            onClick={() => navigate('/admin/notification-center/list')} />
          <Text fontSize="lg" fontWeight="bold">Create Notification</Text>
        </HStack>

        <Card>
          <VStack spacing={6} align="stretch">

            {/* Recipients */}
            <FormControl isInvalid={!!errors.recipients}>
              <FormLabel fontSize="sm" fontWeight="semibold" color={labelColor}>
                Recipients <Text as="span" color="red.400">*</Text>
              </FormLabel>
              <OrganizerPicker
                selected={selectedOrganizers}
                onChange={(orgs) => {
                  setSelectedOrganizers(orgs);
                  if (orgs.length > 0) setErrors((e) => ({ ...e, recipients: undefined }));
                }}
              />
              <FormErrorMessage>{errors.recipients}</FormErrorMessage>
            </FormControl>

            {/* Subject */}
            <FormControl isInvalid={!!errors.subject}>
              <FormLabel fontSize="sm" fontWeight="semibold" color={labelColor}>
                Subject <Text as="span" color="red.400">*</Text>
              </FormLabel>
              <Input
                placeholder="Enter notification subject"
                value={subject}
                maxLength={50}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (e.target.value.trim()) setErrors((e_) => ({ ...e_, subject: undefined }));
                }}
              />
              <Flex justify="space-between" align="flex-start" mt={1}>
                <FormErrorMessage mt={0}>{errors.subject}</FormErrorMessage>
                <Text fontSize="xs" color={subject.length >= 40 ? 'orange.500' : 'gray.400'} flexShrink={0}>
                  {subject.length}/50
                </Text>
              </Flex>
            </FormControl>

            {/* Content */}
            <FormControl isInvalid={!!errors.content}>
              <FormLabel fontSize="sm" fontWeight="semibold" color={labelColor}>
                Content <Text as="span" color="red.400">*</Text>
              </FormLabel>

              <Box border="1px solid" borderColor={errors.content ? 'red.400' : 'gray.200'} borderRadius="md">
                {/* Toolbar */}
                <HStack px={2} py={1} borderBottom="1px solid" borderColor="gray.200" bg="gray.50"
                  flexWrap="wrap" spacing={0} gap={0.5}>
                  <TBtn icon={<MdFormatBold size={18} />} label="Bold" isActive={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} />
                  <TBtn icon={<MdFormatItalic size={18} />} label="Italic" isActive={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} />
                  <TBtn icon={<MdFormatUnderlined size={18} />} label="Underline" isActive={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()} />

                  <Box w="1px" h="24px" bg="gray.300" mx={1} />

                  <TBtn icon={<MdFormatAlignLeft size={18} />} label="Align Left" isActive={editor?.isActive({ textAlign: 'left' })} onClick={() => editor?.chain().focus().setTextAlign('left').run()} />
                  <TBtn icon={<MdFormatAlignCenter size={18} />} label="Align Center" isActive={editor?.isActive({ textAlign: 'center' })} onClick={() => editor?.chain().focus().setTextAlign('center').run()} />
                  <TBtn icon={<MdFormatAlignRight size={18} />} label="Align Right" isActive={editor?.isActive({ textAlign: 'right' })} onClick={() => editor?.chain().focus().setTextAlign('right').run()} />

                  <Box w="1px" h="24px" bg="gray.300" mx={1} />

                  <TBtn icon={<MdFormatListBulleted size={18} />} label="Bullet List" isActive={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
                  <TBtn icon={<MdFormatListNumbered size={18} />} label="Numbered List" isActive={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
                  {/* <TBtn icon={<MdFormatIndentDecrease size={18} />} label="Decrease Indent" onClick={() => editor?.chain().focus().liftListItem('listItem').run()} />
                  <TBtn icon={<MdFormatIndentIncrease size={18} />} label="Increase Indent" onClick={() => editor?.chain().focus().sinkListItem('listItem').run()} /> */}

                  <Box w="1px" h="24px" bg="gray.300" mx={1} />

                  <TBtn
                    icon={<MdInsertLink size={18} />}
                    label="Insert Link"
                    isActive={editor?.isActive('link')}
                    onClick={() => {
                      if (editor?.isActive('link')) {
                        editor.chain().focus().unsetLink().run();
                      } else {
                        setSavedSelection(editor ? { from: editor.state.selection.from, to: editor.state.selection.to } : null);
                        setLinkUrl(editor?.getAttributes('link').href || '');
                        onLinkOpen();
                      }
                    }}
                  />

                  {/* <TBtn icon={<MdImage size={18} />} label="Insert Image" onClick={() => {
                    setSavedSelection(editor?.state.selection.anchor ?? null);
                    setImageUrl('');
                    onImageOpen();
                  }} /> */}

                  {/* <Box w="1px" h="24px" bg="gray.300" mx={1} />

                  <Tooltip label="Special Characters" fontSize="xs">
                    <Button size="sm" variant="ghost" fontWeight="bold" fontSize="md" onClick={onCharOpen} minW="auto" px={2}>Ω</Button>
                  </Tooltip>

                  <Box w="1px" h="24px" bg="gray.300" mx={1} /> */}

                  {/* <Tooltip label="Click to activate AI assistant" fontSize="xs" placement="top">
                    <HStack spacing={1} px={2} py={0.5} borderRadius="full" bg="purple.50"
                      border="1px solid" borderColor="purple.200" cursor="pointer" userSelect="none"
                      _hover={{ bg: 'purple.100', borderColor: 'purple.300' }} transition="all 0.15s ease"
                      onClick={() => {
                        if (!showAiPanel) { aiTriggerPosRef.current = null; setAiAnchorTop(0); setShowAiPanel(true); }
                        else setShowAiPanel(false);
                      }}>
                      <MdAutoAwesome size={12} color="#805AD5" />
                      <Text fontSize="xs" color="purple.600" fontWeight="semibold">/ai</Text>
                    </HStack>
                  </Tooltip> */}
                </HStack>

                {/* Editor + AI panel */}
                <Box position="relative" ref={editorWrapperRef}>
                  <Box overflow="hidden" sx={{
                    '.ProseMirror': {
                      minHeight: '160px', maxHeight: '320px', overflowY: 'auto',
                      padding: '12px', fontSize: '14px', lineHeight: '1.6', outline: 'none',
                      '& p': { margin: '0 0 0.5em 0' },
                      '& ul, & ol': { paddingLeft: '1.5em' },
                      '& a': { color: '#3182CE', textDecoration: 'underline' },
                      '& img': { maxWidth: '100%', maxHeight: '300px', height: 'auto', objectFit: 'contain', display: 'block', borderRadius: '4px' },
                    },
                    '.ProseMirror p.is-editor-empty:first-of-type::before': {
                      content: 'attr(data-placeholder)', color: '#A0AEC0', pointerEvents: 'none', float: 'left', height: 0,
                    },
                  }}>
                    <EditorContent editor={editor} />
                  </Box>
                  {/* AI feature disabled:
                  {showAiPanel && (
                    <Box position="absolute" top={`${aiAnchorTop}px`} left="8px" right="8px" zIndex={1400}>
                      <AiInlinePanel onDismiss={dismissAiPanel} onInsert={handleAiInsert} onReplace={handleAiReplace} />
                    </Box>
                  )} */}
                </Box>
              </Box>
              <CharacterCounter currentLength={contentLength} maxLength={2000} />
              <FormErrorMessage>{errors.content}</FormErrorMessage>
            </FormControl>

            {/* Actions */}
            <HStack spacing={3} pt={2}>
              <Button leftIcon={<MdSend />} bg="#044bd9" color="white" _hover={{ bg: '#033fb6' }}
                isLoading={isSending} loadingText="Sending..." onClick={handleSend}>
                Send Notification
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin/notification-center/list')} isDisabled={isSending}>
                Cancel
              </Button>
            </HStack>
          </VStack>
        </Card>
      </Flex>

      {/* Hidden file input */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />

      {/* Special Characters Modal */}
      <Modal isOpen={isCharOpen} onClose={onCharClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Insert Special Character</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SimpleGrid columns={10} spacing={1}>
              {SPECIAL_CHARACTERS.map((char) => (
                <Button key={char} size="sm" variant="outline" fontSize="lg"
                  onClick={() => insertSpecialChar(char)} _hover={{ bg: 'blue.50' }}>{char}</Button>
              ))}
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Insert Link Modal */}
      <Modal isOpen={isLinkOpen} onClose={onLinkClose} size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Insert Link</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input placeholder="https://example.com" value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && insertLink()} />
          </ModalBody>
          <ModalFooter>
            <Button size="sm" mr={2} onClick={onLinkClose}>Cancel</Button>
            <Button size="sm" colorScheme="blue" onClick={insertLink}>Insert</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Insert Image Modal */}
      <Modal isOpen={isImageOpen} onClose={onImageClose} size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Insert Image</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" mb={2} fontWeight="medium">Upload from device</Text>
            <Button size="sm" w="100%" mb={4} onClick={() => fileInputRef.current?.click()}>Choose File</Button>
            <Text fontSize="sm" mb={2} fontWeight="medium">Or paste image URL</Text>
            <Input placeholder="https://example.com/image.jpg" value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && insertImage()} />
          </ModalBody>
          <ModalFooter>
            <Button size="sm" mr={2} onClick={onImageClose}>Cancel</Button>
            <Button size="sm" colorScheme="blue" onClick={insertImage} isDisabled={!imageUrl}>Insert URL</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
