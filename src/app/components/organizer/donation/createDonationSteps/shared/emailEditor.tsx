import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdStrikethroughS,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatIndentIncrease,
  MdFormatQuote,
  MdInsertLink,
  MdImage,
  MdAttachFile,
  MdUndo,
  MdRedo,
  MdFormatColorText,
  MdFormatColorFill,
  MdTableChart,
  MdSmartButton,
  MdArrowDropDown,
  MdPerson,
} from 'react-icons/md';
import { useEditor, EditorContent } from '@tiptap/react';
import { Node, Mark, Extension, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CharacterCounter from '../../../../../components/common/CharacterCounter';
import campaignEditorService, { Campaign } from '../../../../../service/organizer/donation/campaignEditorService';
import SnippetManager from '../step8Components/snippetManager';

// ─── Custom FontSize Mark ─────────────────────────────────────────────────────
const FontSize = Mark.create({
  name: 'fontSize',
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
        renderHTML: (attrs) => attrs.size ? { style: `font-size: ${attrs.size}` } : {},
      },
    };
  },
  parseHTML() { return [{ style: 'font-size' }]; },
  renderHTML({ HTMLAttributes }) { return ['span', HTMLAttributes, 0]; },
  addCommands(): any {
    return {
      setFontSize: (size: string) => ({ chain }: any) =>
        chain().setMark('fontSize', { size }).run(),
      unsetFontSize: () => ({ chain }: any) =>
        chain().unsetMark('fontSize').run(),
    };
  },
});

// ─── Custom LineHeight Extension ──────────────────────────────────────────────
const LineHeight = Extension.create({
  name: 'lineHeight',
  addGlobalAttributes() {
    return [{
      types: ['paragraph'],
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: (el) => (el as HTMLElement).style.lineHeight || null,
          renderHTML: (attrs) => attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {},
        },
      },
    }];
  },
  addCommands(): any {
    return {
      setLineHeight: (lh: string) => ({ commands }: any) =>
        commands.updateAttributes('paragraph', { lineHeight: lh }),
    };
  },
});

// ─── FileAttachment Node ──────────────────────────────────────────────────────
const FileAttachment = Node.create({
  name: 'fileAttachment',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      fileName: { default: '' },
      fileSize: { default: '' },
      fileData: { default: '' },
      fileType: { default: '' },
    };
  },
  parseHTML() { return [{ tag: 'div[data-file-attachment]' }]; },
  renderHTML({ node, HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-file-attachment': 'true',
      style: 'display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f0f4f8;border:1px solid #cbd5e0;border-radius:6px;margin:4px 0;font-size:13px;',
    }),
      ['span', { style: 'font-size:18px' }, '📎'],
      ['span', {}, node.attrs.fileName],
      ['span', { style: 'color:#718096;font-size:11px;margin-left:4px' }, node.attrs.fileSize],
    ];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.setAttribute('data-file-attachment', 'true');
      dom.setAttribute('contenteditable', 'false');
      dom.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f0f4f8;border:1px solid #cbd5e0;border-radius:6px;margin:4px 0;font-size:13px;cursor:default;';
      dom.innerHTML = `<span style="font-size:18px">📎</span><span>${node.attrs.fileName}</span><span style="color:#718096;font-size:11px;margin-left:4px">${node.attrs.fileSize}</span>`;
      return { dom, contentDOM: undefined };
    };
  },
});

// ─── CTA Button Node ──────────────────────────────────────────────────────────
const CtaButton = Node.create({
  name: 'ctaButton',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      label: {
        default: 'Click Here',
        parseHTML: (el) => el.querySelector('a')?.textContent || 'Click Here',  // ← ADD THIS
      },
      href: {
        default: '#',
        parseHTML: (el) => el.querySelector('a')?.getAttribute('href') || '#',  // ← ADD THIS
      },
      variant: {
        default: 'primary',
        parseHTML: (el) => {                                                      // ← ADD THIS
          const bg = el.querySelector('a')?.style.background;
          return bg === 'rgb(56, 161, 105)' ? 'campaign' : 'primary';
        },
      },
    };
  },
  // rest stays the same...
  parseHTML() { return [{ tag: 'div[data-cta-button]' }]; },
  renderHTML({ node }) {
    const bg = node.attrs.variant === 'campaign' ? '#38a169' : '#3182ce';
    return ['div', { 'data-cta-button': 'true', style: 'margin:8px 0;' },
      ['a', { href: node.attrs.href, target: '_blank', rel: 'noopener noreferrer', style: `display:inline-block;padding:10px 24px;background:${bg};color:white;border-radius:6px;font-weight:600;font-size:14px;text-decoration:none;` }, node.attrs.label],
    ];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.setAttribute('data-cta-button', 'true');
      dom.setAttribute('contenteditable', 'false');
      dom.style.cssText = 'margin:8px 0;';
      const bg = node.attrs.variant === 'campaign' ? '#38a169' : '#3182ce';
      dom.innerHTML = `<a href="${node.attrs.href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 24px;background:${bg};color:white;border-radius:6px;font-weight:600;font-size:14px;text-decoration:none;cursor:pointer;">${node.attrs.label}</a>`;
      return { dom, contentDOM: undefined };
    };
  },
});

// ─── Variable Node ────────────────────────────────────────────────────────────
// ─── Variable Node ────────────────────────────────────────────────────────────
const VariableNode = Node.create({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return {
      label: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-variable') || '',
      },
      value: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-variable') || '',
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-variable]' }];
  },
  renderHTML({ node }) {
    return ['span', { 'data-variable': node.attrs.value }, node.attrs.value];
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      // ── Outer wrapper ──
      const dom = document.createElement('span');
      dom.setAttribute('data-variable', node.attrs.value);
      dom.setAttribute('contenteditable', 'false');
      dom.style.cssText = [
        'display:inline-flex',
        'align-items:center',
        'gap:3px',
        'background:#EBF8FF',
        'border:1px solid #BEE3F8',
        'border-radius:4px',
        'padding:1px 4px',
        'font-size:12px',
        'font-weight:500',
        'color:#2B6CB0',
        'user-select:none',
        'cursor:default',
        'vertical-align:middle',
        'margin:0 1px',
      ].join(';');

      // ── Variable label text ──
      const label = document.createElement('span');
      label.textContent = node.attrs.value;

      // ── Red ✕ remove button ──
      const btn = document.createElement('span');
      btn.textContent = '×';
      btn.title = 'Remove';
      btn.style.cssText = [
        'display:inline-flex',
        'align-items:center',
        'justify-content:center',
        'width:13px',
        'height:13px',
        'background:#FC8181',
        'color:white',
        'border-radius:50%',
        'font-size:10px',
        'line-height:1',
        'cursor:pointer',
        'flex-shrink:0',
        'font-weight:700',
      ].join(';');

      // ── Hover effect ──
      btn.addEventListener('mouseenter', () => { btn.style.background = '#E53E3E'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = '#FC8181'; });

      // ── Click → delete this node ──
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = typeof getPos === 'function' ? getPos() : null;
        if (pos !== null && pos !== undefined) {
          editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
        }
      });

      dom.appendChild(label);
      dom.appendChild(btn);

      return { dom, contentDOM: undefined };
    };
  },
});

// ─── Constants ────────────────────────────────────────────────────────────────
const FONT_SIZES    = ['10px','12px','14px','16px','18px','20px','24px','28px','32px','36px'];
const LINE_HEIGHTS  = ['1','1.2','1.5','1.75','2','2.5'];
const TEXT_COLORS   = ['#000000','#374151','#6B7280','#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#8B5CF6','#EC4899','#FFFFFF'];
const BG_COLORS     = ['#FFFFFF','#FEF3C7','#FEE2E2','#DCFCE7','#DBEAFE','#EDE9FE','#FCE7F3','#F3F4F6','#1F2937','#000000'];
const SPECIAL_CHARS = ['©','®','™','€','£','¥','•','…','—','–','±','×','÷','≈','≠','≤','≥','←','→','↑','↓','♠','♣','♥','♦','★','☆','✓','✗','∞','½','¼','¾','α','β','γ','δ','π','σ','ω'];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const getPlainTextLength = (html: string) => {
  if (!html) return 0;
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent?.length || 0;
};

// ─── Small toolbar button ─────────────────────────────────────────────────────
function TBtn({ icon, label, isActive, isDisabled, onClick }: {
  icon: React.ReactElement; label: string; isActive?: boolean; isDisabled?: boolean; onClick: () => void;
}) {
  return (
    <Tooltip label={label} fontSize="xs" openDelay={400}>
      <IconButton aria-label={label} icon={icon} size="xs" variant={isActive ? 'solid' : 'ghost'}
        colorScheme={isActive ? 'blue' : 'gray'} isDisabled={isDisabled} onClick={onClick} minW="26px" h="26px" />
    </Tooltip>
  );
}

function Sep() {
  return <Box w="1px" h="20px" bg="gray.300" mx="2px" alignSelf="center" flexShrink={0} />;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface EmailEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  readOnlyPrefix?: React.ReactNode;
  getPlaceHolders?: () => Promise<any>;
  /**
   * Which snippet manager to render — defaults to the Donation one. Callers from
   * other modules (e.g. Membership) must pass their own module-specific component
   * so permission checks and the snippets backend stay scoped to that module.
   */
  SnippetManagerComponent?: React.ComponentType<{
    editorHtml: string;
    onInsert: (html: string) => void;
  }>;
}

// ─── EmailEditor Component ────────────────────────────────────────────────────
export default function emailEditor({
  value,
  onChange,
  placeholder = 'Continue your message here...',
  maxLength = 5000,
  readOnlyPrefix,
  getPlaceHolders,
  SnippetManagerComponent = SnippetManager,
}: EmailEditorProps) {
  const [charCount, setCharCount]       = useState(() => getPlainTextLength(value));
  const [savedSelection, setSavedSelection] = useState<number | null>(null);
  const [linkUrl, setLinkUrl]           = useState('');
  const [linkLabel, setLinkLabel]       = useState('');
  const [imageUrl, setImageUrl]         = useState('');
  const [ctaLabel, setCtaLabel]         = useState('');
  const [ctaUrl, setCtaUrl]             = useState('');
  const [ctaVariant, setCtaVariant]     = useState<'primary' | 'campaign'>('primary');
  const [tableHover, setTableHover]     = useState<[number, number]>([0, 0]);
const [variableGroups, setVariableGroups] = useState<{
  donor:     { uniqueId: string; displayText: string; placeHolderText: string }[];
  donation:  { uniqueId: string; displayText: string; placeHolderText: string }[];
  invoice:   { uniqueId: string; displayText: string; placeHolderText: string }[];
  organizer: { uniqueId: string; displayText: string; placeHolderText: string }[];
  other:     { uniqueId: string; displayText: string; placeHolderText: string }[];
}>({ donor: [], donation: [], invoice: [], organizer: [], other: [] });

  // ── Campaign state ───────────────────────────────────────────────────────
  const [campaigns, setCampaigns]               = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError]     = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  const { isOpen: isLinkOpen,     onOpen: onLinkOpen,     onClose: onLinkClose }     = useDisclosure();
  const { isOpen: isImageOpen,    onOpen: onImageOpen,    onClose: onImageClose }    = useDisclosure();
  const { isOpen: isCharOpen,     onOpen: onCharOpen,     onClose: onCharClose }     = useDisclosure();
  const { isOpen: isCtaOpen,      onOpen: onCtaOpen,      onClose: onCtaClose }      = useDisclosure();
  const { isOpen: isTableOpen,    onOpen: onTableOpen,    onClose: onTableClose }    = useDisclosure();

  // ── Fetch campaigns when CTA modal opens for campaign variant ────────────
  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    setCampaignsError(null);
    try {
      const res = await campaignEditorService.getCampaignList(1, 5000);
      setCampaigns(res.data?.pageData ?? []);
    } catch (err: any) {
      setCampaignsError('Failed to load campaigns.');
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

const getPlaceHoldersRef = useRef(getPlaceHolders);
useEffect(() => {
  const fetchFn = getPlaceHoldersRef.current ?? campaignEditorService.getEmailPlaceHolders.bind(campaignEditorService);
  fetchFn()
    .then((res) => {
      if (res?.success && res?.data) {
        setVariableGroups({
          donor:     res.data.donor     ?? [],
          donation:  res.data.donation  ?? [],
          invoice:   res.data.invoice   ?? [],
          organizer: res.data.organizer ?? [],
          other:     res.data.other     ?? [],
        });
      }
    })
    .catch((err) => console.error('Failed to load placeholders', err));
}, []);

  useEffect(() => {
    if (isCtaOpen && ctaVariant === 'campaign') {
      setSelectedCampaignId('');
      fetchCampaigns();
    }
  }, [isCtaOpen, ctaVariant]);

  const handleCampaignSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCampaignId(id);
    if (id) {
      setCtaUrl(`${window.location.origin}/donate/${id}`);
    } else {
      setCtaUrl('');
    }
  }, []);

  // ── Editor setup ─────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      TextStyle,
      Color,
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize,
      Highlight.configure({ multicolor: true }),
      LineHeight,
      TextAlign.configure({ types: ['paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
      Image,
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      FileAttachment,
      CtaButton,
      VariableNode,   // ← added
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setCharCount(getPlainTextLength(html));
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { parseOptions: { preserveWhitespace: 'full' } });
      setCharCount(getPlainTextLength(value || ''));
    }
  }, [value]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const savePos    = () => { if (editor) setSavedSelection(editor.state.selection.anchor); };
  const restorePos = useCallback(() => {
    if (!editor) return;
    if (savedSelection !== null) editor.chain().focus().setTextSelection(savedSelection).run();
    else editor.chain().focus().run();
  }, [editor, savedSelection]);

  const insertLink = useCallback(() => {
    if (!linkUrl || !editor) return;
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    restorePos();
    if (linkLabel) {
      editor.chain().insertContent(`<a href="${url}">${linkLabel}</a>`).run();
    } else {
      editor.chain().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkUrl(''); setLinkLabel(''); setSavedSelection(null); onLinkClose();
  }, [editor, linkUrl, linkLabel, restorePos]);

  const insertImageUrl = useCallback(() => {
    if (!imageUrl || !editor) return;
    restorePos();
    editor.chain().setImage({ src: imageUrl }).run();
    setImageUrl(''); setSavedSelection(null); onImageClose();
  }, [editor, imageUrl, restorePos]);

  const insertCta = useCallback(() => {
    if (!ctaLabel || !editor) return;
    restorePos();
    editor.chain().focus().insertContent({
      type: 'ctaButton',
      attrs: { label: ctaLabel, href: ctaUrl || '#', variant: ctaVariant },
    }).run();
    setCtaLabel(''); setCtaUrl(''); setSelectedCampaignId(''); setSavedSelection(null); onCtaClose();
  }, [editor, ctaLabel, ctaUrl, ctaVariant, restorePos]);

  const insertTable = useCallback((r: number, c: number) => {
    if (!editor) return;
    (editor.chain().focus() as any).insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
    onTableClose();
  }, [editor]);

  const handleImageFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => { restorePos(); editor.chain().setImage({ src: reader.result as string }).run(); setSavedSelection(null); onImageClose(); };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [editor, restorePos]);

  const handleAttachFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor.chain().focus().insertContent({
        type: 'fileAttachment',
        attrs: { fileName: file.name, fileSize: formatFileSize(file.size), fileData: reader.result, fileType: file.type },
      }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [editor]);


  if (!editor) return null;

  const currentFontSize   = editor.getAttributes('fontSize').size || '14px';
  const currentLineHeight = editor.getAttributes('paragraph').lineHeight || '1.5';

  return (
    <Box border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden">

      {/* ════════ TOOLBAR ════════ */}
      <Box bg="gray.50" borderBottom="1px solid" borderColor="gray.200" px={2} py={1}>

        {/* ROW 1 */}
        <Flex wrap="wrap" gap="2px" align="center" mb="4px">
          <TBtn icon={<MdUndo size={16}/>}  label="Undo" isDisabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
          <TBtn icon={<MdRedo size={16}/>}  label="Redo" isDisabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
          <Sep/>

          <Tooltip label="Font Size" fontSize="xs" openDelay={400}>
            <Select size="xs" value={currentFontSize} h="26px" minW="72px" maxW="80px" fontSize="12px"
              onChange={(e) => (editor.chain().focus() as any).setFontSize(e.target.value).run()}>
              {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Tooltip>

          <Tooltip label="Line Height" fontSize="xs" openDelay={400}>
            <Select size="xs" value={currentLineHeight} h="26px" minW="70px" maxW="78px" fontSize="12px"
              onChange={(e) => (editor.chain().focus() as any).setLineHeight(e.target.value).run()}>
              {LINE_HEIGHTS.map(lh => <option key={lh} value={lh}>↕ {lh}</option>)}
            </Select>
          </Tooltip>
          <Sep/>

          {/* Text Color */}
          <Popover placement="bottom-start" isLazy>
            <PopoverTrigger>
              <Box as="button" display="flex" alignItems="center" px="3px" h="26px" borderRadius="md" _hover={{ bg: 'gray.200' }} title="Text Color">
                <MdFormatColorText size={16}/><MdArrowDropDown size={14}/>
              </Box>
            </PopoverTrigger>
            <PopoverContent w="auto" p={2} zIndex={1500}>
              <PopoverBody p={0}>
                <Text fontSize="10px" color="gray.500" mb={1}>Text Color</Text>
                <SimpleGrid columns={11} spacing="2px">
                  {TEXT_COLORS.map(c => (
                    <Box key={c} w="18px" h="18px" bg={c} borderRadius="2px" border="1px solid" borderColor="gray.300"
                      cursor="pointer" onClick={() => editor.chain().focus().setColor(c).run()} />
                  ))}
                </SimpleGrid>
              </PopoverBody>
            </PopoverContent>
          </Popover>

          {/* BG Color */}
          <Popover placement="bottom-start" isLazy>
            <PopoverTrigger>
              <Box as="button" display="flex" alignItems="center" px="3px" h="26px" borderRadius="md" _hover={{ bg: 'gray.200' }} title="Background Color">
                <MdFormatColorFill size={16}/><MdArrowDropDown size={14}/>
              </Box>
            </PopoverTrigger>
            <PopoverContent w="auto" p={2} zIndex={1500}>
              <PopoverBody p={0}>
                <Text fontSize="10px" color="gray.500" mb={1}>Background Color</Text>
                <SimpleGrid columns={10} spacing="2px">
                  {BG_COLORS.map(c => (
                    <Box key={c} w="18px" h="18px" bg={c} borderRadius="2px" border="1px solid" borderColor="gray.300"
                      cursor="pointer" onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()} />
                  ))}
                </SimpleGrid>
              </PopoverBody>
            </PopoverContent>
          </Popover>
          <Sep/>

          {/* Variables — inserts a VariableNode (atom) so backspace removes whole token */}
          {/* Variables — grouped by category, scrollable */}
<Menu isLazy>
  <Tooltip label="Insert Variable" fontSize="xs" openDelay={400}>
    <MenuButton as={Button} size="xs" variant="ghost" h="26px" px={2}
      leftIcon={<MdPerson size={14}/>} rightIcon={<MdArrowDropDown/>}>
      <Text fontSize="11px">Variable</Text>
    </MenuButton>
  </Tooltip>
  <MenuList fontSize="xs" zIndex={1400} maxH="260px" overflowY="auto" minW="200px">
    {[
      { key: 'donor',     label: 'Donor' },
      { key: 'donation',  label: 'Donation' },
      { key: 'invoice',   label: 'Invoice' },
      { key: 'organizer', label: 'Organizer' },
      { key: 'other',     label: 'Other' },
    ].map(({ key, label }) => {
      const group = variableGroups[key as keyof typeof variableGroups] ?? [];
      if (!group.length) return null;
      return (
        <React.Fragment key={key}>
          {/* Category heading — not clickable */}
          <MenuItem
            isDisabled
            fontSize="10px"
            fontWeight="700"
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="0.05em"
            bg="gray.50"
            cursor="default"
            _disabled={{ opacity: 1, cursor: 'default' }}
            px={2}
            py={1}
          >
            {label}
          </MenuItem>
          {group.map((v) => (
            <MenuItem
              key={v.uniqueId}
              pl={5}
              fontSize="xs"
              onClick={() =>
                editor.chain().focus().insertContent({
                  type: 'variable',
                  attrs: { label: v.displayText, value: v.placeHolderText },
                }).run()
              }
            >
              {v.displayText}
            </MenuItem>
          ))}
          <Divider />
        </React.Fragment>
      );
    })}
  </MenuList>
</Menu>
        </Flex>

        {/* ROW 2 */}
        <Flex wrap="wrap" gap="2px" align="center">
          <TBtn icon={<MdFormatBold size={16}/>}       label="Bold"          isActive={editor.isActive('bold')}       onClick={() => editor.chain().focus().toggleBold().run()} />
          <TBtn icon={<MdFormatItalic size={16}/>}     label="Italic"        isActive={editor.isActive('italic')}     onClick={() => editor.chain().focus().toggleItalic().run()} />
          <TBtn icon={<MdFormatUnderlined size={16}/>} label="Underline"     isActive={editor.isActive('underline')}  onClick={() => editor.chain().focus().toggleUnderline().run()} />
          <TBtn icon={<MdStrikethroughS size={16}/>}   label="Strikethrough" isActive={editor.isActive('strike')}    onClick={() => editor.chain().focus().toggleStrike().run()} />
          <Sep/>
          <TBtn icon={<MdFormatAlignLeft size={16}/>}    label="Align Left"    isActive={editor.isActive({ textAlign: 'left' })}    onClick={() => editor.chain().focus().setTextAlign('left').run()} />
          <TBtn icon={<MdFormatAlignCenter size={16}/>}  label="Align Center"  isActive={editor.isActive({ textAlign: 'center' })}  onClick={() => editor.chain().focus().setTextAlign('center').run()} />
          <TBtn icon={<MdFormatAlignRight size={16}/>}   label="Align Right"   isActive={editor.isActive({ textAlign: 'right' })}   onClick={() => editor.chain().focus().setTextAlign('right').run()} />
          <TBtn icon={<MdFormatAlignJustify size={16}/>} label="Justify"       isActive={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} />
          <Sep/>
          <TBtn icon={<MdFormatListBulleted size={16}/>}   label="Bullet List"     isActive={editor.isActive('bulletList')}  onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <TBtn icon={<MdFormatListNumbered size={16}/>}   label="Numbered List"   isActive={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <TBtn icon={<MdFormatIndentIncrease size={16}/>} label="Increase Indent"                                            onClick={() => editor.chain().focus().sinkListItem('listItem').run()} />
          <TBtn icon={<MdFormatQuote size={16}/>}          label="Blockquote"      isActive={editor.isActive('blockquote')}  onClick={() => editor.chain().focus().toggleBlockquote().run()} />
          <Sep/>

          {/* Link */}
          <TBtn icon={<MdInsertLink size={16}/>} label="Insert Link" isActive={editor.isActive('link')}
            onClick={() => {
              if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); return; }
              savePos(); setLinkUrl(editor.getAttributes('link').href || ''); setLinkLabel(''); onLinkOpen();
            }} />

          {/* Image */}
          <TBtn icon={<MdImage size={16}/>} label="Insert Image" onClick={() => { savePos(); setImageUrl(''); onImageOpen(); }} />

          {/* Attach */}
          <Tooltip label="Attach File" fontSize="xs" openDelay={400}>
            <IconButton aria-label="Attach File" icon={<MdAttachFile size={16}/>} size="xs" variant="ghost" minW="26px" h="26px"
              onClick={() => attachInputRef.current?.click()} />
          </Tooltip>

          {/* Table */}
          <Popover isOpen={isTableOpen} onClose={onTableClose} placement="bottom-start" isLazy>
            <PopoverTrigger>
              <Box><TBtn icon={<MdTableChart size={16}/>} label="Insert Table" onClick={onTableOpen} /></Box>
            </PopoverTrigger>
            <PopoverContent w="auto" p={3} zIndex={1500}>
              <PopoverBody p={0}>
                <Text fontSize="11px" color="gray.500" mb={2}>
                  {tableHover[0] > 0 ? `${tableHover[0]} × ${tableHover[1]}` : 'Select table size'}
                </Text>
                <SimpleGrid columns={6} spacing="2px">
                  {Array.from({ length: 36 }, (_, i) => {
                    const r = Math.floor(i / 6) + 1;
                    const c = (i % 6) + 1;
                    const active = r <= tableHover[0] && c <= tableHover[1];
                    return (
                      <Box key={i} w="18px" h="18px" border="1px solid" borderRadius="2px" cursor="pointer"
                        borderColor={active ? 'blue.400' : 'gray.300'} bg={active ? 'blue.50' : 'white'}
                        onMouseEnter={() => setTableHover([r, c])}
                        onClick={() => insertTable(r, c)} />
                    );
                  })}
                </SimpleGrid>
              </PopoverBody>
            </PopoverContent>
          </Popover>

          {/* Special Chars */}
          <Tooltip label="Special Characters" fontSize="xs" openDelay={400}>
            <Button size="xs" variant="ghost" h="26px" minW="26px" px={1} fontWeight="bold" fontSize="14px" onClick={onCharOpen}>Ω</Button>
          </Tooltip>
          <Sep/>

          {/* CTA Button */}
          <Menu isLazy>
            <Tooltip label="Insert Button" fontSize="xs" openDelay={400}>
              <MenuButton as={Button} size="xs" variant="ghost" h="26px" px={2}
                leftIcon={<MdSmartButton size={14}/>} rightIcon={<MdArrowDropDown/>}>
                <Text fontSize="11px">Button</Text>
              </MenuButton>
            </Tooltip>
            <MenuList fontSize="sm" zIndex={1500}>
              <MenuItem onClick={() => { savePos(); setCtaVariant('campaign'); setCtaLabel('Donate Now'); setCtaUrl(''); onCtaOpen(); }}>
                🟢 Link to Campaign
              </MenuItem>
              <MenuItem onClick={() => { savePos(); setCtaVariant('primary'); setCtaLabel('Click Here'); setCtaUrl(''); onCtaOpen(); }}>
                🔵 Custom Link Button
              </MenuItem>
            </MenuList>
          </Menu>
          <SnippetManagerComponent
            editorHtml={editor.getHTML()}
            onInsert={(html) => editor.chain().focus().insertContent(html).run()}
          />

        </Flex>
      </Box>

      {/* ── Read-only prefix slot ── */}
      {readOnlyPrefix && (
        <Box px={3} pt={3} pb={0} fontSize="sm" color="gray.700" userSelect="none" cursor="default">
          {readOnlyPrefix}
        </Box>
      )}

      {/* ── Editor area ── */}
      <Box sx={{
        '.ProseMirror': {
          minHeight: '160px', maxHeight: '400px', overflowY: 'auto',
          padding: readOnlyPrefix ? '4px 12px 12px' : '12px',
          fontSize: '14px', lineHeight: '1.5', outline: 'none',
          '& p': { margin: '0 0 0.5em 0' },
          '& ul, & ol': { paddingLeft: '1.5em' },
          '& a': { color: '#3182CE', textDecoration: 'underline' },
          '& img': { maxWidth: '100%', maxHeight: '300px', height: 'auto', objectFit: 'contain', display: 'block', borderRadius: '4px' },
          '& blockquote': { borderLeft: '3px solid #CBD5E0', paddingLeft: '12px', color: '#4A5568', fontStyle: 'italic', margin: '4px 0' },
          '& table': { borderCollapse: 'collapse', width: '100%', margin: '8px 0' },
          '& td, & th': { border: '1px solid #CBD5E0', padding: '6px 10px', minWidth: '60px' },
          '& th': { background: '#F7FAFC', fontWeight: '600' },
        },
        '.ProseMirror p.is-editor-empty:first-of-type::before': {
          content: 'attr(data-placeholder)', color: '#A0AEC0', pointerEvents: 'none', float: 'left', height: 0,
        },
      }}>
        <EditorContent editor={editor} />
      </Box>

      <CharacterCounter currentLength={charCount} maxLength={maxLength} warningThreshold={90} />

      {/* ── Hidden file inputs ── */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageFile} style={{ display: 'none' }} />
      <input type="file" ref={attachInputRef} onChange={handleAttachFile} style={{ display: 'none' }} />

      {/* ── INSERT LINK MODAL ── */}
      <Modal isOpen={isLinkOpen} onClose={onLinkClose} size="sm">
        <ModalOverlay /><ModalContent>
          <ModalHeader>Insert Link</ModalHeader><ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Box>
                <Text fontSize="xs" mb={1} fontWeight="medium">Label (optional)</Text>
                <Input size="sm" placeholder="Link text" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} />
              </Box>
              <Box>
                <Text fontSize="xs" mb={1} fontWeight="medium">URL *</Text>
                <Input size="sm" placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && insertLink()} />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" mr={2} onClick={onLinkClose}>Cancel</Button>
            <Button size="sm" colorScheme="blue" onClick={insertLink}>Insert</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── INSERT IMAGE MODAL ── */}
      <Modal isOpen={isImageOpen} onClose={onImageClose} size="sm">
        <ModalOverlay /><ModalContent>
          <ModalHeader>Insert Image</ModalHeader><ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" mb={2} fontWeight="medium">Upload from device</Text>
            <Button size="sm" w="100%" mb={4} onClick={() => fileInputRef.current?.click()}>Choose File</Button>
            <Text fontSize="sm" mb={2} fontWeight="medium">Or paste image URL</Text>
            <Input size="sm" placeholder="https://example.com/image.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && insertImageUrl()} />
          </ModalBody>
          <ModalFooter>
            <Button size="sm" mr={2} onClick={onImageClose}>Cancel</Button>
            <Button size="sm" colorScheme="blue" onClick={insertImageUrl} isDisabled={!imageUrl}>Insert URL</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── SPECIAL CHARACTERS MODAL ── */}
      <Modal isOpen={isCharOpen} onClose={onCharClose} size="md">
        <ModalOverlay /><ModalContent>
          <ModalHeader>Insert Special Character</ModalHeader><ModalCloseButton />
          <ModalBody pb={6}>
            <SimpleGrid columns={10} spacing={1}>
              {SPECIAL_CHARS.map(c => (
                <Button key={c} size="sm" variant="outline" fontSize="lg" _hover={{ bg: 'blue.50' }}
                  onClick={() => { editor.chain().focus().insertContent(c).run(); onCharClose(); }}>
                  {c}
                </Button>
              ))}
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ── CTA BUTTON MODAL ── */}
      <Modal isOpen={isCtaOpen} onClose={onCtaClose} size="sm">
        <ModalOverlay /><ModalContent>
          <ModalHeader>Insert Button</ModalHeader><ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Box>
                <Text fontSize="xs" mb={1} fontWeight="medium">Button Label *</Text>
                <Input size="sm" placeholder="e.g. Donate Now" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
              </Box>

              {ctaVariant === 'campaign' ? (
                <Box>
                  <Text fontSize="xs" mb={1} fontWeight="medium">Select Campaign *</Text>
                  {campaignsLoading ? (
                    <Flex align="center" gap={2} py={1}>
                      <Spinner size="sm" />
                      <Text fontSize="xs" color="gray.500">Loading campaigns…</Text>
                    </Flex>
                  ) : campaignsError ? (
                    <Text fontSize="xs" color="red.500">{campaignsError}</Text>
                  ) : (
                    <Select
                      size="sm"
                      placeholder="— Select a campaign —"
                      value={selectedCampaignId}
                      onChange={handleCampaignSelect}
                    >
                      {campaigns.filter((c) => c.status === 'Started').map((c) => (
                        <option key={c.uniqueId} value={c.uniqueId}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  )}
                  {selectedCampaignId && (
                    <Text fontSize="10px" color="gray.400" mt={1} wordBreak="break-all">
                      {ctaUrl}
                    </Text>
                  )}
                </Box>
              ) : (
                <Box>
                  <Text fontSize="xs" mb={1} fontWeight="medium">URL</Text>
                  <Input size="sm" placeholder="https://" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
                </Box>
              )}

              <Box>
                <Text fontSize="xs" mb={1} fontWeight="medium">Style</Text>
                <HStack>
  <Button size="sm"
    colorScheme="blue"
    variant={ctaVariant === 'primary' ? 'solid' : 'outline'}
    bg={ctaVariant === 'primary' ? 'blue.500' : 'white'}
    onClick={() => setCtaVariant('primary')}
  >Primary (Blue)</Button>
  <Button size="sm"
    colorScheme="green"
    variant={ctaVariant === 'campaign' ? 'solid' : 'outline'}
    bg={ctaVariant === 'campaign' ? 'green.500' : 'white'}
    onClick={() => setCtaVariant('campaign')}
  >Campaign (Green)</Button>
</HStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" mr={2} onClick={onCtaClose}>Cancel</Button>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={insertCta}
             isDisabled={!ctaLabel || (ctaVariant === 'campaign' && !selectedCampaignId) || (ctaVariant === 'primary' && !ctaUrl.trim())}
            >
              Insert Button
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}