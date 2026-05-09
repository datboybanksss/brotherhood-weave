import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ArchiveCoverPlaceholder from "@/components/library/ArchiveCoverPlaceholder";
import { CONTENT_TYPE_LABEL } from "@/lib/archive-domains";
import type { ArchiveCardItem } from "@/api/home-archives";
import { stopTile } from "./BentoGrid";

const positionStyles = [
  { scale: 1, y: 12 },
  { scale: 0.95, y: -16 },
  { scale: 0.9, y: -44 },
];

const exitAnimation = { y: 340, scale: 1, zIndex: 10 };
const enterAnimation = { y: -16, scale: 0.9 };

function CardFace({ archive, onClick }: { archive: ArchiveCardItem; onClick: (e: any) => void }) {
  return (
    <button
      onClick={onClick}
      className="relative block w-full aspect-video overflow-hidden rounded-xl border border-border/60 bg-card shadow-md"
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
