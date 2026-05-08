import { cn } from "@/lib/utils";

type ChipTone = {
  /** Light tint background for unselected state. */
  bg: string;
  /** Medium border for unselected state. */
  border: string;
  /** Dark ink for text/icons (also used as selected background). */
  ink: string;
};

// Blue-forward tones inspired by the provided Pantone palette.
// We keep these as Tailwind arbitrary values so they render consistently.
const TONES: ChipTone[] = [
  // Baby Blue (Pantone 13-4308 TCX) + darker ink
  { bg: "bg-[#B5C7D3]", border: "border-[#8AA1B3]", ink: "text-[#1F3E56]" },
  // Sky Blue (Pantone 14-4318 TCX) + darker ink
  { bg: "bg-[#8ABAD3]", border: "border-[#5E93B0]", ink: "text-[#123E58]" },
  // Dawn Blue (Pantone 13-4303 TCX) + darker ink
  { bg: "bg-[#CACCCB]", border: "border-[#A9AEAE]", ink: "text-[#1D3B52]" },
  // Classic Blue (Pantone 19-4052 TCX) — used as a deeper option
  { bg: "bg-[#D9E7F3]", border: "border-[#94B7D4]", ink: "text-[#0F4C81]" },
  // Additional complementary blues to round out the set
  { bg: "bg-[#D7F0FA]", border: "border-[#86CBE6]", ink: "text-[#0B4A6B]" },
  { bg: "bg-[#E3E9FF]", border: "border-[#A6B4F0]", ink: "text-[#273C9C]" },
];

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

  const base =
    "shrink-0 min-h-[36px] rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal";

  if (selected) {
    // Selected uses the "ink" as a strong background; always white text for contrast.
    // We derive the selected bg by swapping `text-*` to `bg-*` with the same hex.
    const selectedBg = tone.ink.replace(/^text-\[/, "bg-[");
    const selectedBorder = tone.ink.replace(/^text-\[/, "border-[");
    return cn(base, selectedBg, selectedBorder, "text-white");
  }

  return cn(base, tone.bg, tone.border, tone.ink, "hover:brightness-[0.98]");
}

