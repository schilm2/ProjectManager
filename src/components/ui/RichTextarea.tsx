import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { TextareaHTMLAttributes, DragEvent, ClipboardEvent } from 'react';
import { storeImage } from '../../db/imageStore';
import './rich-textarea.css';

interface ToolbarAction {
  label: string;
  title: string;
  action: (value: string, selStart: number, selEnd: number) => { value: string; selStart: number; selEnd: number };
}

function wrapSelection(
  before: string,
  after: string,
  placeholder: string,
  value: string,
  selStart: number,
  selEnd: number,
) {
  const selected = value.slice(selStart, selEnd) || placeholder;
  const next = value.slice(0, selStart) + before + selected + after + value.slice(selEnd);
  const newStart = selStart + before.length;
  const newEnd = newStart + selected.length;
  return { value: next, selStart: newStart, selEnd: newEnd };
}

function insertLinePrefix(
  prefix: string,
  value: string,
  selStart: number,
  selEnd: number,
) {
  const lineStart = value.lastIndexOf('\n', selStart - 1) + 1;
  const lineEnd = value.indexOf('\n', selEnd);
  const end = lineEnd === -1 ? value.length : lineEnd;
  const line = value.slice(lineStart, end);
  const hasPrefix = line.startsWith(prefix);
  const newLine = hasPrefix ? line.slice(prefix.length) : prefix + line;
  const next = value.slice(0, lineStart) + newLine + value.slice(end);
  const delta = hasPrefix ? -prefix.length : prefix.length;
  return { value: next, selStart: selStart + delta, selEnd: selEnd + delta };
}

function insertLink(value: string, selStart: number, selEnd: number) {
  const selected = value.slice(selStart, selEnd);
  const linkText = selected || 'Link-Text';
  const insertion = `[${linkText}](url)`;
  const next = value.slice(0, selStart) + insertion + value.slice(selEnd);
  const urlStart = selStart + linkText.length + 3;
  return { value: next, selStart: urlStart, selEnd: urlStart + 3 };
}

function insertImageMarkdown(imageId: string, value: string, selStart: number): { value: string; selStart: number; selEnd: number } {
  const insertion = `![](img://${imageId})`;
  const next = value.slice(0, selStart) + insertion + value.slice(selStart);
  const pos = selStart + insertion.length;
  return { value: next, selStart: pos, selEnd: pos };
}

const ACTIONS: ToolbarAction[] = [
  {
    label: 'B',
    title: 'Fett (Ctrl+B)',
    action: (v, s, e) => wrapSelection('**', '**', 'fetter Text', v, s, e),
  },
  {
    label: 'I',
    title: 'Kursiv (Ctrl+I)',
    action: (v, s, e) => wrapSelection('*', '*', 'kursiver Text', v, s, e),
  },
  {
    label: 'U̲',
    title: 'Unterstrichen',
    action: (v, s, e) => wrapSelection('<u>', '</u>', 'unterstrichener Text', v, s, e),
  },
  {
    label: '~~',
    title: 'Durchgestrichen',
    action: (v, s, e) => wrapSelection('~~', '~~', 'Text', v, s, e),
  },
  {
    label: 'H1',
    title: 'Überschrift 1',
    action: (v, s, e) => insertLinePrefix('# ', v, s, e),
  },
  {
    label: 'H2',
    title: 'Überschrift 2',
    action: (v, s, e) => insertLinePrefix('## ', v, s, e),
  },
  {
    label: '•',
    title: 'Aufzählungsliste',
    action: (v, s, e) => insertLinePrefix('- ', v, s, e),
  },
  {
    label: '1.',
    title: 'Nummerierte Liste',
    action: (v, s, e) => insertLinePrefix('1. ', v, s, e),
  },
  {
    label: '❝',
    title: 'Zitat',
    action: (v, s, e) => insertLinePrefix('> ', v, s, e),
  },
  {
    label: '</>',
    title: 'Code',
    action: (v, s, e) => wrapSelection('`', '`', 'code', v, s, e),
  },
  {
    label: '🔗',
    title: 'Link einfügen',
    action: insertLink,
  },
  {
    label: '—',
    title: 'Trennlinie',
    action: (v, s, _e) => {
      const hr = '\n---\n';
      const next = v.slice(0, s) + hr + v.slice(s);
      const pos = s + hr.length;
      return { value: next, selStart: pos, selEnd: pos };
    },
  },
];

interface RichTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export const RichTextarea = forwardRef<HTMLTextAreaElement, RichTextareaProps>(
  function RichTextarea({ value, onChange, className, onKeyDown: outerKeyDown, ...rest }, forwardedRef) {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(forwardedRef, () => internalRef.current as HTMLTextAreaElement);

    const applyAction = useCallback(
      (action: ToolbarAction['action']) => {
        const el = internalRef.current;
        if (!el) return;
        const selStart = el.selectionStart ?? 0;
        const selEnd = el.selectionEnd ?? 0;
        const result = action(value, selStart, selEnd);
        onChange(result.value);
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(result.selStart, result.selEnd);
        });
      },
      [value, onChange],
    );

    const handleImageFiles = useCallback(
      async (files: FileList | File[]) => {
        const imageFiles = [...files].filter((f) => f.type.startsWith('image/'));
        if (!imageFiles.length) return;
        const el = internalRef.current;
        const selStart = el?.selectionStart ?? value.length;
        let current = value;
        let pos = selStart;
        for (const file of imageFiles) {
          const id = await storeImage(file);
          const result = insertImageMarkdown(id, current, pos);
          current = result.value;
          pos = result.selEnd;
        }
        onChange(current);
        requestAnimationFrame(() => {
          el?.focus();
          el?.setSelectionRange(pos, pos);
        });
      },
      [value, onChange],
    );

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b') { e.preventDefault(); applyAction(ACTIONS[0].action); return; }
        if (e.key === 'i') { e.preventDefault(); applyAction(ACTIONS[1].action); return; }
      }
      outerKeyDown?.(e);
    }

    function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
      const imageItems = [...(e.clipboardData?.items ?? [])].filter((item) => item.type.startsWith('image/'));
      if (!imageItems.length) return;
      e.preventDefault();
      const files = imageItems.map((item) => item.getAsFile()).filter((f): f is File => f !== null);
      handleImageFiles(files);
    }

    function handleDrop(e: DragEvent<HTMLTextAreaElement>) {
      const imageFiles = [...(e.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith('image/'));
      if (!imageFiles.length) return;
      e.preventDefault();
      handleImageFiles(imageFiles);
    }

    function handleDragOver(e: DragEvent<HTMLTextAreaElement>) {
      if ([...e.dataTransfer.items].some((item) => item.type.startsWith('image/'))) {
        e.preventDefault();
      }
    }

    function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
      if (e.target.files?.length) {
        handleImageFiles(e.target.files);
        e.target.value = '';
      }
    }

    return (
      <div className="rich-textarea-wrapper">
        <div className="rich-toolbar" role="toolbar" aria-label="Formatierungsoptionen">
          {ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              className="rich-toolbar-btn"
              title={a.title}
              aria-label={a.title}
              onMouseDown={(e) => {
                e.preventDefault();
                applyAction(a.action);
              }}
            >
              {a.label}
            </button>
          ))}
          <button
            type="button"
            className="rich-toolbar-btn"
            title="Bild einfügen"
            aria-label="Bild einfügen"
            onMouseDown={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
          >
            🖼
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
        <textarea
          ref={internalRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={className}
          {...rest}
        />
      </div>
    );
  },
);
