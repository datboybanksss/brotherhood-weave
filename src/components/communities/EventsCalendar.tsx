import { useMemo, useState } from "react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, isSameDay, getDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEventsForMonth } from "@/hooks/useEventsForMonth";
import { CATEGORY_META } from "@/lib/event-meta";
import UpcomingEventRow from "./UpcomingEventRow";

export default function EventsCalendar() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const { data: events } = useEventsForMonth(cursor);
  const days = useMemo(() => eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) }), [cursor]);
  const leadingBlanks = (getDay(startOfMonth(cursor)) + 6) % 7; // Mon=0
  const eventsByDay = (events ?? []).reduce((acc, e) => {
    const k = new Date(e.starts_at).toDateString();
    (acc[k] ??= []).push(e); return acc;
  }, {} as Record<string, typeof events>);
  const dayEvents = selectedDay ? eventsByDay[selectedDay.toDateString()] ?? [] : [];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, -1))}><ChevronLeft className="w-4 h-4" /></Button>
        <div className="font-semibold text-sm">{format(cursor, "MMMM yyyy")}</div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>Today</Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground text-center">
        {["M","T","W","T","F","S","S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b${i}`} />)}
        {days.map((d) => {
          const evs = eventsByDay[d.toDateString()] ?? [];
          const isToday = isSameDay(d, new Date());
          return (
            <button key={d.toISOString()} onClick={() => evs.length && setSelectedDay(d)}
              className={`aspect-square rounded-md text-xs flex flex-col items-center justify-center gap-0.5 ${isToday ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-accent"}`}>
              <span>{format(d, "d")}</span>
              <div className="flex gap-0.5">{evs.slice(0, 3).map((e, i) => <span key={i} className={`w-1 h-1 rounded-full ${CATEGORY_META[e.category].dot}`} />)}</div>
            </button>
          );
        })}
      </div>
      <Sheet open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <SheetContent side="bottom"><SheetHeader><SheetTitle>{selectedDay && format(selectedDay, "EEEE MMM d")}</SheetTitle></SheetHeader>
          <div className="space-y-2 mt-3">{dayEvents.map((e) => <UpcomingEventRow key={e.id} event={e} />)}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
