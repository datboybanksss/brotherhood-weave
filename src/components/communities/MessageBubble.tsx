import { useState } from "react";
import { format } from "date-fns";
import Avatar from "@/components/Avatar";
import MessageReactions from "./MessageReactions";
import MessageActionSheet from "./MessageActionSheet";
import { toast } from "sonner";
import { editMessage, softDeleteMessage } from "@/api/messages";
import { toggleReaction, ReactionRow } from "@/api/reactions";
import type { OptimisticMessage } from "@/hooks/useChannelMessages";

interface Props {
  message: OptimisticMessage;
  showHeader: boolean;
  reactions: ReactionRow[];
  currentUserId: string;
  isAdmin: boolean;
}

export default function MessageBubble({ message, showHeader, reactions, currentUserId, isAdmin }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const isOwn = message.sender_id === currentUserId;
  const isDeleted = !!message.deleted_at;
  const within15 = Date.now() - new Date(message.created_at).getTime() < 15 * 60_000;
  const deletedByAdmin = isDeleted && message.deleted_by && message.deleted_by !== message.sender_id;

  const senderName = (message as any).sender?.full_name ?? "Member";

  const handleSaveEdit = async () => {
    if (draft.trim() === "" || draft === message.body) { setEditing(false); return; }
    const { error } = await (async () => { try { await editMessage(message.id, draft); return { error: null }; } catch (e) { return { error: e as Error }; } })();
    if (error) toast.error(error.message); else setEditing(false);
  };

  return (
    <div className="px-4 py-0.5 group" onContextMenu={(e) => { e.preventDefault(); setSheetOpen(true); }}>
      {showHeader && (
        <div className="flex items-center gap-2 mt-2">
          <Avatar userId={message.sender_id} size="sm" />
          <span className="font-semibold text-sm">{senderName}</span>
          <span className="text-xs text-muted-foreground">{format(new Date(message.created_at), "h:mm a")}</span>
          {message.edited_at && <span className="text-xs text-muted-foreground">(edited)</span>}
        </div>
      )}
      <div className="pl-10">
        {isDeleted ? (
          <p className="italic text-sm text-muted-foreground">[deleted]{deletedByAdmin && <span className="ml-1">by admin</span>}</p>
        ) : editing ? (
          <div className="flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1 bg-background border border-input rounded px-2 py-1 text-sm" />
            <button onClick={handleSaveEdit} className="text-xs text-primary">Save</button>
            <button onClick={() => { setEditing(false); setDraft(message.body); }} className="text-xs text-muted-foreground">Cancel</button>
          </div>
        ) : (
          <p
            className={`text-sm whitespace-pre-wrap break-words cursor-pointer ${message.status === "sending" ? "opacity-60" : ""} ${message.status === "failed" ? "text-destructive" : "text-foreground"}`}
            onClick={() => !isDeleted && setSheetOpen(true)}
          >
            {message.body}
          </p>
        )}
        {!isDeleted && <MessageReactions reactions={reactions} currentUserId={currentUserId} onToggle={(e) => toggleReaction(message.id, currentUserId, e)} />}
      </div>
      <MessageActionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        canEdit={isOwn && within15 && !isDeleted}
        canDelete={(isOwn || isAdmin) && !isDeleted}
        onReact={(e) => toggleReaction(message.id, currentUserId, e)}
        onEdit={() => setEditing(true)}
        onDelete={async () => { try { await softDeleteMessage(message.id); } catch (e: any) { toast.error(e.message); } }}
        onCopy={() => { navigator.clipboard.writeText(message.body); toast.success("Copied"); }}
      />
    </div>
  );
}