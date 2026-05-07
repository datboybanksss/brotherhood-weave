import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/hooks/useAuth";
import type { ConversationSummary } from "@/api/direct-messages";

export default function ConversationRow({ conv }: { conv: ConversationSummary }) {
  const { user } = useAuth();
  const hasUnread = conv.unread_count > 0;
  const last = conv.last_message;

  let preview = "";
  if (last) {
    const isMe = last.sender_id === user?.id;
    const text = last.body ?? (last.attachment_url ? "📎 Image" : "");
    preview = isMe ? `You: ${text}` : text;
  }

  return (
    <Link to={`/messages/${conv.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors">
      <div className="relative shrink-0">
        {hasUnread && (
          <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
        )}
        <Avatar userId={conv.other_user.id} size="md" showStatus />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`text-sm truncate ${hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
            {conv.other_user.full_name}
          </p>
          {last && (
            <p className="text-[10px] text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(last.created_at), { addSuffix: false })}
            </p>
          )}
        </div>
        <p className={`text-xs truncate mt-0.5 ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          {preview || "No messages yet"}
        </p>
      </div>
    </Link>
  );
}
