import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRecentArchives } from "@/hooks/useRecentArchives";
import AnimatedArchivesStack from "./AnimatedArchivesStack";
import { stopTile } from "./BentoGrid";
import archivesIcon from "@/assets/archives-icon.png";
import EmojiIcon from "@/components/EmojiIcon";

export default function ArchivesCard() {
  const navigate = useNavigate();
  const { archives, isLoading } = useRecentArchives();
  const goAll = (e: { stopPropagation: () => void }) => { stopTile(e); navigate("/library?layer=archives"); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <img src={archivesIcon} alt="" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" /> Archives
        </div>
        <button onClick={goAll} className="text-xs text-primary">View all</button>
      </div>
      {isLoading ? (
        <div className="aspect-video rounded-xl bg-muted animate-pulse" />
      ) : archives.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-2 py-6">
          <EmojiIcon cp="1f4da" alt="Books" size={32} className="opacity-50" />
          <h3 className="text-sm font-semibold text-foreground">The Archives are coming</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Videos, documents, and writing curated by the founders. Drop in soon.
          </p>
          <Button size="sm" variant="outline" onClick={goAll} className="mt-1">Browse Archives</Button>
        </div>
      ) : (
        <div className="pt-3 pb-12">
          <AnimatedArchivesStack archives={archives} />
        </div>
      )}
    </div>
  );
}
