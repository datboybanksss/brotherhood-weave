

# Library System Implementation Plan

## Overview
Transform the Library tab into a three-layer knowledge system: **The Core** (tier-gated courses with sequential lesson unlocking), **The Archives** (recorded meetings), and **The Playbooks** (member-authored frameworks). Includes admin CRUD, progress tracking, and module-completion-driven tier upgrades.

## Database Migration

A single migration covering:

**Schema changes:**
- Add columns to `lessons`: `video_url text`, `body_markdown text`, `worksheet_pdf_url text`, `duration_seconds int`
- Create `user_lesson_progress` table (id, user_id, lesson_id, completed_at, UNIQUE(user_id, lesson_id))
- Create `archives` table (id, title, description, recording_url, recorded_at, created_by, created_at, is_published)
- Create enum `playbook_category` ('money','career','relationships','health','mindset','craft')
- Create `playbooks` table (id, title, slug UNIQUE, summary, body_markdown, category, author_id, pdf_attachment_url, last_reviewed_at, is_published, created_at, updated_at)
- Auto-update `updated_at` trigger on playbooks

**Module-completion trigger:**
- On `user_lesson_progress` INSERT/UPDATE: count completed lessons for that module. If all done, upsert `user_module_progress` with `completed_at = now()` and call `evaluate_tier_upgrade(user_id)`.

**RLS policies:**
- `user_lesson_progress`: users SELECT/INSERT/UPDATE own rows; admins SELECT all
- `archives`: paid users SELECT where is_published=true; admins full CRUD
- `playbooks`: same pattern as archives

**Storage buckets:** `lesson-worksheets` and `playbook-attachments` (public read for authenticated, admin-only write, PDF only)

**Seed data (via INSERT in migration):**
- Update 6 Identity Alchemy lessons with titles ("Who You Were Told You Are", etc.), video_url, body_markdown, duration_seconds
- Insert 2 archives ("Founding Circle — March 2026", "The Money Conversation — April 2026")
- Insert 3 playbooks by the three founders with real-ish content

## Dependencies
- `react-markdown` — markdown rendering
- `@tailwindcss/typography` — prose styles
- `remark-gfm` — GFM support
- Add typography plugin to `tailwind.config.ts`

## Files to Create

**API layers:**
- `src/api/lessons.ts` — getLessonsByModule, markLessonComplete, getUserLessonProgress
- `src/api/archives.ts` — getArchives, getArchive
- `src/api/playbooks.ts` — getPlaybooks, getPlaybook (with slug-generation utils including collision handling)
- `src/api/admin-archives.ts` — CRUD operations
- `src/api/admin-playbooks.ts` — CRUD with PDF upload, slug generation with `-2`, `-3` collision suffixes

**Shared library components:**
- `src/components/library/LessonVideoEmbed.tsx` — parses YouTube (watch/embed/youtu.be) and Vimeo URLs into embed iframes
- `src/components/library/MarkCompleteButton.tsx` — honor-system completion button with completed state
- `src/components/library/LessonRow.tsx` — lesson row with status icons (check/circle/lock)
- `src/components/library/CoreList.tsx` — modules with progress bars and tier gating
- `src/components/library/ArchivesList.tsx` — archive list ordered by recorded_at DESC
- `src/components/library/ArchiveRow.tsx` — single archive row
- `src/components/library/PlaybooksList.tsx` — grid with category filtering
- `src/components/library/PlaybookCard.tsx` — card with category tag, author, summary
- `src/components/library/CategoryFilterChips.tsx` — horizontal scroll chips

**Pages:**
- `src/pages/ModuleDetail.tsx` — lesson list with sequential unlock logic
- `src/pages/LessonReader.tsx` — video + markdown + worksheet + mark-complete + next-lesson
- `src/pages/ArchiveDetail.tsx` — archive video player
- `src/pages/PlaybookDetail.tsx` — markdown reader with author info

**Admin pages:**
- `src/pages/admin/ArchivesList.tsx` — list with edit/delete
- `src/pages/admin/ArchiveForm.tsx` — create/edit form
- `src/pages/admin/PlaybooksList.tsx` — list with edit/delete
- `src/pages/admin/PlaybookForm.tsx` — create/edit with PDF upload, slug gen, markdown preview

**Admin components:**
- `src/components/admin/PdfUploadField.tsx` — reusable PDF upload to storage buckets
- `src/components/me/AdminSection.tsx` — replaces AdminLink with grouped admin links (Approvals, Archives, Playbooks)

## Files to Modify

- `src/pages/Library.tsx` — replace with shadcn Tabs (The Core / The Archives / The Playbooks), tab state in URL search params
- `src/components/library/ModuleCard.tsx` — add progress bar, navigation to `/library/module/:slug`, required tier label
- `src/App.tsx` — register all new routes (module detail, lesson reader, archive detail, playbook detail, 4 admin routes)
- `src/pages/Me.tsx` — swap `AdminLink` for `AdminSection`
- `tailwind.config.ts` — add `@tailwindcss/typography` plugin

## Key Design Decisions

**Video URL parsing:** LessonVideoEmbed handles `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`, and `vimeo.com/` — converting all to embed URLs.

**Sequential unlock:** Lesson N is available only if user_lesson_progress has a completed_at row for lesson N-1. Lesson 1 always available if tier allows the module.

**Slug generation:** Lowercase → replace non-alphanumeric with hyphens → collapse consecutive → strip edges → query DB for collisions appending `-2`, `-3`, etc.

**Module completion trigger:** SECURITY DEFINER function that counts total lessons vs completed lessons, upserts user_module_progress, and calls evaluate_tier_upgrade. This connects lesson completion all the way to tier promotion.

## Build Order
1. Migration (schema + RLS + triggers + storage + seed)
2. Dependencies + tailwind config
3. API layers (lessons, archives, playbooks, admin variants)
4. Shared components (VideoEmbed, MarkComplete, LessonRow)
5. Core flow (CoreList, ModuleCard update, ModuleDetail, LessonReader)
6. Library.tsx refactor with Tabs
7. Archives flow
8. Playbooks flow
9. Admin CRUD pages
10. Me tab AdminSection + App.tsx routes

