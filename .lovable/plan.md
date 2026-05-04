## The gap

Right now `/me` is a settings/control panel — it shows your avatar, tier progress, departments selector, admin links, sign out. But there's no way for you to see what *other members* see when they tap your profile from Brotherhood. `MemberProfile` (`/member/:id`) shows: header (avatar, tier, primary dept, member since) → bio → all department badges → latest run.

Members can preview other people but not themselves. That's the asymmetry to fix.

## Recommendation: Instagram-style "your profile is the page"

Convert `/me` into a **self-view of your public profile**, with private controls tucked behind clear affordances — exactly how Instagram does it.

### New /me layout (top to bottom)

```text
┌─────────────────────────────────┐
│  ← (none)        ⚙ settings icon│  ← top bar
│                                 │
│         [Avatar w/ tier ring]   │
│         Full Name               │
│         [Tier Badge]            │
│         Primary Dept · Joined   │
│                                 │
│  [ Edit profile ] [ Share ]     │  ← primary actions row
│                                 │
│  About                          │
│  ┌───────────────────────────┐  │
│  │ Bio text (or "Add a bio") │  │
│  └───────────────────────────┘  │
│                                 │
│  Departments                    │
│  [Dept] [Dept] [Dept]           │
│                                 │
│  Latest run                     │
│  (LatestRunCard for self)       │
│                                 │
│  ─── Tier Progress ───          │  (only if Foundation)
│  Ascend to Independent Thinker  │
│  ☑ Attend 2 meetings…           │
│                                 │
│  ─── Admin ───                  │  (only if is_admin)
│  Approvals · Modules · …        │
└─────────────────────────────────┘
```

The page now **looks like** what other members see, with three additions a public viewer wouldn't get:
1. A top-right **settings gear** (`⚙`) → navigates to `/account` (existing page already has Edit Profile form, Strava, danger zone, rewatch onboarding, etc.)
2. An **Edit profile** button right under the header → also goes to `/account`, scrolled to the edit form
3. **Tier progress** and **Admin** sections kept below the public view (private to you)

### What moves where

| Current location | New location |
|---|---|
| ProfileHeader on /me | Replaced by `PublicProfileHeader` (same component used on `/member/:id`) |
| "Account settings" link at top | Becomes a gear icon top-right + "Edit profile" button |
| TierProgressChecklist | Stays on /me, below the public view, only for Foundation |
| DepartmentSelector (full picker grid) | **Moved to /account** — editing departments is a settings action. /me just shows them as badges (read-only) |
| AdminSection | Stays on /me, below tier progress |
| SignOutButton | **Moved to /account** (it already lives there implicitly via Sign out — actually it's only on /me today; move it to /account so /me stays clean) |

### Details / technical notes

- **Reuse `PublicProfileHeader`, `BioCard`, `LatestRunCard`** — same components as `MemberProfile.tsx`, fed with the current user's data. This guarantees the self-view is byte-identical to what others see.
- Pull self data via `getPublicMemberById(appUser.id)` so any RLS/view-layer filtering applied to the public view also applies to the self-view (true WYSIWYG).
- **Share button**: copies a link to `/member/{id}` to clipboard via `navigator.clipboard` + sonner toast. No new infra.
- **Edit profile button** + gear icon: both navigate to `/account`. The gear is in the top-right corner of /me (`absolute top-4 right-4` style).
- **Add empty state for bio**: if `bio` is null, `BioCard` shows "No bio yet" — for self-view, swap that to a tappable "Add a bio" CTA that navigates to `/account#bio`.
- `Account.tsx` gains a `DepartmentSelector` section (between `EditProfileForm` and `StravaConnection`) and a `SignOutButton` near the bottom (above `DangerZone`). Both components already exist — just import them.
- Optional polish: support `/account#bio` hash to scroll/focus the bio textarea on arrival from the empty-bio CTA.

### Files touched

- `src/pages/Me.tsx` — full rewrite of layout
- `src/pages/Account.tsx` — add DepartmentSelector + SignOutButton sections
- `src/components/me/ProfileHeader.tsx` — delete (replaced by PublicProfileHeader)
- `src/components/member/BioCard.tsx` — add optional `isOwnProfile` prop with empty-state CTA
- No DB / RLS / edge function changes

### What this fixes

- Closes the "I can see everyone but myself" gap
- Makes /me feel like a profile (familiar Instagram pattern) rather than a settings drawer
- Keeps power-user controls one tap away (gear icon, Edit profile button) without cluttering the profile view
- /account becomes the single home for *all* settings (profile edit, departments, integrations, sign out, danger zone)
