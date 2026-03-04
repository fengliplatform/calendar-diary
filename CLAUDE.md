# Daybook App

## Project Overview
A calendar-based daily diary web app for families. Each day supports event text,
photos, videos, and a rich journal. Families can share and collaborate.
Built with Next.js 14, Clerk auth, Neon PostgreSQL, Prisma 7, and Cloudinary media.

---

## Tech Stack
- Framework: Next.js 14 (App Router, TypeScript)
- Styling: Tailwind CSS + shadcn/ui
- Rich Text Editor: Tiptap (Medium-style journal editing with autosave)
- Auth: Clerk (Google OAuth + Organizations for family groups)
- Database: Neon (Serverless PostgreSQL)
- ORM: Prisma 7
- File Storage: Cloudinary (photos + videos + auto-thumbnails)
- Search: Postgres full-text search (server) + Fuse.js (client fuzzy)
- Deployment: Vercel

---

## Project Structure
```
/app
  /calendar/[yearMonth]          → Month grid view (/calendar/2026-02)
  /calendar/[yearMonth]/[day]    → Day detail page (/calendar/2026-02-27)
  /journal/[id]                  → Journal read-only view
  /journal/[id]/edit             → Journal editor (Tiptap)
  /search                        → Search page
  /settings                      → Family setup, member invite
  /sign-in/[[...sign-in]]        → Clerk sign-in page
  /sign-up/[[...sign-up]]        → Clerk sign-up page
/components
  /calendar                      → MonthGrid, DayCell, DayCellBadges
  /journal                       → TiptapEditor, AutosaveIndicator
  /media                         → PhotoUpload, VideoUpload, MediaGallery
  /search                        → SearchBar, FuzzyResults, DateRangePicker
  /ui                            → shadcn/ui base components
/lib
  /db                            → Prisma client, Neon connection
  /auth                          → Clerk helpers, org/family resolution
  /search                        → Postgres FTS queries, Fuse.js config
  /cloudinary                    → Upload helpers, thumbnail utils
/prisma
  schema.prisma
  migrations/
```

---

## Database Models (Prisma)
- DayEntry (id, familyId, date, eventText, updatedAt)
- DayColorRange (id, familyId, startDate, endDate, colorHex, createdAt)
- Photo (id, dayEntryId, familyId, name, cloudinaryUrl, uploadedBy, createdAt)
- Video (id, dayEntryId, familyId, name, cloudinaryUrl, thumbnailUrl, uploadedBy, createdAt)
- Journal (id, dayEntryId, familyId, title, content (Json), authorId, createdAt, updatedAt)

Notes:
- No User model — users managed entirely by Clerk
- familyId on every model = Clerk organizationId
- Postgres full-text search index on Journal.title, Journal.content, DayEntry.eventText
- Use Neon pooled URL for app queries, direct URL for migrations only

---

## Key Features

### Day Grid (Month View)
- 7-column grid (Sun–Sat), one DayCell per day
- Each cell shows:
  - Day number (top left)
  - Event text snippet (1 line, truncated with ellipsis)
  - Photo count badge (📷 n) if photos > 0
  - Video badge (🎬) if videos > 0
  - Journal title as clickable link to /journal/[id] if exists
  - Background color from DayColorRange if set for that date
- Today's date has a distinct highlight (ring or bold number)
- Clicking a cell navigates to /calendar/YYYY-MM-DD
- Prev/Next month arrows update URL to /calendar/YYYY-MM
- Data fetched server-side using Prisma, filtered by familyId from Clerk
- Mobile responsive: show only day number + badges on small screens
- Optimistic UI: color changes appear instantly before server confirms

### Day Detail Page
- Breadcrumb: ← February 2026 linking back to /calendar/YYYY-MM
- Section 1 — Event Text: full text, inline edit on click, save on blur
- Section 2 — Photos: thumbnail grid (3 col), click to full-size modal, upload + delete
- Section 3 — Videos: thumbnail previews, click to player modal, upload + delete
- Section 4 — Journal: View/Edit buttons if exists, Add Journal button if not
- Color picker: shadcn/ui Popover, 12 preset hex colors, shift+click for range
- All mutations use server actions with optimistic UI updates

### Journal Editor
- Tiptap rich text (Medium.com style — full-width, minimal chrome, content-focused)
- Large plain title input above the editor
- Toolbar: H1, H2, bold, italic, blockquote, bullet list, ordered list, image embed, link
- Autosave: 2000ms debounce, useRef timer, "Saving..." → "Saved ✓"
- Read-only view at /journal/[id] renders Tiptap content without toolbar
- Back button returns to the day detail page that owns this journal
- Always mark TiptapEditor component with 'use client' — never render on server

### Search
- Default scope: first day of current month to today
- From/to date range picker (shadcn/ui DatePicker)
- Server: Postgres FTS on journal content + event text (tsvector), filtered by familyId
- Client: Fuse.js fuzzy match on photo names, video names, journal titles
- Results grouped by date, sorted by relevance, click → /calendar/YYYY-MM-DD
- URL: /search?q=keyword&from=YYYY-MM-DD&to=YYYY-MM-DD
- Show which field matched in each result snippet
- Empty state: friendly illustration + "No entries found"

### Family (Clerk Organizations)
- Each family = one Clerk Organization
- Roles: Admin (owner), Member (read + write), Viewer (read only)
- Invite by email via Clerk's built-in invite flow
- All DB queries filter by Clerk organizationId
- No custom auth logic — use Clerk's currentUser() and auth() helpers only

---

## Key Technical Conventions

### Autosave (Tiptap Journal)
- Debounce delay: 2000ms after last keystroke
- Use useRef for debounce timer — NEVER useState (causes unnecessary re-renders)
- Pattern:
  ```ts
  const saveTimer = useRef<NodeJS.Timeout>()
  const handleUpdate = (content: JSON) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveJournal(content), 2000)
  }
  useEffect(() => () => {
    clearTimeout(saveTimer.current)
    saveJournal(content)
  }, [])
  ```
- Save indicator states: idle → "Saving..." → "Saved ✓" → idle after 2s
- Autosave triggers on Tiptap's onUpdate callback, not on form submit

### Tiptap Editor Setup
- Latest versions: @tiptap/react@3.16.0, @tiptap/starter-kit@3.16.0, @tiptap/pm@3.16.0
- Install command:
  ```bash
  npm install @tiptap/react @tiptap/starter-kit @tiptap/pm \
    @tiptap/extension-image @tiptap/extension-link \
    @tiptap/extension-color @tiptap/extension-text-style \
    @tiptap/extension-typography @tiptap/extension-placeholder \
    @tailwindcss/typography
  ```
- CRITICAL: Always add `immediatelyRender: false` to useEditor() — required for Next.js SSR.
  Omitting this causes hydration errors that are hard to debug.
- CRITICAL: Always mark the editor component with 'use client' at the top
- CRITICAL: Never store images as base64 in DB — always upload to Cloudinary and store URL only.
  Base64 payloads become megabytes and cause slow saves and database bloat.
- Install @tailwindcss/typography and apply `prose` class to EditorContent container,
  otherwise headings and lists render completely unstyled
- Memoize editor extensions array to prevent re-renders:
  ```ts
  const extensions = useMemo(() => [StarterKit, Image, Link.configure(...)], [])
  ```
- Use useEditorState() for read-only rendering instead of useEditor() for performance

### Tiptap Base Component Pattern
  ```ts
  'use client'
  import { useEditor, EditorContent } from '@tiptap/react'
  import StarterKit from '@tiptap/starter-kit'

  export function TiptapEditor({ content, onUpdate }) {
    const editor = useEditor({
      extensions: [StarterKit],
      content,
      immediatelyRender: false,  // ⚠️ REQUIRED for Next.js
      editorProps: {
        attributes: {
          class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4',
        },
      },
      onUpdate: ({ editor }) => onUpdate(editor.getJSON()),
    })
    return <EditorContent editor={editor} />
  }
  ```

### Tiptap Image Upload Pattern (Cloudinary)
- Never allow base64 images — always upload immediately and replace with URL
- Pattern:
  ```ts
  async function handleImageUpload(file: File) {
    // 1. Create base64 preview for immediate display
    const base64 = await fileToBase64(file)
    editor.chain().focus().setImage({ src: base64 }).run()

    // 2. Upload to Cloudinary via server action in background
    const { url } = await uploadImageAction(file)

    // 3. Replace base64 with permanent Cloudinary URL
    editor.chain().focus().updateAttributes('image', { src: url }).run()
  }
  ```

### Tiptap Content Storage
- Store content as JSON (editor.getJSON()) in DB — not HTML
- JSON is more stable across Tiptap version upgrades than HTML
- Render read-only view by passing stored JSON back to useEditor() content prop
- Journal.content field in Prisma is type Json

### Tiptap Common Errors to Avoid
- SSR hydration error → Fix: always set immediatelyRender: false
- Unstyled text → Fix: install @tailwindcss/typography, add prose class to container
- Multiple prosemirror-model versions → Fix: add resolutions in package.json:
  ```json
  "resolutions": { "prosemirror-model": "1.x.x" }
  ```
- Laggy typing on large documents → Fix: use useEditorState() for derived state,
  never read editor.getJSON() on every keystroke

### Multi-Day Color Select
- First click = range start, shift+click = range end
- Show color highlight preview across range during selection
- Color picker: shadcn/ui Popover with 12 preset hex colors
- Storage model: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD", colorHex: "#hex" }
- Single day: startDate === endDate
- Overlap rule: latest-created range wins, no merge logic needed

### Fuzzy Search (Fuse.js)
- Fuse.js for client-side: photo names, video names, journal titles
- Postgres FTS for server-side: event text, journal content
- Fuse.js config:
  ```ts
  { keys: ["title", "photoNames", "videoNames"], threshold: 0.3, includeScore: true }
  ```
- threshold 0.3 = reasonably strict (lower = stricter, higher = more fuzzy)
- Combine both result sets, deduplicate by date, sort by relevance score
- Always show which field matched in result snippet

### URL-Driven Navigation
- Month view:   /calendar/YYYY-MM
- Day detail:   /calendar/YYYY-MM-DD
- Journal view: /journal/[id]
- Journal edit: /journal/[id]/edit
- Search:       /search?q=keyword&from=YYYY-MM-DD&to=YYYY-MM-DD
- Always use Next.js router.push() — never window.location
- Browser back always returns to previous calendar state
- Day detail page always has breadcrumb back to its month view

### Clerk Auth
- Use auth() in server components and server actions
- Use useUser() and useOrganization() in client components
- organizationId = familyId — always filter ALL DB queries by this
- Never store userId or organizationId in component state manually
- Roles map: Clerk "admin" → OWNER, "basic_member" → MEMBER
- Redirect users with no organization to /settings to create their family
- Helpers in /lib/auth:
  - getFamily() → returns current organizationId and role from auth()
  - requireFamily() → throws if no organization (use in server actions)

### Database (Neon + Prisma)
- Always use Prisma transactions for multi-table writes
- All models include familyId (= Clerk organizationId) for data isolation
- Use Neon pooled connection URL for app, direct URL for migrations only
- Never expose DATABASE_URL to client components
- Use database branching in Neon for safe schema migrations:
  create branch → test migration → merge to main

### Cloudinary Media (Photos & Videos)
- SDK: use cloudinary v2 Node.js SDK (@cloudinary/url-gen for client transforms)
- Config in /lib/cloudinary/index.ts:
  ```ts
  import { v2 as cloudinary } from 'cloudinary'
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  export default cloudinary
  ```
- NEVER import cloudinary server SDK in client components — server actions only
- Client upload: use NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME with signed upload preset
- Never expose CLOUDINARY_API_SECRET to the client under any circumstance

### Cloudinary Folder Structure
- Pattern: /{familyId}/{YYYY}/{MM}/{DD}/{uuid}.{ext}
- Example: /fam_abc123/2026/02/27/f47ac10b-58cc.jpg
- Always generate UUID filename on upload to avoid collisions
- Use Node's crypto.randomUUID() for UUID generation

### Cloudinary Upload (Server Action)
- Always use signed uploads via server action, never unsigned from client
- Pattern:
  1. Client sends file to server action as FormData
  2. Server action calls cloudinary.uploader.upload() with folder + public_id
  3. Server action saves returned URL to DB via Prisma
  4. Return URL to client for optimistic UI update
- On upload error: throw descriptive error, client shows toast with retry button

### Cloudinary Photo Settings
- Accepted formats: jpg, png, webp — max 10MB
- On upload: auto-convert to webp for storage efficiency
  transformation: [{ fetch_format: 'webp', quality: 'auto' }]
- Thumbnail for grid view: w_400,h_400,c_fill,g_auto
- Full size view: w_1920,q_auto

### Cloudinary Video Settings
- Accepted formats: mp4, mov — max 200MB
- Use cloudinary.uploader.upload() with resource_type: 'video'
- Auto-generate poster thumbnail: replace /upload/ with /upload/so_0/ in URL
  Example: https://res.cloudinary.com/cloud/video/upload/so_0/fam/video.jpg
- Player modal: use HTML5 <video> tag with Cloudinary URL, not an embed

### Cloudinary Delete
- Always delete from both DB and Cloudinary in a single server action
- Never delete from DB without also deleting from Cloudinary (orphaned files)
- Pattern:
  1. Extract public_id from stored Cloudinary URL
  2. Call cloudinary.uploader.destroy(public_id, { resource_type })
  3. Only delete DB record if Cloudinary delete succeeds
  4. Wrap in try/catch — show toast on failure

### General Conventions
- Server components by default — use 'use client' only for interactive UI
- All server actions validate Clerk session + familyId before any DB operation
- Optimistic UI updates for all calendar mutations (add/edit/delete)
- Date handling: always store UTC in DB, display in user's local timezone
- All API routes return consistent { data, error } shape
- Use shadcn/ui components as the base — never build UI primitives from scratch
- Toast notifications for all async operation results (success + error)

---

## Key Commands
```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run db:push       # Push Prisma schema (dev only)
npm run db:migrate    # Run migrations (production)
npm run db:studio     # Prisma Studio GUI
```

---

## Environment Variables
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/calendar
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/settings

# Neon PostgreSQL
DATABASE_URL=           # Pooled connection (app queries)
DIRECT_URL=             # Direct connection (migrations only)

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=   # Client-side URL generation only
```

---

## Installed Skills
- frontend-design          (anthropics/skills)
- skill-creator            (anthropics/skills)
- vercel-react-best-practices  (vercel-labs/agent-skills)
- web-design-guidelines    (vercel-labs/agent-skills)
- vercel-composition-patterns  (vercel-labs/agent-skills)
- nextjs16-skills          (gocallum/nextjs16-agent-skills)
- clerk-nextjs-skills      (gocallum/nextjs16-agent-skills)
- prisma-orm-v7-skills     (gocallum/nextjs16-agent-skills)
- ai-sdk-6-skills          (gocallum/nextjs16-agent-skills)
- mcp-server-skills        (gocallum/nextjs16-agent-skills)
- neon-postgres            (neondatabase/agent-skills)
- tiptap                   (not installed — covered by Tiptap conventions in this file)
