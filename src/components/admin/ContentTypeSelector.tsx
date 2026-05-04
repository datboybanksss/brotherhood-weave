import { Video, FileText, PenLine } from "lucide-react";
import type { ArchiveContentType } from "@/lib/archive-domains";

const TYPES: { value: ArchiveContentType; label: string; sub: string; icon: typeof Video }[] = [
  { value: "video", label: "Video", sub: "YouTube or Vimeo link", icon: Video },
  { value: "document", label: "Document", sub: "PDF or Word file", icon: FileText },
  { value: "text", label: "Article", sub: "Write in markdown", icon: PenLine },
];

interface Props {
  value: ArchiveContentType;
  onChange: (v: ArchiveContentType) => void;
  disabled?: boolean;
}

export default function ContentTypeSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TYPES.map((t) => {
        const Icon = t.icon;
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(t.value)}
            className={`p-3 rounded-lg border text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              active ? "border-primary bg-primary/5" : "border-border hover:bg-accent/30"
            }`}
          >
            <Icon className={`h-5 w-5 mb-1 ${active ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-xs font-semibold text-foreground">{t.label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{t.sub}</p>
          </button>
        );
      })}
    </div>
  );
}