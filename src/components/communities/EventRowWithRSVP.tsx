import UpcomingEventRow from "./UpcomingEventRow";
import EventRSVPButtons from "@/components/events/EventRSVPButtons";
import { useMyRSVP } from "@/hooks/useMyRSVP";
import type { EventRow } from "@/api/events";

export default function EventRowWithRSVP({ event }: { event: EventRow }) {
  const { data: myRsvp } = useMyRSVP(event.id);
  return (
    <div className="space-y-2">
      <UpcomingEventRow event={event} />
      <div className="px-1">
        <EventRSVPButtons eventId={event.id} format={event.format} current={myRsvp ?? null} />
      </div>
    </div>
  );
}
