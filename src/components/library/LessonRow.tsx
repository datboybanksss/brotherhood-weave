import { Circle } from "lucide-react";
import { format } from "date-fns";
import EmojiIcon from "@/components/EmojiIcon";

interface Props {
  index: number;
  title: string;
  status: "complete" | "available" | "locked" | "scheduled";
  releaseDate?: string | null;
  onTap: () => void;
}

export default function LessonRow({ index, title, status, releaseDate, onTap }: Props) {
  const icon = {
    complete:  <EmojiIcon cp="2705"      alt="Complete"   size={20} />,
    available: <Circle className="h-5 w-5 text-muted-foreground" />,
    locked:    <EmojiIcon cp="1f512"     alt="Locked"     size={20} />,
    scheduled: <EmojiIcon cp="23f0"      alt="Scheduled"  size={20} />,
  }[status];

  const disabled = status === "locked" || status === "scheduled";

  return (
    <button
      onClick={!disabled ? onTap : undefined}
      disabled={disabled}
      className="flex items-center gap-3 w-full p-3 rounded-lg border border-border hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
    >
      {icon}
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{index}. {title}</div>
        {status === "scheduled" && releaseDate && (
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            Unlocking {format(new Date(releaseDate), "MMM d, yyyy")}
          </div>
        )}
      </div>
    </button>
  );
}
