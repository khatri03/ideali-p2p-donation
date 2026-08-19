import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
} from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubjectInputHandle {
  insertVariable: (placeholder: string) => void;
}

interface SubjectInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VARIABLE_RE = /(\{\{[^}]+\}\})/g;

/** Parse raw string into segments */
function parse(raw: string): { type: 'text' | 'variable'; value: string }[] {
  return raw
    .split(VARIABLE_RE)
    .filter((p) => p !== '')
    .map((p) => ({
      type: /^\{\{[^}]+\}\}$/.test(p) ? ('variable' as const) : ('text' as const),
      value: p,
    }));
}

/** Read the current DOM of a contentEditable and produce a plain string */
function readPlainText(el: HTMLElement): string {
  let result = '';
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as HTMLElement;
      if (elem.dataset.variable) {
        result += elem.dataset.variable;
      } else {
        result += elem.textContent;
      }
    }
  });
  return result;
}

/** Build DOM children from segments */
function buildChildren(
  segments: { type: 'text' | 'variable'; value: string }[],
  onDelete: (placeholder: string) => void
): (HTMLSpanElement | Text)[] {
  return segments.map((seg) => {
    if (seg.type === 'variable') {
      return makeChip(seg.value, onDelete);
    }
    return document.createTextNode(seg.value);
  });
}

/** Create a variable chip element */
function makeChip(
  placeholder: string,
  onDelete: (p: string) => void
): HTMLSpanElement {
  const chip = document.createElement('span');
  chip.setAttribute('data-variable', placeholder);
  chip.setAttribute('contenteditable', 'false');
  chip.style.cssText = [
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
    'line-height:1.5',
  ].join(';');

  const label = document.createElement('span');
  label.textContent = placeholder;
  chip.appendChild(label);

  const btn = document.createElement('span');
  btn.textContent = '×';
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

  btn.addEventListener('mouseenter', () => { btn.style.background = '#E53E3E'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = '#FC8181'; });
  btn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(placeholder);
  });

  chip.appendChild(btn);
  return chip;
}

/** Save caret position as a char offset */
function saveCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(el);
  range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return range.toString().length + countVariableLengths(el, sel.getRangeAt(0));
}

function countVariableLengths(el: HTMLElement, range: Range): number {
  let count = 0;
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as HTMLElement;
      if (elem.dataset.variable && range.comparePoint(elem, 0) > 0) {
        count += elem.dataset.variable.length;
      }
    }
  });
  return count;
}

/** Restore caret to char offset */
function restoreCaretOffset(el: HTMLElement, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  let remaining = offset;
  let targetNode: Node = el;
  let targetOffset    = 0;

  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node.textContent || '').length;
      if (remaining <= len) {
        targetNode   = node;
        targetOffset = remaining;
        break;
      }
      remaining -= len;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as HTMLElement;
      const len  = (elem.dataset.variable || '').length;
      if (remaining <= 0) {
        targetNode   = el;
        targetOffset = Array.from(el.childNodes).indexOf(node);
        break;
      }
      remaining -= len;
    }
  }

  try {
    const range = document.createRange();
    range.setStart(targetNode, targetOffset);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (_) {}
}

// ─── Component ────────────────────────────────────────────────────────────────

const SubjectInput = forwardRef<SubjectInputHandle, SubjectInputProps>(
  ({ value, onChange, placeholder = 'Enter email subject' }, ref) => {

    const editorRef    = useRef<HTMLDivElement>(null);
    const isComposing  = useRef(false);
    const skipSync     = useRef(false);
    const [isEmpty, setIsEmpty] = useState(!value);

    // ── Initial render ────────────────────────────────────────────────────────
    useEffect(() => {
      const el = editorRef.current;
      if (!el) return;
      const segments = parse(value || '');
      el.innerHTML = '';
      buildChildren(segments, handleDelete).forEach((child) => el.appendChild(child));
      setIsEmpty(!value);
    }, []);  // only on mount

    // ── Sync from parent (external value change) ──────────────────────────────
    useEffect(() => {
      const el = editorRef.current;
      if (!el || skipSync.current) return;
      const current = readPlainText(el);
      if (value !== current) {
        const segments = parse(value || '');
        el.innerHTML = '';
        buildChildren(segments, handleDelete).forEach((child) => el.appendChild(child));
        setIsEmpty(!value);
      }
    }, [value]);

    // ── Delete chip ───────────────────────────────────────────────────────────
    const handleDelete = (placeholder: string) => {
      const el = editorRef.current;
      if (!el) return;
      const chip = el.querySelector(`[data-variable="${placeholder}"]`);
      if (chip) chip.remove();
      skipSync.current = true;
      const plain = readPlainText(el);
      onChange(plain);
      setIsEmpty(!plain);
      skipSync.current = false;
      el.focus();
    };

    // ── Input handler ─────────────────────────────────────────────────────────
    const handleInput = () => {
      const el = editorRef.current;
      if (!el || isComposing.current) return;
      skipSync.current = true;
      const plain = readPlainText(el);
      onChange(plain);
      setIsEmpty(!plain);
      skipSync.current = false;
    };

    // ── Keydown: backspace deletes chip before cursor ─────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Backspace') {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        if (!range.collapsed) return;

        const { startContainer, startOffset } = range;
        // If cursor is right after a chip (chip is previous sibling)
        if (startContainer === editorRef.current && startOffset > 0) {
          const prev = editorRef.current!.childNodes[startOffset - 1] as HTMLElement;
          if (prev?.dataset?.variable) {
            e.preventDefault();
            prev.remove();
            const plain = readPlainText(editorRef.current!);
            skipSync.current = true;
            onChange(plain);
            setIsEmpty(!plain);
            skipSync.current = false;
          }
        }
      }
    };

    // ── Expose insertVariable ─────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      insertVariable(placeholder: string) {
        const el = editorRef.current;
        if (!el) return;

        el.focus();
        const sel = window.getSelection();

        const chip = makeChip(placeholder, handleDelete);

        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(chip);
          // Move cursor after the chip
          const newRange = document.createRange();
          newRange.setStartAfter(chip);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          el.appendChild(chip);
        }

        skipSync.current = true;
        const plain = readPlainText(el);
        onChange(plain);
        setIsEmpty(!plain);
        skipSync.current = false;
      },
    }));

    // ── render ────────────────────────────────────────────────────────────────
    return (
      <Box position="relative">
        {/* Placeholder */}
        {isEmpty && (
          <Box
            position="absolute"
            top="50%"
            left={3}
            transform="translateY(-50%)"
            fontSize="14px"
            color="gray.400"
            pointerEvents="none"
            userSelect="none"
            zIndex={1}
          >
            {placeholder}
          </Box>
        )}

        <Box
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={() => {
            isComposing.current = false;
            handleInput();
          }}
          minH="40px"
          px={3}
          py="8px"
          border="1px solid"
          borderColor="gray.300"
          borderRadius="md"
          bg="white"
          fontSize="14px"
          lineHeight="1.5"
          outline="none"
          whiteSpace="pre-wrap"
          wordBreak="break-word"
          cursor="text"
          _focus={{
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
          }}
          sx={{
            '&:empty::before': { content: 'none' },
          }}
        />
      </Box>
    );
  }
);

SubjectInput.displayName = 'SubjectInput';
export default SubjectInput;