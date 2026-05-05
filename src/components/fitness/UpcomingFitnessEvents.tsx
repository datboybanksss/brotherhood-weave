import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatDistanceToNowStrict } from "date-fns";
import { useUpcomingFitnessEvents } from "@/hooks/useUpcomingEvents";
import { FORMAT_META } from "@/lib/event-meta";

export default function UpcomingFitnessEvents() {
  const { data } = useUpcomingFitnessEvents(3);
  const events = data ?? [];
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Upcoming fitness events</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {events.length === 0 && <p className="text-sm text-muted-foreground">No fitness events scheduled. Stay ready.</p>}
        {events.map((e) => (
          <Link key={e.id} to={`/events/${e.id}`} className="flex gap-3 p-2 rounded-md hover:bg-accent">
            <div className="w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
              {e.cover_url && <img src={e.cover_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{e.title}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${FORMAT_META[e.format].badge}`}>{FORMAT_META[e.format].label}</span>
              <p className="text-xs text-muted-foreground">{format(new Date(e.starts_at), "MMM d · h:mm a")} · {formatDistanceToNowStrict(new Date(e.starts_at), { addSuffix: true })}</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
