import type { ReactionRow } from "@/api/reactions";

interface Props {
  reactions: ReactionRow[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
}

export default function MessageReactions({ reactions, currentUserId, onToggle }: Props) {
  if (reactions.length === 0) return null;
  const grouped = reactions.reduce<Record<string, { count: number; mine: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
    acc[r.emoji].count += 1;
    if (r.user_id === currentUserId) acc[r.emoji].mine = true;
    return acc;
  }, {});
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(grouped).map(([emoji, { count, mine }]) => (
        <button
          key={emoji}
          onClick={() => onToggle(emoji)}
          className={`text-xs px-2 py-0.5 rounded-full border ${mine ? "bg-primary/10 border-primary" : "bg-muted border-border"}`}
        >
          {emoji} {count}
        </button>
      ))}
    </div>
  );
}