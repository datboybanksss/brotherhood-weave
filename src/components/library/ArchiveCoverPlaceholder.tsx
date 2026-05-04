import { Play, FileText, BookOpen } from "lucide-react";
import { ARCHIVE_DOMAINS, FALLBACK_DOMAIN_META, type ArchiveContentType, type ArchiveDomain } from "@/lib/archive-domains";

const ICONS = { video: Play, document: FileText, text: BookOpen };

interface Props {
  title: string;
  contentType: ArchiveContentType;
  domain: ArchiveDomain | null;
  size?: "sm" | "lg";
}

export default function ArchiveCoverPlaceholder({ title, contentType, domain, size = "sm" }: Props) {
  const meta = domain ? ARCHIVE_DOMAINS[domain] : FALLBACK_DOMAIN_META;
  const Icon = ICONS[contentType];
  const titleSize = size === "lg" ? "text-2xl" : "text-base";
  return (
    <div className={`relative w-full h-full flex flex-col justify-between p-3 ${meta.bg}`}>
      <p className={`font-bold text-foreground line-clamp-2 ${titleSize}`}>{title}</p>
      <div className="flex items-end justify-between">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          {domain ? meta.label : "Archive"}
        </span>
        <Icon className={`h-5 w-5 ${meta.ring}`} />
      </div>
    </div>
  );
}