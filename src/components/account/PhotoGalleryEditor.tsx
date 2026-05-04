import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { addProfilePhoto, deleteProfilePhoto, reorderProfilePhotos, type ProfilePhoto } from "@/api/profile-photos";
import PhotoTile from "./PhotoTile";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PhotoGalleryEditor({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data: photos = [] } = useProfilePhotos(userId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingDelete, setPendingDelete] = useState<ProfilePhoto | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const addMut = useMutation({
    mutationFn: (file: File) => addProfilePhoto(userId, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profilePhotos", userId] }); toast.success("Photo added"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (p: ProfilePhoto) => deleteProfilePhoto(p, photos),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profilePhotos", userId] }); toast.success("Photo removed"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const reorderMut = useMutation({
    mutationFn: reorderProfilePhotos,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profilePhotos", userId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = photos.findIndex((p) => p.id === active.id);
    const newIdx = photos.findIndex((p) => p.id === over.id);
    const next = arrayMove(photos, oldIdx, newIdx);
    qc.setQueryData(["profilePhotos", userId], next.map((p, i) => ({ ...p, display_order: i })));
    reorderMut.mutate(next.map((p) => p.id));
  };

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">My Photos</h2>
        <p className="text-xs text-muted-foreground">Up to 5 photos. Drag to reorder. Tap × to remove.</p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={photos.map((p) => p.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((p) => (
              <PhotoTile key={p.id} photo={p} onDelete={() => setPendingDelete(p)} />
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={addMut.isPending}
                className="h-28 w-28 shrink-0 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs mt-1">{addMut.isPending ? "Uploading…" : "Add photo"}</span>
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) addMut.mutate(f);
          e.target.value = "";
        }}
      />
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingDelete) delMut.mutate(pendingDelete); setPendingDelete(null); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}