import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ArchiveCoverPlaceholder from "@/components/library/ArchiveCoverPlaceholder";
import { CONTENT_TYPE_LABEL } from "@/lib/archive-domains";
import type { ArchiveCardItem } from "@/api/home-archives";
import { stopTile } from "./BentoGrid";
import { ChevronRight } from "lucide-react";

const positionStyles = [
  { scale: 1, y: 12 },
  { scale: 0.95, y: -16 },
  { scale: 0.9, y: -44 },
];

const exitAnimation = { y: 340, scale: 1, zIndex: 10 };
const enterAnimation = { y: -16, scale: 0.9 };

function CardFace({ archive, onClick }: { archive: ArchiveCardItem; onClick: (e: any) => void }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg">
      <div className="relative w-full aspect-video overflow-hidden">
        {archive.cover_url ? (
          <img src={archive.cover_url} alt={archive.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0">
            <ArchiveCoverPlaceholder title={archive.title} contentType={archive.content_type} domain={archive.domain} size="lg" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-card">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-foreground truncate uppercase tracking-tight">{archive.title}</h3>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground truncate">{CONTENT_TYPE_LABEL[archive.content_type]}</p>
        </div>
        <button
          onClick={onClick}
          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-foreground text-background pl-4 pr-3 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Read <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function AnimatedArchivesStack({ archives }: { archives: ArchiveCardItem[] }) {
  const navigate = useNavigate();
  const [order, setOrder] = useState(archives);

  useEffect(() => { setOrder(archives); }, [archives]);

  useEffect(() => {
    if (order.length < 2) return;
    const t = setInterval(() => {
      setOrder((prev) => [...prev.slice(1), prev[0]]);
    }, 3000);
    return () => clearInterval(t);
  }, [order.length]);

  const visible = order.slice(0, 3);

  return (
    <div className="relative w-full aspect-video">
      <AnimatePresence initial={false}>
        {visible.map((archive, index) => {
          const { scale, y } = positionStyles[index] ?? positionStyles[2];
          const zIndex = 3 - index;
          return (
            <motion.div
              key={archive.id}
              className="absolute inset-0"
              style={{ zIndex }}
              initial={index === visible.length - 1 ? enterAnimation : false}
              animate={{ scale, y }}
              exit={exitAnimation}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            >
              <CardFace
                archive={archive}
                onClick={(e) => { stopTile(e); navigate(`/library/archive/${archive.id}`); }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
