import { blueChipClassName } from "@/lib/blue-chip-styles";

type Category = "money" | "career" | "relationships" | "health" | "mindset" | "craft";

const categories: { value: Category; label: string }[] = [
  { value: "money", label: "Money" },
  { value: "career", label: "Career" },
  { value: "relationships", label: "Relationships" },
  { value: "health", label: "Health" },
  { value: "mindset", label: "Mindset" },
  { value: "craft", label: "Craft" },
];

interface Props {
  selected: Category | undefined;
  onSelect: (cat: Category | undefined) => void;
}

export default function CategoryFilterChips({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      <button
        onClick={() => onSelect(undefined)}
        className={blueChipClassName("all", !selected)}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.value}
          onClick={() => onSelect(selected === c.value ? undefined : c.value)}
          className={blueChipClassName(c.value, selected === c.value)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
