import UpcomingEventsList from "./UpcomingEventsList";
import EventsCalendar from "./EventsCalendar";

export default function EventsLayer() {
  return (
    <div className="space-y-6 p-4">
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Upcoming</h2>
        <UpcomingEventsList />
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Calendar</h2>
        <EventsCalendar />
      </section>
    </div>
  );
}
