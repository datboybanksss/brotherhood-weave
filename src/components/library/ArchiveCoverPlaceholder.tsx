import { ARCHIVE_DOMAINS, FALLBACK_DOMAIN_META, type ArchiveContentType, type ArchiveDomain } from "@/lib/archive-domains";
import EmojiIcon from "@/components/EmojiIcon";

const TYPE_EMOJI = {
  video:    { cp: "1f3ac", alt: "Clapper" },
  document: { cp: "1f4c4", alt: "Document" },
  text:     { cp: "1f4d6", alt: "Book" },
} as const;

interface Props {
  title: string;
  contentType: ArchiveContentType;
  domain: ArchiveDomain | null;
  size?: "sm" | "lg";
}

export default function ArchiveCoverPlaceholder({ title, contentType, domain, size = "sm" }: Props) {
  const meta = domain ? ARCHIVE_DOMAINS[domain] : FALLBACK_DOMAIN_META;
  const emoji = TYPE_EMOJI[contentType];
  const titleSize = size === "lg" ? "text-2xl" : "text-base";
  return (
    <div className={`relative w-full h-full flex flex-col justify-between p-3 ${meta.bg}`}>
      <p className={`font-bold text-foreground line-clamp-2 ${titleSize}`}>{title}</p>
      <div className="flex items-end justify-between">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          {domain ? meta.label : "Archive"}
        </span>
        <EmojiIcon cp={emoji.cp} alt={emoji.alt} size={20} />
      </div>
    </div>
  );
}
