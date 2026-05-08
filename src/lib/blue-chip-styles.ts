import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type ChipTone = {
  /** Base shade for this chip. */
  hex: string;
};

// A controlled Family Ties blue spectrum: navy, royal, cobalt, azure, and pale blue.
// Text contrast is computed per shade so selected chips stay readable.
const TONES: ChipTone[] = [
  { hex: "#061A40" },
  { hex: "#1512D3" },
  { hex: "#123F96" },
  { hex: "#1F5FBF" },
  { hex: "#2F80ED" },
  { hex: "#5A96F5" },
  { hex: "#9CC0FF" },
  { hex: "#D9E6FF" },
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

function contrastText(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? "#0A0A0F" : "#FFFFFF";
}

const BASE_CHIP_CLASS =
  "shrink-0 min-h-[36px] rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal";

export function blueChipStyle(key: string, selected: boolean): CSSProperties {
  const tone = toneFor(key);
  const { r, g, b } = hexToRgb(tone.hex);
  const color = contrastText(tone.hex);
  if (selected) {
    return {
      backgroundColor: tone.hex,
      borderColor: tone.hex,
      color,
      boxShadow: `inset 0 0 0 1px rgba(${r},${g},${b},0.35)`,
    };
  }
  return {
    backgroundColor: `rgba(${r},${g},${b},0.78)`,
    borderColor: `rgba(${r},${g},${b},0.95)`,
    color,
  };
}

/**
 * Backwards-compatible helper: returns only the static class string.
 * Pair with `blueChipStyle(key, selected)` on the same element for colors.
 */
export function blueChipClassName(_key: string, _selected: boolean) {
  return cn(BASE_CHIP_CLASS, "hover:brightness-[0.98]");
}
