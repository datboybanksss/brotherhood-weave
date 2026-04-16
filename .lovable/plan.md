

# Admin Module & Lesson Management

## Overview
Add admin CRUD for **Modules** and their **Lessons**, following the same pattern as Archives (list page with edit/delete, form page for create/edit). This lets you add new course modules and their lessons (with video URLs, markdown body, worksheet PDFs) directly from the app.

## Database Changes

**Migration: Allow admin writes to `modules` and `lessons` tables**

Currently both tables are read-only (no INSERT/UPDATE/DELETE policies). We need RLS policies for admins:

```sql
-- Modules: admin full CRUD
CREATE POLICY "Admins can insert modules" ON public.modules FOR INSERT TO authenticated WITH CHECK (is_current_user_admin());
CREATE POLICY "Admins can update modules" ON public.modules FOR UPDATE TO authenticated USING (is_current_user_admin());
CREATE POLICY "Admins can delete modules" ON public.modules FOR DELETE TO authenticated USING (is_current_user_admin());

-- Lessons: admin full CRUD
CREATE POLICY "Admins can insert lessons" ON public.lessons FOR INSERT TO authenticated WITH CHECK (is_current_user_admin());
CREATE POLICY "Admins can update lessons" ON public.lessons FOR UPDATE TO authenticated USING (is_current_user_admin());
CREATE POLICY "Admins can delete lessons" ON public.lessons FOR DELETE TO authenticated USING (is_current_user_admin());
```

## New Files

### API Layer
**`src/api/admin-modules.ts`** — CRUD functions:
- `getAdminModules()` — all modules ordered by display_order
- `createModule(values)` — insert with title, slug, description, display_order, required_tier_id
- `updateModule(id, values)` — update fields
- `deleteModule(id)` — delete module (cascading lesson cleanup left to admin discretion)
- `getModuleLessons(moduleId)` — all lessons for a module
- `createLesson(values)` — insert lesson with title, video_url, body_markdown, worksheet_pdf_url, display_order, module_id
- `updateLesson(id, values)` — update lesson
- `deleteLesson(id)` — delete lesson

### Admin Pages
**`src/pages/admin/ModulesList.tsx`** — List all modules with edit/delete buttons and a "New" button. Same layout as ArchivesList. Back button goes to `/me`.

**`src/pages/admin/ModuleForm.tsx`** — Create/edit a module:
- Fields: Title, Description, Display Order (number), Required Tier (dropdown of Foundation/Independent Thinker/Founding Member)
- Slug auto-generated from title (lowercase, hyphens, collision handling with -2, -3)
- Back button goes to `/admin/modules`

**`src/pages/admin/LessonForm.tsx`** — Create/edit a lesson within a module:
- Fields: Title, Video URL, Body (markdown textarea), Worksheet PDF URL, Display Order (number)
- Back button goes to `/admin/modules/:id/edit`

### Module Form includes inline lesson list
The ModuleForm page will show the module's lessons below the form (when editing), with add/edit/delete controls — similar to how you manage items within a parent entity.

## Modified Files

**`src/components/me/AdminSection.tsx`** — Add "Modules" link with `Layers` icon to the admin links array, pointing to `/admin/modules`.

**`src/App.tsx`** — Register four new routes:
- `/admin/modules` → ModulesList
- `/admin/modules/new` → ModuleForm
- `/admin/modules/:id/edit` → ModuleForm
- `/admin/modules/:moduleId/lessons/new` → LessonForm
- `/admin/modules/:moduleId/lessons/:lessonId/edit` → LessonForm

## Slug Generation
Same logic as playbooks: lowercase → replace non-alphanumeric with hyphens → collapse consecutive → strip leading/trailing → check DB for collisions and append `-2`, `-3` etc.

## Build Order
1. Migration (RLS policies for modules + lessons)
2. API layer (`admin-modules.ts`)
3. ModulesList page
4. ModuleForm page (with inline lesson list for edit mode)
5. LessonForm page
6. AdminSection link + App.tsx routes

