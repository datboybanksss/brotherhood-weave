import type { ArchiveContentType } from "@/lib/archive-domains";

const TYPES: { value: ArchiveContentType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "video", label: "Video" },
  { value: "document", label: "Documents" },
  { value: "text", label: "Articles" },
];

interface Props {
  value: ArchiveContentType | "all";
  onChange: (v: ArchiveContentType | "all") => void;
}

export default function ArchiveTypeFilter({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
      {TYPES.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            value === t.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}