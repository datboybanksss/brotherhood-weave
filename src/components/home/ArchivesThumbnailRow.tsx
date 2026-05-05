import { useNavigate } from "react-router-dom";
import { Play, FileText, BookOpen } from "lucide-react";
import ArchiveCoverPlaceholder from "@/components/library/ArchiveCoverPlaceholder";
import type { ArchiveCardItem } from "@/api/home-archives";
import { stopTile } from "./BentoGrid";

const ICONS = { video: Play, document: FileText, text: BookOpen };

export default function ArchivesThumbnailRow({ archives }: { archives: ArchiveCardItem[] }) {
  const navigate = useNavigate();
  if (archives.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {archives.map((a) => {
        const Icon = ICONS[a.content_type];
        return (
          <button
            key={a.id}
            onClick={(e) => { stopTile(e); navigate(`/library/archive/${a.id}`); }}
            className="relative aspect-square overflow-hidden rounded-lg border border-border/60"
          >
            {a.cover_url ? (
              <img src={a.cover_url} alt={a.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0">
                <ArchiveCoverPlaceholder title={a.title} contentType={a.content_type} domain={a.domain} />
              </div>
            )}
            <span className="absolute top-1.5 right-1.5 rounded-full bg-background/90 p-1">
              <Icon className="h-3 w-3 text-foreground" />
            </span>
          </button>
        );
      })}
    </div>
  );
}