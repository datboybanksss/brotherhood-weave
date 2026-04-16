import { CheckCircle, Circle, Lock } from "lucide-react";

interface Props {
  index: number;
  title: string;
  status: "complete" | "available" | "locked";
  onTap: () => void;
}

export default function LessonRow({ index, title, status, onTap }: Props) {
  const icons = {
    complete: <CheckCircle className="h-5 w-5 text-primary" />,
    available: <Circle className="h-5 w-5 text-muted-foreground" />,
    locked: <Lock className="h-5 w-5 text-muted-foreground" />,
  };

  return (
    <button
      onClick={status !== "locked" ? onTap : undefined}
      disabled={status === "locked"}
      className="flex items-center gap-3 w-full p-3 rounded-lg border border-border hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
    >
      {icons[status]}
      <span className="text-sm font-medium text-foreground">
        {index}. {title}
      </span>
    </button>
  );
}
