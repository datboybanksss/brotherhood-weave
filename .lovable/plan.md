# Bento-grid Home page (mobile-first, every tile is tappable)

Adapting the bento-grid idea to Family Ties: mobile-first 2-col grid, varied tile sizes, our own content, and **every tile navigates to its dedicated tab/page** so the home becomes a true launch pad.

## Why not the raw component
- Reference is desktop-first (3-col × 3-row); on mobile (390px) it collapses to a plain stack — same problem we have today.
- Hard-coded "Integrations / Doc Hands" slots don't map to brotherhood content.
- Pulls in `framer-motion` just for stagger — we already have `animate-fade-in` in our Tailwind config.

## Layout

Mobile-first 2-col, expanding to 4-col on `md+`. Tile importance drives `col-span` / `row-span`.

```text
Mobile (390px, 2 cols)            md+ (4 cols)
┌─────────────────────────┐       ┌────┬────┬────┬────┐
│  Welcome (full)         │       │ Welcome (span 4)  │
├─────────────────────────┤       ├────┴────┼────┴────┤
│  Peer of the week       │       │  Peer   │ 100km   │
│  (full, hero) → /me     │       │ (span 2)│ Challenge│
├───────────┬─────────────┤       │         │(span 2, │
│ Brother-  │  Tier       │       │         │ row 2)  │
│ hood →    │  Progress   │       ├────┬────┤         │
│/brotherhd │  → /me      │       │ B'h│Tier│         │
├───────────┴─────────────┤       ├────┴────┼────┬────┤
│  100km Challenge        │       │ Depts   │Fit │Runs│
│  (full) → /fitness      │       │(span 2) │    │    │
├───────────┬─────────────┤       └─────────┴────┴────┘
│ Depts →   │  Fitness →  │
│/communit. │  /fitness   │
├───────────┴─────────────┤
│ Latest runs → /fitness  │
└─────────────────────────┘
```

## Tile → destination map (the "every tile is a tab" rule)

| Tile | Destination | Existing route? |
|---|---|---|
| Welcome strip | `/account` (avatar tap) | yes |
| Peer of the week | `/member/:partnerId` (single) or `/me` (waiting) | yes |
| 100km Challenge | `/fitness` (new "Challenge" deep section, scroll anchor `#challenge`) | yes |
| Brotherhood count | `/brotherhood` | yes |
| Tier progress | `/me` (scrolls to checklist, anchor `#tier`) | yes |
| Departments | `/communities` (or first dept channel) | yes |
| Fitness hub | `/fitness` | yes |
| Latest runs | `/fitness#runs` | yes |

Tiles that today contain inner buttons (Connect Strava, Log Run, View profile) keep those buttons functional but the **rest of the tile area** becomes a tappable surface that routes to the destination above. Inner buttons use `e.stopPropagation()` so they don't double-fire.

## Visual treatment
- Uniform `rounded-2xl border border-border/60 bg-card shadow-sm`, `p-4` interior.
- Grid: `grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[minmax(120px,auto)]`.
- Hero tiles get a faint primary gradient `bg-gradient-to-br from-card to-primary/5`.
- Compact stat tiles: big number/icon top, label, `ChevronRight` bottom-right hinting "tap to open".
- `animate-fade-in` from existing config — no `framer-motion` install.
- Each tappable tile: `role="link"`, `tabIndex={0}`, `cursor-pointer`, `hover:bg-muted/30 transition-colors`, `focus-visible:ring-2 ring-primary`.

## Files to change

1. **New `src/components/home/BentoGrid.tsx`** — `<BentoGrid>` wrapper + `<BentoTile span={{base, md}} variant="default|hero|stat" to?: string onClick?: () => void>` that applies the shell, fade-in, and (when `to` is set) wraps in a navigable surface using `useNavigate`. Renders `ChevronRight` indicator for stat variant.
2. **`src/pages/Home.tsx`** — replace `space-y-5` stack with `<BentoGrid>` containing each tile with its `to` destination from the table above. Pull `RecentRunsFeed` out of `CollectiveChallengeCard` into its own `<BentoTile to="/fitness#runs">`.
3. **`src/components/home/CollectiveChallengeCard.tsx`** — remove inner "Latest from the brotherhood" block (moves out). Strip outer card chrome (BentoTile provides it). Make body tappable → `/fitness#challenge`; "Connect/Sync Strava" and "Log a run manually" buttons stay, with `stopPropagation`.
4. **`src/components/home/BrotherhoodCard.tsx`** — restyle as compact stat tile (big count, "brothers", small 3-avatar constellation), strip own card chrome, navigation handled by BentoTile (`to="/brotherhood"`).
5. **`src/components/home/TierProgressMini.tsx`** — restyle as compact stat tile, strip own button (BentoTile is the button) → `/me#tier`.
6. **`src/components/home/FitnessHubCard.tsx`** — convert to compact vertical stat tile, strip own card chrome → `/fitness`.
7. **`src/components/home/DepartmentsCard.tsx`** — strip own card chrome. Whole tile navigates to `/communities`; individual department rows keep their own click handlers (with `stopPropagation`) so tapping a specific dept still jumps straight to that channel.
8. **`src/components/home/PeerPartnerCardSingle.tsx` / `Trio.tsx` / `Waiting.tsx`** — strip outer `rounded-xl border bg-card p-5`. Single → BentoTile routes to `/member/:partnerId`; Trio → keep per-row buttons with `stopPropagation`, tile itself routes to `/me`; Waiting → tile routes to `/me`.
9. **New `src/components/home/RecentRunsTile.tsx`** — wraps `RecentRunsFeed` with a "Latest runs" heading and "View all" hint; whole tile → `/fitness#runs`.
10. **`src/pages/Me.tsx`** — add `id="tier"` anchor on the `TierProgressChecklist` wrapper and a `useEffect` hash-scroll handler (mirroring the `#bio` pattern already in `Account.tsx`).
11. **`src/pages/Fitness.tsx`** — add `id="challenge"` and `id="runs"` anchors on the relevant sections plus a hash-scroll `useEffect`.

## What we're NOT doing
- Not installing `framer-motion`.
- Not copying the demo's Doc Hands / Integrations / Feature Tags slots.
- Not changing data hooks, RLS, or the bottom tab nav.
- Not changing `/me` layout beyond adding the `#tier` anchor.

## Mobile QA (390×822)
- `CircularProgress` (180px) fits inside full-width hero tile (~358px).
- Stat tiles ~170×170, paired cleanly side-by-side.
- Tap targets ≥ 44px; nested buttons (Strava, Log Run, dept rows) don't bubble to tile navigation.
- Empty states (no peer, no runs, no depts) still look intentional inside their tile.
- Keyboard: each tile is focusable with visible ring; Enter/Space navigates.
