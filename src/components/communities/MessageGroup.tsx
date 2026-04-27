import MessageBubble from "./MessageBubble";
import type { OptimisticMessage } from "@/hooks/useChannelMessages";
import type { ReactionRow } from "@/api/reactions";

interface Props {
  messages: OptimisticMessage[];
  reactions: ReactionRow[];
  currentUserId: string;
  isAdmin: boolean;
}

export default function MessageGroup({ messages, reactions, currentUserId, isAdmin }: Props) {
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
        />
      ))}
    </div>
  );
}