import { useRef, useState, useEffect } from "react";
import { Plus } from "lucide-react";
import EmojiIcon from "@/components/EmojiIcon";

interface Props {
  onMediaSelect: (file: File) => void;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const OPTIONS = [
  { id: "file",  label: "File",             cp: "1f4c2",    alt: "Folder" },
  { id: "media", label: "Photos & videos",  cp: "1f5bc-fe0f", alt: "Photo" },
] as const;

export default function AttachmentPicker({ onMediaSelect, onFileSelect, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setOpen(false);
    onMediaSelect(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setOpen(false);
    onFileSelect(file);
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <input ref={mediaInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
      <input ref={fileInputRef}  type="file" accept="*/*"             className="hidden" onChange={handleFileChange} />

      {/* Pop-up menu */}
      <div
        className={`absolute bottom-full left-0 mb-2 w-52 rounded-2xl bg-card border border-border shadow-xl overflow-hidden
          transition-all duration-200 ease-out origin-bottom-left z-50
          ${open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-2 pointer-events-none"}`}
      >
        {OPTIONS.map((opt, i) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              if (opt.id === "media") mediaInputRef.current?.click();
              else fileInputRef.current?.click();
            }}
            className={`flex items-center gap-3 w-full px-4 py-3.5 hover:bg-accent text-left transition-colors
              ${i < OPTIONS.length - 1 ? "border-b border-border/50" : ""}`}
          >
            <EmojiIcon cp={opt.cp} alt={opt.alt} size={24} />
            <span className="text-sm font-medium text-foreground">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="p-2 rounded-full hover:bg-accent text-muted-foreground disabled:opacity-40 transition-colors"
        aria-label={open ? "Close attachments" : "Add attachment"}
      >
        <Plus className={`h-5 w-5 transition-transform duration-200 ${open ? "rotate-45" : "rotate-0"}`} />
      </button>
    </div>
  );
}
