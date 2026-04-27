import { format } from "date-fns";

export default function DaySeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4 px-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">{format(new Date(date), "MMMM d, yyyy")}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}