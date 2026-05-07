import MessageBubble from "./MessageBubble";
import type { OptimisticMessage } from "@/hooks/useChannelMessages";
import type { ReactionRow } from "@/api/reactions";
import type { MessageRow } from "@/api/messages";

interface Props {
  messages: OptimisticMessage[];
  reactions: ReactionRow[];
  currentUserId: string;
  isAdmin: boolean;
  onReply: (message: MessageRow) => void;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onSaveEditMessage?: (messageId: string, body: string) => Promise<void>;
}

export default function MessageGroup({ messages, reactions, currentUserId, isAdmin, onReply, onDeleteMessage, onSaveEditMessage }: Props) {
  return (
    <div className="py-1">
      {messages.map((m, i) => (
        <MessageBubble
          key={m.id}
          message={m}
          showHeader={i === 0}
          reactions={reactions.filter((r) => r.message_id === m.id)}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onReply={onReply}
          onDeleteOverride={onDeleteMessage ? () => onDeleteMessage(m.id) : undefined}
          onSaveEditOverride={onSaveEditMessage ? (body) => onSaveEditMessage(m.id, body) : undefined}
        />
      ))}
    </div>
  );
}
