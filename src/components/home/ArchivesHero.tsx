import { useNavigate } from "react-router-dom";
import ArchiveCoverPlaceholder from "@/components/library/ArchiveCoverPlaceholder";
import { CONTENT_TYPE_LABEL } from "@/lib/archive-domains";
import type { ArchiveCardItem } from "@/api/home-archives";
import { stopTile } from "./BentoGrid";

export default function ArchivesHero({ archive }: { archive: ArchiveCardItem }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={(e) => { stopTile(e); navigate(`/library/archive/${archive.id}`); }}
      className="relative block w-full aspect-video overflow-hidden rounded-xl border border-border/60 group"
    >
      {archive.cover_url ? (
        <img src={archive.cover_url} alt={archive.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0">
          <ArchiveCoverPlaceholder title={archive.title} contentType={archive.content_type} domain={archive.domain} size="lg" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex items-end justify-between gap-2">
        <h3 className="text-sm font-bold text-white line-clamp-2 text-left flex-1">{archive.title}</h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-foreground shrink-0">
          {CONTENT_TYPE_LABEL[archive.content_type]}
        </span>
      </div>
    </button>
  );
}