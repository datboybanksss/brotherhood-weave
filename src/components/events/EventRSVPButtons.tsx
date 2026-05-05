import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setRsvp, clearRsvp } from "@/api/events";
import type { EventFormat, RsvpStatus } from "@/lib/event-meta";

interface Props { eventId: string; format: EventFormat; current: RsvpStatus | null; }

export default function EventRSVPButtons({ eventId, format, current }: Props) {
  const qc = useQueryClient();
  const opts: { status: RsvpStatus; label: string }[] =
    format === "in_person" ? [{ status: "going_in_person", label: "Going" }, { status: "not_going", label: "Not going" }]
    : format === "remote" ? [{ status: "going_remote", label: "Going" }, { status: "not_going", label: "Not going" }]
    : [{ status: "going_in_person", label: "Going (in person)" }, { status: "going_remote", label: "Going (remote)" }, { status: "not_going", label: "Not going" }];

  const onClick = async (s: RsvpStatus) => {
    const action = current === s ? clearRsvp(eventId) : setRsvp(eventId, s);
    const res = await action.then(() => null).catch((e: any) => e);
    if (res) { toast.error(res.message ?? "RSVP failed"); return; }
    qc.invalidateQueries({ queryKey: ["myRsvp", eventId] });
    qc.invalidateQueries({ queryKey: ["eventRsvpSummary", eventId] });
    qc.invalidateQueries({ queryKey: ["eventAttendees", eventId] });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => (
        <Button key={o.status} variant={current === o.status ? "default" : "outline"} size="sm" onClick={() => onClick(o.status)}>
          {o.label}
        </Button>
      ))}
    </div>
  );
}
