import { useConversations } from "@/hooks/useConversations";
import ConversationRow from "./ConversationRow";
import EmojiIcon from "@/components/EmojiIcon";

export default function ConversationList() {
  const { data: conversations, isLoading } = useConversations();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-4">Loading…</p>;
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-3">
        <EmojiIcon cp="1f4ac" alt="Chat" size={40} className="opacity-30" />
        <p className="text-sm font-medium text-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Visit a member's profile to start a private conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border pb-10">
      {conversations.map((conv) => (
        <ConversationRow key={conv.id} conv={conv} />
      ))}
    </div>
  );
}
