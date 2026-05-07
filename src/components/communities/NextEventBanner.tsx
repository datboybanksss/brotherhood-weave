import { Link } from "react-router-dom";
import { format } from "date-fns";
import { MapPin, Globe, Calendar } from "lucide-react";
import { useUpcomingEvents } from "@/hooks/useUpcomingEvents";
import { useMyRSVP } from "@/hooks/useMyRSVP";
import EventRSVPButtons from "@/components/events/EventRSVPButtons";
import { CATEGORY_META } from "@/lib/event-meta";

export default function NextEventBanner() {
  const { data: events } = useUpcomingEvents(1);
  const event = events?.[0];
  const { data: myRsvp } = useMyRSVP(event?.id);

  if (!event) return null;

  const cat = CATEGORY_META[event.category];
  const LocIcon = event.format === "in_person" ? MapPin : event.format === "remote" ? Globe : Calendar;

  return (
    <div className="relative rounded-2xl overflow-hidden min-h-[190px] border border-stroke-hairline">
      {event.cover_url ? (
        <img src={event.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className={`absolute inset-0 opacity-20 ${cat.dot}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="relative flex flex-col justify-end min-h-[190px] p-4 space-y-2">
        <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.badge}`}>
          {cat.label}
        </span>
        <Link to={`/events/${event.id}`}>
          <h3 className="text-white font-bold text-lg leading-tight">{event.title}</h3>
        </Link>
        <div className="flex items-center gap-3 text-white/70 text-xs">
          <span>{format(new Date(event.starts_at), "EEE MMM d · h:mm a")}</span>
          {event.location && (
            <span className="flex items-center gap-1">
              <LocIcon className="h-3 w-3" />{event.location}
            </span>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <EventRSVPButtons eventId={event.id} format={event.format} current={myRsvp ?? null} />
        </div>
      </div>
    </div>
  );
}
