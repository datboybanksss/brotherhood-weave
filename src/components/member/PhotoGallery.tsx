import { useState } from "react";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import PhotoLightbox from "./PhotoLightbox";

export default function PhotoGallery({ userId }: { userId: string }) {
  const { data: photos = [] } = useProfilePhotos(userId);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground">Photos</h2>
      <div className="flex gap-2 overflow-x-auto -mx-6 px-6 pb-1">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="h-28 w-28 shrink-0 rounded-lg overflow-hidden border border-border bg-muted"
          >
            <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
      {openIndex !== null && (
        <PhotoLightbox
          photos={photos}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  );
}