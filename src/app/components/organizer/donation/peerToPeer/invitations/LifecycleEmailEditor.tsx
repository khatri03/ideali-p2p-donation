import { useEffect } from 'react';
import { Box, Flex, IconButton, Tooltip } from '@chakra-ui/react';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdInsertLink,
  MdLinkOff,
  MdTitle,
} from 'react-icons/md';
import { EditorContent, useEditor } from '@tiptap/react';
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';

interface LifecycleEmailEditorProps {
  value: string;
  onChange: (html: string) => void;
  label: string;
}

/**
 * Deliberately smaller than the campaign email editor. Every control here produces markup the server's
 * allow-list keeps, so nothing an organiser writes is silently discarded on save — an editor offering
 * tables and images to a sanitiser that strips them would lose their work without saying so.
 */
export const LifecycleEmailEditor = ({ value, onChange, label }: LifecycleEmailEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false,
      }),
      Link.configure({ openOnClick: false, autolink: false, protocols: ['http', 'https', 'mailto'] }),
    ],
    content: value,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
    editorProps: {
      attributes: {
        'aria-label': label,
        style: 'min-height:180px;padding:12px;outline:none;',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  const applyLink = () => {
    const href = window.prompt('Link address (https:// or mailto:)', 'https://');

    if (!href) {
      return;
    }

    if (!/^(https?:|mailto:)/i.test(href)) {
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  };

  const controls = [
    {
      key: 'bold',
      label: 'Bold',
      icon: <MdFormatBold />,
      isActive: editor.isActive('bold'),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      key: 'italic',
      label: 'Italic',
      icon: <MdFormatItalic />,
      isActive: editor.isActive('italic'),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: 'heading',
      label: 'Heading',
      icon: <MdTitle />,
      isActive: editor.isActive('heading', { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      key: 'bullet',
      label: 'Bulleted list',
      icon: <MdFormatListBulleted />,
      isActive: editor.isActive('bulletList'),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: 'ordered',
      label: 'Numbered list',
      icon: <MdFormatListNumbered />,
      isActive: editor.isActive('orderedList'),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      key: 'quote',
      label: 'Quote',
      icon: <MdFormatQuote />,
      isActive: editor.isActive('blockquote'),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      key: 'link',
      label: 'Add link',
      icon: <MdInsertLink />,
      isActive: editor.isActive('link'),
      run: applyLink,
    },
    {
      key: 'unlink',
      label: 'Remove link',
      icon: <MdLinkOff />,
      isActive: false,
      run: () => editor.chain().focus().unsetLink().run(),
    },
  ];

  return (
    <Box borderWidth="1px" borderColor="secondaryGray.300" borderRadius="12px" overflow="hidden">
      <Flex
        gap={1}
        p={2}
        wrap="wrap"
        borderBottomWidth="1px"
        borderColor="secondaryGray.300"
        bg="secondaryGray.100"
        _dark={{ bg: 'navy.700' }}
      >
        {controls.map((control) => (
          <Tooltip key={control.key} label={control.label}>
            <IconButton
              aria-label={control.label}
              icon={control.icon}
              size="sm"
              minH="44px"
              minW="44px"
              variant={control.isActive ? 'solid' : 'ghost'}
              colorScheme={control.isActive ? 'brand' : 'gray'}
              onClick={control.run}
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>
        ))}
      </Flex>
      <Box
        sx={{
          '.ProseMirror': { minHeight: '180px' },
          '.ProseMirror p': { marginBottom: '12px' },
          '.ProseMirror ul, .ProseMirror ol': { paddingLeft: '24px' },
          '.ProseMirror a': { color: 'brand.500', textDecoration: 'underline' },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};

export default LifecycleEmailEditor;
