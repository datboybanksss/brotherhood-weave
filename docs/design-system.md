# Family Ties Design System v1

The single source of truth for how Family Ties looks and feels. This document defines the brand identity in design tokens — colors, typography, spacing, components, and rules — so every screen feels like the same product.

**Direction:** Editorial Brotherhood. Serious without being humorless. Premium without being flashy. A private members' app you have access to because you earned it.

**Reference brands:** Hyrox (discipline). Apple (restraint). Monocle/The Drake (editorial). Daniel Dalen (geometric minimalism). The Social Network (intelligent ambition).

**Anti-patterns:** Trading bro aesthetics. Patagonia warm-outdoorsy. Generic startup gradients. Dark-mode crypto. Anything loud. Anything performative.

---

## 1. Color System

The whole system runs on three colors plus controlled neutrals. Royal blue is the only saturated color used. Restraint is the brand.

### Brand
| Token | Hex | Usage |
|---|---|---|
| `brand.royal` | `#1512D3` | The brand color. Primary actions, tier rings, key highlights, the mark. Used sparingly with intent. |
| `brand.royal.deep` | `#0E0CA8` | Hover/pressed states for primary buttons. Deeper variant for layered moments. |
| `brand.royal.tint` | `#E8E7FA` | Subtle backgrounds for selected states, hover overlays. Almost imperceptible. |

### Surface (backgrounds)
| Token | Hex | Usage |
|---|---|---|
| `surface.white` | `#FFFFFF` | Default background for all screens. The page. |
| `surface.cream` | `#FAF7F2` | Reserved for moments — the welcome screen, the onboarding modal, the recap section after an event. Use sparingly. |
| `surface.ink` | `#0A0A0F` | Inverted surfaces — the FAB, dark cards used as moments, modal overlays. Used rarely. |

### Text
| Token | Hex | Usage |
|---|---|---|
| `text.ink` | `#0A0A0F` | Primary text. Headings, body copy, labels. |
| `text.muted` | `#5A5A66` | Secondary text. Metadata, captions, helper text. |
| `text.faint` | `#9899A1` | Tertiary text. Timestamps, "View all" links, dividers between text. |
| `text.inverse` | `#FFFFFF` | Text on dark surfaces or on the royal blue brand color. |

### Stroke & Divider
| Token | Hex | Usage |
|---|---|---|
| `stroke.hairline` | `#E8E8EC` | Hairline borders on cards, dividers between rows. The default stroke. |
| `stroke.strong` | `#0A0A0F` | Borders that need presence — inputs, ghost buttons. |

### Tier (already defined, kept)
| Tier | Hex | Usage |
|---|---|---|
| Foundation | `#9CA3AF` | Avatar ring for Foundation members. |
| Independent Thinker | `#7B9FFF` | Avatar ring for Independent Thinker members. |
| Founding Member | `#1512D3` | Avatar ring for Founding Members (matches brand royal). |

### Semantic (use rarely, only when meaning is essential)
| Token | Hex | Usage |
|---|---|---|
| `state.success` | `#1A7F5A` | Verified Strava badge, completed states. Muted forest green, not bright. |
| `state.warning` | `#9C6B0A` | Forfeit watchlist warnings, scheduled-but-locked states. Muted amber. |
| `state.danger` | `#A02A2A` | Destructive confirmations only. Never decorative. Muted oxblood. |

**Forbidden:** Pure red (#FF0000), neon greens, pastels, gradients of any kind, more than one accent per screen.

---

## 2. Typography

Two typefaces. Editorial serif for moments, clean sans for the rest. The serif is the personality. The sans is the workhorse.

### Type Families

**Display Serif:** `PP Editorial New` — the typeface used in the Family Ties logo. High-contrast modern serif with strong italic. Used for the brand mark and editorial moments.

Fallback if PP Editorial New isn't available: `Tiempos Headline`, `Boldoni 72`, or `serif`. License-free fallback: `Playfair Display`.

**Body Sans:** `Inter` — clean, neutral, infinitely legible at every size. Used for everything functional.

Fallback: `Söhne`, `Neue Haas Grotesk`, `Helvetica Neue`, `system-ui`.

### Type Scale

Mobile-first. Sizes scale up at tablet (`sm:`) and desktop (`lg:`).

| Token | Family | Weight | Size | Line Height | Tracking | Usage |
|---|---|---|---|---|---|---|
| `display.hero` | Serif | 400 italic | 48px / 56px lg | 1.05 | -0.02em | Welcome moments. Brand displays. Used 1-2x per screen max. |
| `display.h1` | Serif | 400 italic | 32px / 40px lg | 1.1 | -0.02em | Page titles. Member name on profile. |
| `display.h2` | Serif | 400 | 24px / 28px lg | 1.15 | -0.01em | Section headers in editorial contexts (Archives, recaps). |
| `heading.lg` | Sans | 600 | 20px | 1.25 | -0.01em | Card titles. Subsections. |
| `heading.md` | Sans | 600 | 16px | 1.3 | 0 | Inline section labels. |
| `body.lg` | Sans | 400 | 16px | 1.5 | 0 | Default body text. |
| `body.md` | Sans | 400 | 14px | 1.5 | 0 | Secondary body. Most UI. |
| `body.sm` | Sans | 400 | 13px | 1.4 | 0 | Metadata, helper text. |
| `label` | Sans | 500 | 12px | 1.3 | 0.04em uppercase | Small caps labels. "EST. '26" energy. |
| `mono` | Mono | 400 | 13px | 1.4 | 0 | Numbers, stats, timestamps. Use `JetBrains Mono` or `system-ui mono`. |

### Typographic Rules

- **Headlines and member names use serif italic.** This is the brand voice. Don't substitute sans here.
- **All UI labels, buttons, navigation use sans.** Serif anywhere it has to feel functional kills the editorial feeling.
- **Small caps labels (`label` style)** are used for metadata that wants to feel intentional — section titles, "EST. '26", "FOUNDING MEMBER" tier label.
- **Numbers and stats use the mono variant** — gives a slight ledger/document quality. "73 / 100 KM" reads better in mono than sans.
- **Italic is reserved for the serif family only.** No italic sans. No italic body text.
- **Underlines never used for emphasis.** Use weight or color instead.

---

## 3. Spacing & Layout

Generous whitespace is the brand. More than feels comfortable at first.

### Spacing Scale (4px base)
| Token | px | Usage |
|---|---|---|
| `space.0` | 0 | Reset |
| `space.1` | 4px | Tight inline spacing |
| `space.2` | 8px | Inline groups |
| `space.3` | 12px | Default inline gap |
| `space.4` | 16px | Default block gap |
| `space.6` | 24px | Section gap inside a card |
| `space.8` | 32px | Card-to-card gap on a page |
| `space.12` | 48px | Major section break |
| `space.16` | 64px | Page top padding (mobile) |
| `space.24` | 96px | Hero moment vertical breathing |

### Page Margins
- **Mobile:** 20px horizontal padding
- **Tablet:** 32px horizontal padding
- **Desktop:** 48px horizontal padding, max-width 720px for editorial pages, 1080px for utility pages

### Vertical Rhythm
- Cards/sections separated by `space.8` (32px) on mobile, `space.12` (48px) on desktop
- Inside a card, related elements use `space.4` (16px), unrelated use `space.6` (24px)
- A page should feel paginated, not cluttered

---

## 4. Component Personality

### Corners
**Sharp 90-degree corners by default.** Rounded corners are the prototype look — they had to go.

Exceptions:
- Avatar (always circular)
- The FAB (always circular)
- Pills/badges (`8px` rounded — small enough to feel intentional, not playful)

No `rounded-2xl`, no `rounded-xl`, no `rounded-lg`. Use `rounded-none` or `rounded-sm` (`2px`) for everything else.

### Cards
**Cards are barely there.** Defined by spacing, not by visual containers.

Default card: white background, no border, separated from siblings by `space.8` vertical gap.

Card with hairline border: `border border-stroke-hairline` — used when the card needs to feel slightly contained (e.g., a list of options).

Card with shadow: **forbidden.** No shadows. Ever. Shadows are the prototype look.

### Buttons

Two variants only. Both share: sharp corners, sans-serif label, `space.3` vertical / `space.6` horizontal padding, no shadow.

**Primary** — solid royal blue background, white text. The single CTA per screen.
```
bg-brand-royal text-white hover:bg-brand-royal-deep
```

**Ghost** — transparent background, ink border (`border border-stroke-strong`), ink text. Everything else.
```
bg-transparent text-text-ink border border-stroke-strong hover:bg-text-ink hover:text-white
```

Sizes: default (44px height — touch target compliant), small (36px) for inline secondary actions.

**Forbidden:** secondary fills (gray buttons), 3-color buttons, text-only links styled as buttons, gradient backgrounds, pill-shaped buttons (only the FAB is pill/circle).

### Inputs
- 44px min height (touch target)
- Sharp corners
- 1px border, `stroke-hairline` default, `brand-royal` on focus
- Label above input, sans-serif, weight 500
- No floating labels

### Avatars
Keep the existing tier-ring system. It's already a strong brand element.

Sizes:
- `xs` (24px) — inline mentions
- `sm` (32px) — list rows, message senders
- `md` (40px) — default everywhere
- `lg` (64px) — page headers, peer card
- `xl` (96px) — own profile only

### Icons
`lucide-react` only. Stroke width 1.5 (thinnest readable). Never filled icons. Color matches the text color of their context.

Forbidden: emoji used as UI icons, custom icon sets, multi-color icons.

### Dividers
Hairline only. `border-t border-stroke-hairline`. Never thicker, never colored.

---

## 5. Imagery & Photography

When photos are used (member profile photos, event covers, archive covers):

- **Treat photography as photography, not decoration.** Full bleed, real ratios, no decorative overlays.
- **Color photos preferred over black-and-white** — but the system tolerates both well.
- **No photo filters or effects.** No Instagram presets, no duotones (except the Strava-orange verified badge).
- **Empty states never use photography.** Use the cover placeholder pattern (domain color block + serif title).

When no photo exists, the **placeholder card** renders:
- Royal blue or domain-color background
- Serif italic title centered
- Small caps label below ("VIDEO" / "DOCUMENT" / "ARTICLE")

---

## 6. Motion

Motion is restrained. The brand doesn't bounce, doesn't spring.

- **Default transition:** 200ms `ease-out`
- **Page transitions:** none. Pages snap. (Resists the urge to add fade-ins everywhere.)
- **Hover states:** color change only, never scale or shadow shifts
- **FAB:** subtle 100ms scale on press (`active:scale-95`), nothing else
- **Modal entry:** 250ms slide-up from bottom on mobile, 200ms fade on desktop
- **Toast notifications:** slide in from bottom, dismiss after 4s

**Forbidden:** spring physics, parallax, particle effects, animated gradients, micro-interactions on cards (no card-lift on hover).

---

## 7. The Editorial Voice

The same restraint applies to copy throughout the app.

### Tone Rules
- **First person plural for the brotherhood as a whole.** "We do the work." Not "Family Ties does the work."
- **Second person singular for the member.** "Your peer this week." Not "Members get a peer."
- **Active voice always.** "Themba ran 7km." Not "A 7km run was logged by Themba."
- **No exclamation marks.** Restraint is the brand. The work speaks.
- **No emoji in UI copy.** Members can use emoji in their messages and bios. The system itself doesn't.
- **No "!" or "🔥" in milestones.** "4-week streak" is enough. The streak itself is the celebration.

### Voice Samples
✅ "Welcome, Kgosi."
❌ "Hey Kgosi! 👋 Ready to crush it today?"

✅ "Themba completed 80 push-ups."
❌ "🎉 BOOM! Themba just smashed 80 push-ups! 💪"

✅ "Brotherhood total: 73 / 100 km."
❌ "🏃 The brotherhood is on fire! 73km logged!"

✅ "Sunday 7km Run. Wherever you are."
❌ "Don't miss out — RSVP for our awesome Sunday Run event!"

The voice is "older brother who has earned the right to speak." Not coach. Not announcer. Not hype-man.

---

## 8. Implementation in Tailwind

The design tokens above translate to Tailwind config extensions. Add these to `tailwind.config.ts`:

```ts
extend: {
  colors: {
    brand: {
      royal: '#1512D3',
      'royal-deep': '#0E0CA8',
      'royal-tint': '#E8E7FA',
    },
    surface: {
      white: '#FFFFFF',
      cream: '#FAF7F2',
      ink: '#0A0A0F',
    },
    text: {
      ink: '#0A0A0F',
      muted: '#5A5A66',
      faint: '#9899A1',
      inverse: '#FFFFFF',
    },
    stroke: {
      hairline: '#E8E8EC',
      strong: '#0A0A0F',
    },
    state: {
      success: '#1A7F5A',
      warning: '#9C6B0A',
      danger: '#A02A2A',
    },
    tier: {
      foundation: '#9CA3AF',
      thinker: '#7B9FFF',
      founding: '#1512D3',
    },
  },
  fontFamily: {
    serif: ['"PP Editorial New"', 'Playfair Display', 'serif'],
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
  },
  fontSize: {
    'display-hero': ['48px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
    'display-h1': ['32px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
    'display-h2': ['24px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
    'heading-lg': ['20px', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
    'heading-md': ['16px', { lineHeight: '1.3' }],
    'body-lg': ['16px', { lineHeight: '1.5' }],
    'body-md': ['14px', { lineHeight: '1.5' }],
    'body-sm': ['13px', { lineHeight: '1.4' }],
    'label': ['12px', { lineHeight: '1.3', letterSpacing: '0.04em' }],
    'mono': ['13px', { lineHeight: '1.4' }],
  },
  borderRadius: {
    DEFAULT: '0',
    sm: '2px',
    pill: '8px',  // for badges only
    full: '9999px',  // avatars and FAB only
  },
}
```

---

## 9. Application Order

This system gets applied in priority order, screen by screen:

**Phase 1 — Foundation (one sprint)**
- Tailwind config tokens added
- PP Editorial New (or Playfair Display fallback) loaded via Google Fonts
- Inter loaded
- Global styles updated to use the new color and typography defaults
- Existing components (Button, Card, Input, Badge in `src/components/ui/`) updated to match the new design tokens — this is the ONE allowed exception to "don't modify shadcn/ui" because we're rewriting them as part of system adoption

**Phase 2 — High-traffic screens (one sprint each)**
1. Login + Signup + Invite redemption
2. Home tab
3. Member Profile (own + public)
4. Communities (Channels + Events)
5. Fitness page
6. Library (Core + Archives + Playbooks)

**Phase 3 — Polish (one sprint)**
- Onboarding modal redesign
- Empty states across the app
- Toasts and notifications
- Loading states and skeletons

---

## 10. The One Rule

When in doubt: **less.**

Less color. Less ornament. Less motion. Less copy. Less surface. Less weight.

If a screen feels finished and you're tempted to add one more thing — a divider, a badge, a shadow, an icon, an exclamation mark — don't. The restraint is the brand.

---

*Family Ties Design System v1*
*Locked: May 5, 2026*