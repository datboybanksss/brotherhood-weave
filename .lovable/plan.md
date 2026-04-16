

## Plan: Add back buttons to admin pages

All four admin pages (Approvals, Playbooks list, Archives list) and both form pages lack a back button, trapping users on those screens since they're outside the `PaidLayout` with its bottom tab nav.

### Changes

**`src/pages/admin/PlaybooksList.tsx`** — Add a back button above the header that navigates to `/me`.

**`src/pages/admin/ArchivesList.tsx`** — Same back button to `/me`.

**`src/pages/admin/Approvals.tsx`** — Same back button to `/me`.

**`src/pages/admin/ArchiveForm.tsx`** — Add a back button to `/admin/archives`.

**`src/pages/admin/PlaybookForm.tsx`** — Add a back button to `/admin/playbooks`.

Each back button uses `<Button variant="ghost" size="sm">` with the `ArrowLeft` lucide icon, consistent with the pattern already used in `ArchiveDetail.tsx` and `LessonReader.tsx`.

