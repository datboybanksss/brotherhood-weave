import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical } from "lucide-react";
import type { ProfilePhoto } from "@/api/profile-photos";

interface Props { photo: ProfilePhoto; onDelete: () => void }

export default function PhotoTile({ photo, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative h-28 w-28 shrink-0 rounded-lg overflow-hidden border border-border bg-muted"
    >
      <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 bg-background/80 rounded p-0.5 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-1 right-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground rounded p-0.5"
        aria-label="Delete photo"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}