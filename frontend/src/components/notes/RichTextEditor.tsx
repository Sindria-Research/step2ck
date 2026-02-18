import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Minus,
  Undo2,
  Redo2,
  Link as LinkIcon,
} from 'lucide-react';

export interface RichTextEditorProps {
  /** HTML content (controlled when key changes; we sync to editor on mount) */
  value: string;
  /** Called with HTML whenever content changes */
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** When set, editor is recreated with this content (e.g. note id for key) */
  editorKey?: string | number;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-md transition-colors focus-ring ${
        active
          ? 'bg-[var(--color-bg-active)] text-[var(--color-accent)]'
          : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
      }`}
      aria-label={title}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  className = '',
  editorKey,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        'data-placeholder': placeholder,
        class: 'chiron-rich-editor-prose min-h-[200px] outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  }, [editorKey]);

  // When value changes externally (e.g. switching notes), update editor
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || '<p></p>';
    if (current !== next) editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className={`chiron-rich-editor flex flex-col min-h-0 ${className}`}>
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)] rounded-t-lg shrink-0">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-[var(--color-border)] mx-1" aria-hidden />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const prev = editor.getAttributes('link').href;
            const url = window.prompt('Link URL', prev ?? 'https://');
            if (url != null) {
              if (url === '') editor.chain().focus().unsetLink().run();
              else editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          active={editor.isActive('link')}
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-[var(--color-border)] mx-1" aria-hidden />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>
      </div>
      <div className="chiron-rich-editor-content flex-1 min-h-0 overflow-auto rounded-b-lg border border-t-0 border-[var(--color-border)]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
