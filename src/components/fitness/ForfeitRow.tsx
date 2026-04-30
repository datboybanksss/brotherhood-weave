import { formatDistanceToNow } from "date-fns";
import Avatar from "@/components/Avatar";
import type { ForfeitRow as Row } from "@/api/fitness";

export default function ForfeitRow({ row }: { row: Row }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar userId={row.user_id} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{row.full_name}</div>
        <div className="text-xs text-muted-foreground">
          {row.last_submission_at
            ? `Last logged ${formatDistanceToNow(new Date(row.last_submission_at), { addSuffix: true })}`
            : "Never logged"}
        </div>
      </div>
    </div>
  );
}
