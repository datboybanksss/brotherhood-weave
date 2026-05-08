import { cn } from "@/lib/utils";

type ChipTone = {
  /** Base shade for this chip. */
  hex: string;
};

// Shades derived from the provided stacked-blue palette (dark → light).
// We use these as the *selected* (solid) color; unselected uses a tint.
const TONES: ChipTone[] = [
  { hex: "#022859" },
  { hex: "#023E8A" },
  { hex: "#0353A4" },
  { hex: "#0466C8" },
  { hex: "#0B72E9" },
  { hex: "#5A96F5" },
  { hex: "#9CC0FF" },
];

function hexToRgb(hex: string) {
  const h = hex.replace("#", "").trim();
  const v = parseInt(h, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function hashKey(key: string) {
  // Simple deterministic hash (djb2) for stable color assignment.
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = (h * 33) ^ key.charCodeAt(i);
  return Math.abs(h);
}

function toneFor(key: string) {
  return TONES[hashKey(key) % TONES.length];
}

export function blueChipClassName(key: string, selected: boolean) {
  const tone = toneFor(key);
  const rgb = hexToRgb(tone.hex);

  const base =
    "shrink-0 min-h-[36px] rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal";

  if (selected) {
    return cn(base, `bg-[${tone.hex}]`, `border-[${tone.hex}]`, "text-white");
  }

  // Unselected: subtle tint background with same-hue text for cohesion.
  const bg = `bg-[rgba(${rgb.r},${rgb.g},${rgb.b},0.14)]`;
  const border = `border-[rgba(${rgb.r},${rgb.g},${rgb.b},0.22)]`;
  const text = `text-[${tone.hex}]`;
  return cn(base, bg, border, text, "hover:brightness-[0.98]");
}

