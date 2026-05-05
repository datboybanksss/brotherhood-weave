import { useState } from "react";
import { Button } from "@/components/ui/button";
import UpcomingEventRow from "./UpcomingEventRow";
import { useUpcomingEvents } from "@/hooks/useUpcomingEvents";

export default function UpcomingEventsList() {
  const { data, isLoading } = useUpcomingEvents(20);
  const [showAll, setShowAll] = useState(false);
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const events = data ?? [];
  if (events.length === 0) return <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>;
  const visible = showAll ? events : events.slice(0, 5);
  return (
    <div className="space-y-2">
      {visible.map((e) => <UpcomingEventRow key={e.id} event={e} />)}
      {events.length > 5 && !showAll && (
        <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAll(true)}>View all upcoming ({events.length})</Button>
      )}
    </div>
  );
}
