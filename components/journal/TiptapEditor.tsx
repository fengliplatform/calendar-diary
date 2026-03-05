'use client'

import { useRef, useMemo, type ReactNode } from 'react'
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  ImageIcon,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { uploadJournalImageAction } from '@/app/journal/[id]/actions'

interface TiptapEditorProps {
  content: JSONContent
  journalId: string
  onUpdate: (json: JSONContent) => void
}

/** Convert a File to a base64 data URI using FileReader (client-side only). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function TiptapEditor({ content, journalId, onUpdate }: TiptapEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Memoize to prevent re-creating extensions on every render
  const extensions = useMemo(
    () => [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write your journal…' }),
      Typography,
    ],
    [],
  )

  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false, // ⚠️ REQUIRED — prevents Next.js SSR hydration error
    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
    onUpdate: ({ editor }) => onUpdate(editor.getJSON()),
  })

  async function handleImageUpload(file: File) {
    if (!editor) return

    // 1. Insert base64 preview immediately so the user sees it right away
    const base64 = await fileToBase64(file)
    editor.chain().focus().setImage({ src: base64 }).run()

    // 2. Upload to Cloudinary via server action in the background
    const fd = new FormData()
    fd.append('file', file)
    fd.append('journalId', journalId)
    const result = await uploadJournalImageAction(fd)

    if (result.url) {
      // 3. Replace the base64 src with the permanent Cloudinary URL
      editor.chain().focus().updateAttributes('image', { src: result.url }).run()
    } else {
      // Upload failed — remove the base64 image so it is never saved to the DB
      const { tr, doc } = editor.state
      doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.src === base64) {
          tr.delete(pos, pos + node.nodeSize)
        }
      })
      editor.view.dispatch(tr)
      toast.error(result.error ?? 'Image upload failed. Please try again.')
    }
  }

  function handleLinkInsert() {
    if (!editor) return
    const url = window.prompt('Enter URL')
    if (!url) return
    editor.chain().focus().setLink({ href: url }).run()
  }

  if (!editor) return null

  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs)

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-2 py-1.5">
        <ToolbarButton
          active={isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={false}
          onClick={() => imageInputRef.current?.click()}
          title="Insert image"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={isActive('link')}
          onClick={handleLinkInsert}
          title="Insert link"
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>

        {/* Hidden file input for image upload */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleImageUpload(file)
              // Reset so the same file can be picked again
              e.target.value = ''
            }
          }}
        />
      </div>

      {/* Editor content area */}
      <EditorContent editor={editor} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ToolbarButtonProps {
  active: boolean
  onClick: () => void
  title: string
  children: ReactNode
}

function ToolbarButton({ active, onClick, title, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`h-8 w-8 p-0 ${active ? 'bg-muted' : ''}`}
    >
      {children}
    </Button>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border" />
}
