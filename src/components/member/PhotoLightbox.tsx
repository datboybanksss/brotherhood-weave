import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ProfilePhoto } from "@/api/profile-photos";

interface Props {
  photos: ProfilePhoto[];
  startIndex: number;
  onClose: () => void;
}

export default function PhotoLightbox({ photos, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(photos.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length, onClose]);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-muted text-foreground"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={photo.url}
        alt=""
        className="max-h-[90vh] max-w-[95vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {index > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIndex(index - 1); }}
          className="absolute left-4 p-2 rounded-full bg-muted text-foreground"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {index < photos.length - 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIndex(index + 1); }}
          className="absolute right-4 p-2 rounded-full bg-muted text-foreground"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}