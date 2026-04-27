import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Smile, Pencil, Trash2, Copy } from "lucide-react";
import EmojiPicker from "./EmojiPicker";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  canEdit: boolean;
  canDelete: boolean;
  onReact: (emoji: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}

export default function MessageActionSheet(p: Props) {
  const [showEmoji, setShowEmoji] = useState(false);
  return (
    <Sheet open={p.open} onOpenChange={(o) => { if (!o) setShowEmoji(false); p.onOpenChange(o); }}>
      <SheetContent side="bottom" className="space-y-1">
        {showEmoji ? (
          <EmojiPicker onPick={(e) => { p.onReact(e); p.onOpenChange(false); }} />
        ) : (
          <>
            <button onClick={() => setShowEmoji(true)} className="flex items-center gap-2 w-full p-3 hover:bg-accent rounded">
              <Smile className="h-4 w-4" /> Add reaction
            </button>
            {p.canEdit && (
              <button onClick={() => { p.onEdit(); p.onOpenChange(false); }} className="flex items-center gap-2 w-full p-3 hover:bg-accent rounded">
                <Pencil className="h-4 w-4" /> Edit
              </button>
            )}
            {p.canDelete && (
              <button onClick={() => { p.onDelete(); p.onOpenChange(false); }} className="flex items-center gap-2 w-full p-3 hover:bg-accent rounded text-destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
            <button onClick={() => { p.onCopy(); p.onOpenChange(false); }} className="flex items-center gap-2 w-full p-3 hover:bg-accent rounded">
              <Copy className="h-4 w-4" /> Copy text
            </button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}