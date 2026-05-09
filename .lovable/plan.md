## Change

Make the "Log" button in `FitnessHero` use the brand royal blue instead of the default near-black primary.

## Implementation

In `src/components/fitness/FitnessHero.tsx` (line ~93), add brand color classes to the `Button`:

```tsx
<Button
  size="sm"
  className="h-8 px-3 gap-1.5 shrink-0 bg-brand-royal text-text-inverse hover:bg-brand-royal-deep"
>
  <Plus className="h-4 w-4" />
  Log
</Button>
```

Uses existing design tokens (`brand-royal`, `brand-royal-deep`, `text-inverse`) from `tailwind.config.ts` — no new colors introduced.

## Tip

For small color/text tweaks like this, **Visual Edits** lets you click the element and recolor it instantly for free.
