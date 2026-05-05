import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Globe, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import EventHero from "@/components/events/EventHero";
import EventRSVPButtons from "@/components/events/EventRSVPButtons";
import EventAttendeesSection from "@/components/events/EventAttendeesSection";
import EventActivitySection from "@/components/events/EventActivitySection";
import EventRecapSection from "@/components/events/EventRecapSection";
import { useEvent, useEventRsvpSummary } from "@/hooks/useEvent";
import { useMyRSVP } from "@/hooks/useMyRSVP";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { data: event } = useEvent(id);
  const { data: summary } = useEventRsvpSummary(id);
  const { data: myRsvp } = useMyRSVP(id);
  if (!event) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  const isPast = new Date(event.starts_at) < new Date();
  const LocIcon = event.format === "in_person" ? MapPin : event.format === "remote" ? Globe : Users;
  const summaryLine = summary
    ? [
        event.format !== "remote" && `${summary.going_in_person} going in person`,
        event.format !== "in_person" && `${summary.going_remote} remote`,
        `${summary.not_going} declined`,
      ].filter(Boolean).join(" · ")
    : "";

  return (
    <div className="p-4 space-y-5">
      <Button variant="ghost" size="sm" onClick={() => nav(-1)} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <EventHero event={event} />
      <div className="space-y-2">
        <h1 className="text-xl font-bold">{event.title}</h1>
        <div className="text-sm text-muted-foreground">{format(new Date(event.starts_at), "EEEE MMM d, yyyy · h:mm a")}</div>
        {event.location && <div className="text-sm flex items-center gap-1.5"><LocIcon className="w-4 h-4 text-muted-foreground" />{event.location}</div>}
      </div>
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">{summaryLine}</div>
        <EventRSVPButtons eventId={event.id} format={event.format} current={myRsvp ?? null} />
      </div>
      {event.description && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.description}</ReactMarkdown>
        </div>
      )}
      <EventAttendeesSection eventId={event.id} />
      {isPast && event.category === "fitness" && <EventActivitySection eventId={event.id} dateISO={event.starts_at} />}
      {isPast && <EventRecapSection eventId={event.id} />}
    </div>
  );
}
