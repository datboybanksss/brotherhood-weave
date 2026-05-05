import { Link } from "react-router-dom";
import { formatDistanceToNowStrict, format } from "date-fns";
import { CATEGORY_META, FORMAT_META } from "@/lib/event-meta";
import type { EventRow } from "@/api/events";

export default function UpcomingEventRow({ event }: { event: EventRow }) {
  const cat = CATEGORY_META[event.category]; const fmt = FORMAT_META[event.format];
  return (
    <Link to={`/events/${event.id}`} className="flex gap-3 p-3 rounded-lg hover:bg-accent border border-border">
      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
        {event.cover_url ? <img src={event.cover_url} alt="" className="w-full h-full object-cover" />
          : <div className={`w-full h-full ${cat.dot} opacity-30`} />}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-medium text-sm truncate">{event.title}</p>
        <div className="flex flex-wrap gap-1">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.badge}`}>{cat.label}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${fmt.badge}`}>{fmt.label}</span>
        </div>
        <p className="text-xs text-muted-foreground">{format(new Date(event.starts_at), "MMM d · h:mm a")} · {formatDistanceToNowStrict(new Date(event.starts_at), { addSuffix: true })}</p>
      </div>
    </Link>
  );
}
