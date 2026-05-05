import AvatarStack from "@/components/home/AvatarStack";
import { useEventAttendees } from "@/hooks/useEvent";

export default function EventAttendeesSection({ eventId }: { eventId: string }) {
  const { data } = useEventAttendees(eventId);
  if (!data) return null;
  const inPerson = data.filter((d) => d.status === "going_in_person").map((d) => d.user_id);
  const remote = data.filter((d) => d.status === "going_remote").map((d) => d.user_id);
  if (inPerson.length === 0 && remote.length === 0) return null;
  return (
    <div className="space-y-3">
      {inPerson.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Going in person ({inPerson.length})</h3>
          <AvatarStack userIds={inPerson} max={8} />
        </div>
      )}
      {remote.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Going remote ({remote.length})</h3>
          <AvatarStack userIds={remote} max={8} />
        </div>
      )}
    </div>
  );
}
