import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import Avatar from "@/components/Avatar";
import type { ForfeitRow as Row } from "@/api/fitness";

export default function ForfeitRow({ row, isCurrentUser = false }: { row: Row; isCurrentUser?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Link to={`/member/${row.user_id}`}><Avatar userId={row.user_id} size="sm" /></Link>
      <div className="flex-1 min-w-0">
        <Link to={`/member/${row.user_id}`} className="text-sm font-medium truncate hover:underline">
          {row.full_name}{isCurrentUser ? " (you)" : ""}
        </Link>
        <div className="text-xs text-muted-foreground">
          {row.last_submission_at
            ? `Last logged ${formatDistanceToNow(new Date(row.last_submission_at), { addSuffix: true })}`
            : "Never logged"}
        </div>
      </div>
    </div>
  );
}
