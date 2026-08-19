import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Text,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  Button,
  IconButton,
  HStack,
  Tooltip,
  useDisclosure,
  Input,
  ModalFooter,
  Badge,
  Spinner,
  Portal,
} from '@chakra-ui/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatIndentIncrease,
  MdFormatIndentDecrease,
  MdInsertLink,
  MdImage,
  MdAutoAwesome,
  MdClose,
  MdSend,
} from 'react-icons/md';
import HttpClient from 'app/service/httpClient/HttpClient';
import CharacterCounter from '../../../../components/common/CharacterCounter';
import StepNavigationButtons from './shared/StepNavigationButtons';
import { Step3DescriptionProps } from './shared/types';
import { getTextLength } from '../../../../utils/textUtils';

const SPECIAL_CHARACTERS = [
  '©', '®', '™', '€', '£', '¥', '¢', '°', '±', '×', '÷',
  '•', '…', '—', '–', '¶', '§', '†', '‡', '≈', '≠', '≤',
  '≥', '←', '→', '↑', '↓', '↔', '♠', '♣', '♥', '♦', '★',
  '☆', '✓', '✗', '∞', '½', '¼', '¾', '⅓', '⅔', 'µ', 'π',
  'α', 'β', 'γ', 'δ', 'ε', 'λ', 'σ', 'ω', '∑', '∏', '∫',
  '√', '∆', '∇', '⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷',
];

const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Converts the subset of markdown the AI produces into Tiptap-compatible HTML.
 * Processes line-by-line so mixed types (numbered heading + bullet sub-items)
 * are each classified independently and grouped only when consecutive.
 */
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

    // Skip blank lines
    if (!trimmed) { i++; continue; }

    // Ordered list — line starts with a digit(s) then ". "
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(`<li>${processInline(lines[i].trim().replace(/^\d+\.\s*/, ''))}</li>`);
        i++;
      }
      parts.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Unordered list — line starts with "- " or "* "
    if (/^[-*]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(`<li>${processInline(lines[i].trim().replace(/^[-*]\s*/, ''))}</li>`);
        i++;
      }
      parts.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Plain paragraph
    parts.push(`<p>${processInline(trimmed)}</p>`);
    i++;
  }

  return parts.join('');
};

function TBtn({
  icon,
  label,
  isActive,
  onClick,
}: {
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

// ── Inline AI floating panel ──────────────────────────────────────────────────
interface AiPanelProps {
  onDismiss: () => void;
  onInsert: (text: string) => void;
  onReplace: (text: string) => void;
  anchor: { top: number; left: number; width: number };
}

function AiInlinePanel({ onDismiss, onInsert, onReplace, anchor }: AiPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-focus prompt input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onDismiss]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onDismiss]);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await HttpClient.post('/api/OpenAI/ask', { prompt });
      const json = response.data ?? response;
      if (!json.success) throw new Error(json.message || 'AI generation failed');
      setResult(json.data || '');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to generate. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Keep the panel within the viewport — cap its height to the space
  // remaining below the anchor so it never gets clipped by an ancestor's
  // overflow:hidden, and flip it above the anchor if there isn't enough room below.
  const margin = 12;
  const spaceBelow = window.innerHeight - anchor.top - margin;
  const spaceAbove = anchor.top - margin;
  const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow;
  const maxH = Math.max(160, Math.min(460, openUpward ? spaceAbove : spaceBelow));

  return (
    <Box
      ref={panelRef}
      position="fixed"
      zIndex={1400}
      top={openUpward ? undefined : `${anchor.top}px`}
      bottom={openUpward ? `${window.innerHeight - anchor.top}px` : undefined}
      left={`${anchor.left}px`}
      width={`${anchor.width}px`}
      bg="white"
      border="1px solid"
      borderColor="purple.200"
      borderRadius="lg"
      boxShadow="0 8px 32px rgba(128,0,255,0.12), 0 2px 8px rgba(0,0,0,0.10)"
      maxH={`${maxH}px`}
      display="flex"
      flexDirection="column"
      overflow="hidden"
      style={{ animation: 'aiPanelIn 0.18s ease' }}
    >
      {/* Header */}
      <HStack
        px={3}
        py={2}
        bgGradient="linear(to-r, purple.500, blue.500)"
        justify="space-between"
      >
        <HStack spacing={2}>
          <MdAutoAwesome size={15} color="white" />
          <Text fontSize="xs" fontWeight="bold" color="white" letterSpacing="wide">
            AI Description Generator
          </Text>
          {/* <Badge fontSize="9px" colorScheme="whiteAlpha" bg="whiteAlpha.300" color="white" borderRadius="full" px={2}>
            BETA
          </Badge> */}
        </HStack>
        <IconButton
          aria-label="Dismiss AI"
          icon={<MdClose size={14} />}
          size="xs"
          variant="ghost"
          color="white"
          _hover={{ bg: 'whiteAlpha.300' }}
          onClick={onDismiss}
        />
      </HStack>

      {/* Prompt row */}
      <HStack px={3} py={2} spacing={2} borderBottom="1px solid" borderColor="gray.100">
        <Input
          ref={inputRef}
          size="sm"
          placeholder="Describe what you need"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') generate(); }}
          borderColor="purple.200"
          focusBorderColor="purple.400"
          borderRadius="md"
          fontSize="sm"
          disabled={loading}
          flex={1}
        />
        <Tooltip label="Generate (Enter)" fontSize="xs">
          <IconButton
            aria-label="Generate"
            icon={loading ? <Spinner size="xs" /> : <MdSend size={16} />}
            size="sm"
            colorScheme="purple"
            bgGradient="linear(to-r, purple.500, blue.500)"
            _hover={{ bgGradient: 'linear(to-r, purple.600, blue.600)' }}
            onClick={generate}
            isDisabled={!prompt.trim() || loading}
          />
        </Tooltip>
      </HStack>

      {/* Error */}
      {error && (
        <Box px={3} py={2} bg="red.50" borderBottom="1px solid" borderColor="red.100">
          <Text fontSize="xs" color="red.600">{error}</Text>
        </Box>
      )}

      {/* Generating shimmer */}
      {loading && (
        <Box px={3} py={3}>
          <HStack spacing={2} mb={2}>
            <Spinner size="xs" color="purple.500" />
            <Text fontSize="xs" color="purple.600" fontWeight="medium">Generating…</Text>
          </HStack>
          {/* Shimmer lines */}
          {[80, 100, 65].map((w, i) => (
            <Box
              key={i}
              h="10px"
              mb={1.5}
              borderRadius="full"
              bg="purple.100"
              w={`${w}%`}
              sx={{
                background: 'linear-gradient(90deg, #e9d5ff 25%, #c4b5fd 50%, #e9d5ff 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
              }}
            />
          ))}
        </Box>
      )}

      {/* Result */}
      {result && !loading && (
        <>
          <Box flex="1" minH={0} overflowY="auto" px={3} py={2}>
            <Text fontSize="xs" color="gray.500" mb={1} fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
              Generated
            </Text>
            <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap" lineHeight="1.6">
              {result}
            </Text>
          </Box>
          <HStack
            px={3}
            py={2}
            spacing={2}
            borderTop="1px solid"
            borderColor="gray.100"
            bg="gray.50"
            justify="flex-end"
            flexShrink={0}
          >
            <Button
              size="xs"
              variant="ghost"
              colorScheme="gray"
              onClick={generate}
            >
              ↺ Regenerate
            </Button>
            <Button
              size="xs"
              variant="outline"
              colorScheme="blue"
              onClick={() => onInsert(result)}
            >
              Append
            </Button>
            <Button
              size="xs"
              colorScheme="purple"
              bgGradient="linear(to-r, purple.500, blue.500)"
              _hover={{ bgGradient: 'linear(to-r, purple.600, blue.600)' }}
              color="white"
              onClick={() => onReplace(result)}
            >
              Replace
            </Button>
          </HStack>
        </>
      )}

      {/* Hint when idle */}
      {!result && !loading && !error && (
        <Box px={3} py={2} bg="purple.50">
          <Text fontSize="xs" color="purple.600">
            💡 Describe your campaign and press <Text as="kbd" fontWeight="bold">Enter</Text> to generate a description with AI.
          </Text>
        </Box>
      )}
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Step3Description({
  description,
  descriptionCharCount,
  maxLength,
  descriptionError,
  onDescriptionChange,
  onSaveAndNext,
  onSkip,
  onPrevStep,
  isSubmitting,
  onSaveAndExit,
  isSavingAndExiting,
  stepTitle = 'Add Description',
  stepSubtitle = 'The donation description should clearly explain how the funds will be used, highlighting the purpose, beneficiaries, and specific needs being addressed to inspire trust and encourage contributions.',
  stepTitleFontSize = '32',
  stepTitleFontWeight = 'normal',
  stepTitleColor = 'inherit',
  stepSubtitleFontSize = '16',
  stepSubtitleColor = 'inherit',
  renderNavigation,
}: Step3DescriptionProps & {
  stepTitle?: string;
  stepSubtitle?: string;
  stepTitleFontSize?: string;
  stepTitleFontWeight?: string;
  stepTitleColor?: string;
  stepSubtitleFontSize?: string;
  stepSubtitleColor?: string;
  renderNavigation?: () => React.ReactNode;
}) {
  const { isOpen: isCharOpen, onOpen: onCharOpen, onClose: onCharClose } = useDisclosure();
  const { isOpen: isLinkOpen, onOpen: onLinkOpen, onClose: onLinkClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();

  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [savedSelection, setSavedSelection] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  // Inline AI panel state
  const [showAiPanel, setShowAiPanel] = useState(false);
  // Viewport-relative anchor (top/left/width in px) the panel is positioned against —
  // rendered through a Portal with position:fixed so it's never clipped by an
  // ancestor's overflow:hidden, regardless of how tall the generated text is.
  const [aiAnchor, setAiAnchor] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const aiButtonRef = useRef<HTMLDivElement>(null);
  // Cursor anchor ref stored so we can delete /ai text after dismissal
  const aiTriggerPosRef = useRef<number | null>(null);

  // ── Editor ─────────────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      TextAlign.configure({ types: ['paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Image,
      Placeholder.configure({
        placeholder: 'Type /ai to generate with AI, or start writing your description...',
      }),
    ],
    content: description || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onDescriptionChange(html, getTextLength(html));

      // Detect /ai trigger
      const from = editor.state.selection.from;
      // Look at the 3 chars before cursor
      const before = editor.state.doc.textBetween(Math.max(0, from - 3), from);
      if (before.endsWith('/ai') && !showAiPanel) {
        // Save cursor position so we can delete the /ai later
        aiTriggerPosRef.current = from;
        // Compute viewport-relative anchor from the cursor's DOM position
        const domPos = editor.view.domAtPos(from);
        const node = domPos.node as HTMLElement;
        const nodeEl = node.nodeType === 3 ? node.parentElement : (node as HTMLElement);
        const wrapperRect = editorWrapperRef.current?.getBoundingClientRect();
        const nodeRect = nodeEl?.getBoundingClientRect();
        if (wrapperRect && nodeRect) {
          setAiAnchor({ top: nodeRect.bottom + 4, left: wrapperRect.left, width: wrapperRect.width });
        }
        setShowAiPanel(true);
      }
    },
  });

  useEffect(() => {
    if (editor && description !== undefined) {
      const currentHtml = editor.getHTML();
      if (description !== currentHtml) {
        editor.commands.setContent(description || '', { emitUpdate: false });
      }
    }
  }, [description, editor]);

  // ── AI panel handlers ───────────────────────────────────────────────────────
  const deleteAiTrigger = useCallback(() => {
    if (!editor || aiTriggerPosRef.current === null) return;
    const pos = aiTriggerPosRef.current;
    // Delete the 3 chars "/ai" before the saved cursor position
    editor.chain().focus()
      .deleteRange({ from: Math.max(0, pos - 3), to: pos })
      .run();
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

  // ── Other editor helpers ────────────────────────────────────────────────────
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (savedSelection !== null) {
          editor.chain().focus().setTextSelection(savedSelection).run();
        } else {
          editor.chain().focus().run();
        }
        editor.chain().setImage({ src: base64 }).run();
        setSavedSelection(null);
        onImageClose();
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [editor, savedSelection, onImageClose],
  );

  const insertSpecialChar = useCallback(
    (char: string) => {
      editor?.chain().focus().insertContent(char).run();
      onCharClose();
    },
    [editor, onCharClose],
  );

  const insertLink = useCallback(() => {
    if (!linkUrl || !editor) return;
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    if (savedSelection !== null) {
      editor.chain().focus().setTextSelection(savedSelection).run();
    } else {
      editor.chain().focus().run();
    }
    editor.chain().extendMarkRange('link').setLink({ href: url }).run();
    setLinkUrl('');
    setSavedSelection(null);
    onLinkClose();
  }, [editor, linkUrl, savedSelection, onLinkClose]);

  const insertImage = useCallback(() => {
    if (!imageUrl || !editor) return;
    if (savedSelection !== null) {
      editor.chain().focus().setTextSelection(savedSelection).run();
    } else {
      editor.chain().focus().run();
    }
    editor.chain().setImage({ src: imageUrl }).run();
    setImageUrl('');
    setSavedSelection(null);
    onImageClose();
  }, [editor, imageUrl, savedSelection, onImageClose]);

  const isDescriptionEmpty = !description || stripHtmlTags(description).trim() === '';

  if (!editor) return null;

  return (
    <>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes aiPanelIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <Box maxW="100%">
        <Text fontSize={stepTitleFontSize} fontWeight={stepTitleFontWeight} color={stepTitleColor} mb="4">{stepTitle}</Text>
        <Text fontSize={stepSubtitleFontSize} color={stepSubtitleColor} mb="4">{stepSubtitle}</Text>

        <FormControl mb="3">
          <FormLabel>Description</FormLabel>

          <Box border="1px solid" borderColor="gray.200" borderRadius="md">
            {/* Toolbar */}
            <HStack
              px={2}
              py={1}
              borderBottom="1px solid"
              borderColor="gray.200"
              bg="gray.50"
              flexWrap="wrap"
              spacing={0}
              gap={0.5}
            >
              <TBtn icon={<MdFormatBold size={18} />} label="Bold" isActive={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
              <TBtn icon={<MdFormatItalic size={18} />} label="Italic" isActive={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
              <TBtn icon={<MdFormatUnderlined size={18} />} label="Underline" isActive={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />

              <Box w="1px" h="24px" bg="gray.300" mx={1} />

              <TBtn icon={<MdFormatAlignLeft size={18} />} label="Align Left" isActive={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} />
              <TBtn icon={<MdFormatAlignCenter size={18} />} label="Align Center" isActive={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
              <TBtn icon={<MdFormatAlignRight size={18} />} label="Align Right" isActive={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} />

              <Box w="1px" h="24px" bg="gray.300" mx={1} />

              <TBtn icon={<MdFormatListBulleted size={18} />} label="Bullet List" isActive={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
              <TBtn icon={<MdFormatListNumbered size={18} />} label="Numbered List" isActive={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
              <TBtn icon={<MdFormatIndentDecrease size={18} />} label="Decrease Indent" onClick={() => editor.chain().focus().liftListItem('listItem').run()} />
              <TBtn icon={<MdFormatIndentIncrease size={18} />} label="Increase Indent" onClick={() => editor.chain().focus().sinkListItem('listItem').run()} />

              <Box w="1px" h="24px" bg="gray.300" mx={1} />

              <TBtn
                icon={<MdInsertLink size={18} />}
                label="Insert Link"
                isActive={editor.isActive('link')}
                onClick={() => {
                  if (editor.isActive('link')) {
                    editor.chain().focus().unsetLink().run();
                  } else {
                    setSavedSelection(editor.state.selection.anchor);
                    setLinkUrl(editor.getAttributes('link').href || '');
                    onLinkOpen();
                  }
                }}
              />

              <TBtn icon={<MdImage size={18} />} label="Insert Image" onClick={() => {
                setSavedSelection(editor.state.selection.anchor);
                setImageUrl('');
                onImageOpen();
              }} />

              <Box w="1px" h="24px" bg="gray.300" mx={1} />

              {/* Special Characters */}
              <Tooltip label="Special Characters" fontSize="xs">
                <Button size="sm" variant="ghost" fontWeight="bold" fontSize="md" onClick={onCharOpen} minW="auto" px={2}>
                  Ω
                </Button>
              </Tooltip>

              <Box w="1px" h="24px" bg="gray.300" mx={1} />

              {/* AI button – click to open AI panel */}
              <Tooltip label='Click to activate AI assistant' fontSize="xs" placement="top">
                <HStack
                  ref={aiButtonRef}
                  spacing={1}
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  bg="purple.50"
                  border="1px solid"
                  borderColor="purple.200"
                  cursor="pointer"
                  userSelect="none"
                  _hover={{ bg: 'purple.100', borderColor: 'purple.300' }}
                  transition="all 0.15s ease"
                  onClick={() => {
                    if (!showAiPanel) {
                      // No /ai text to clean up – opened via button
                      aiTriggerPosRef.current = null;
                      const btnRect = aiButtonRef.current?.getBoundingClientRect();
                      const wrapperRect = editorWrapperRef.current?.getBoundingClientRect();
                      if (btnRect && wrapperRect) {
                        setAiAnchor({ top: btnRect.bottom + 4, left: wrapperRect.left, width: wrapperRect.width });
                      }
                      setShowAiPanel(true);
                    } else {
                      setShowAiPanel(false);
                    }
                  }}
                >
                  <MdAutoAwesome size={12} color="#805AD5" />
                  <Text fontSize="xs" color="purple.600" fontWeight="semibold">
                    /ai
                  </Text>
                </HStack>
              </Tooltip>
            </HStack>

            {/* Editor + AI panel wrapper — position:relative so panel can anchor */}
            <Box position="relative" ref={editorWrapperRef}>
              <Box
                overflow="hidden"
                sx={{
                  '.ProseMirror': {
                    minHeight: '150px',
                    maxHeight: 'clamp(180px, 35vh, 400px)',
                    overflowY: 'auto',
                    padding: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    '& p': { margin: '0 0 0.5em 0' },
                    '& ul, & ol': { paddingLeft: '1.5em' },
                    '& a': { color: '#3182CE', textDecoration: 'underline' },
                    '& img': {
                      maxWidth: '100%',
                      maxHeight: '300px',
                      height: 'auto',
                      objectFit: 'contain',
                      display: 'block',
                      borderRadius: '4px',
                    },
                  },
                  '.ProseMirror p.is-editor-empty:first-of-type::before': {
                    content: 'attr(data-placeholder)',
                    color: '#A0AEC0',
                    pointerEvents: 'none',
                    float: 'left',
                    height: 0,
                  },
                }}
              >
                <EditorContent editor={editor} />
              </Box>

              {/* Inline AI floating panel — portaled so it's never clipped by an ancestor's overflow:hidden */}
              {showAiPanel && (
                <Portal>
                  <AiInlinePanel
                    anchor={aiAnchor}
                    onDismiss={dismissAiPanel}
                    onInsert={handleAiInsert}
                    onReplace={handleAiReplace}
                  />
                </Portal>
              )}
            </Box>
          </Box>

          <CharacterCounter currentLength={descriptionCharCount} maxLength={maxLength} />

          {descriptionError && (
            <Text fontSize="sm" color="red.700" mt={1} fontWeight="bold">
              {descriptionError}
            </Text>
          )}
        </FormControl>
      </Box>

      {/* Special Characters Modal */}
      <Modal isOpen={isCharOpen} onClose={onCharClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Insert Special Character</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SimpleGrid columns={10} spacing={1}>
              {SPECIAL_CHARACTERS.map((char) => (
                <Button key={char} size="sm" variant="outline" fontSize="lg" onClick={() => insertSpecialChar(char)} _hover={{ bg: 'blue.50' }}>
                  {char}
                </Button>
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
            <Input placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && insertLink()} />
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
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Button size="sm" w="100%" mb={4} onClick={() => fileInputRef.current?.click()}>
              Choose File
            </Button>
            <Text fontSize="sm" mb={2} fontWeight="medium">Or paste image URL</Text>
            <Input placeholder="https://example.com/image.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && insertImage()} />
          </ModalBody>
          <ModalFooter>
            <Button size="sm" mr={2} onClick={onImageClose}>Cancel</Button>
            <Button size="sm" colorScheme="blue" onClick={insertImage} isDisabled={!imageUrl}>Insert URL</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {renderNavigation ? renderNavigation() : (
        <>
          <Divider my={3} />
          <Box maxW="100%" mt={4}>
            <StepNavigationButtons
              onPrev={onPrevStep}
              onSkip={isDescriptionEmpty ? onSkip : undefined}
              onNext={onSaveAndNext}
              onSaveAndExit={onSaveAndExit}
              prevLabel="Back One Step"
              skipLabel="Skip"
              nextLabel="Save & Next"
              isSubmitting={isSubmitting}
              isSavingAndExiting={isSavingAndExiting}
              loadingText="Saving..."
              showSkip={isDescriptionEmpty}
            />
          </Box>
        </>
      )}
    </>
  );
}
