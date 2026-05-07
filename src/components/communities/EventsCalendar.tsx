import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, isSameDay, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEventsForMonth } from "@/hooks/useEventsForMonth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CATEGORY_META } from "@/lib/event-meta";
import UpcomingEventRow from "./UpcomingEventRow";

export default function EventsCalendar() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const { data: events } = useEventsForMonth(cursor);
  const { data: appUser } = useCurrentUser();
  const nav = useNavigate();

  const days = useMemo(() => eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) }), [cursor]);
  const leadingBlanks = (getDay(startOfMonth(cursor)) + 6) % 7; // Mon=0

  const eventsByDay = (events ?? []).reduce((acc, e) => {
    const k = new Date(e.starts_at).toDateString();
    (acc[k] ??= []).push(e);
    return acc;
  }, {} as Record<string, typeof events>);

  const dayEvents = selectedDay ? (eventsByDay[selectedDay.toDateString()] ?? []) : [];
  const isAdmin = appUser?.is_admin ?? false;

  const handleDayClick = (d: Date) => {
    const hasEvents = (eventsByDay[d.toDateString()] ?? []).length > 0;
    if (isAdmin || hasEvents) setSelectedDay(d);
  };

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, -1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold text-sm">{format(cursor, "MMMM yyyy")}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setCursor(startOfMonth(new Date()))}>Today</Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-[10px] text-muted-foreground text-center font-medium">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d, i) => (
          <div key={i} className="py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`b${i}`} className="bg-card aspect-square" />
        ))}
        {days.map((d) => {
          const evs = eventsByDay[d.toDateString()] ?? [];
          const isToday = isSameDay(d, new Date());
          const isSelected = selectedDay ? isSameDay(d, selectedDay) : false;
          const clickable = isAdmin || evs.length > 0;

          return (
            <button
              key={d.toISOString()}
              onClick={() => handleDayClick(d)}
              disabled={!clickable}
              className={`bg-card aspect-square flex flex-col items-center justify-center gap-0.5 transition-colors disabled:opacity-40 ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                  ? "bg-primary/10 text-primary font-bold"
                  : clickable
                  ? "hover:bg-accent"
                  : ""
              }`}
            >
              <span className="text-xs leading-none">{format(d, "d")}</span>
              {evs.length > 0 && (
                <div className="flex gap-px">
                  {evs.slice(0, 3).map((e, i) => (
                    <span key={i} className={`w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground/70" : CATEGORY_META[e.category].dot}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day sheet */}
      <Sheet open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <SheetContent side="bottom" className="max-h-[72vh] flex flex-col">
          <SheetHeader className="flex flex-row items-center justify-between pr-8 pb-2 border-b border-border">
            <SheetTitle className="text-base">
              {selectedDay && format(selectedDay, "EEEE, MMMM d")}
            </SheetTitle>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs"
                onClick={() => {
                  const dateStr = format(selectedDay!, "yyyy-MM-dd");
                  setSelectedDay(null);
                  nav(`/admin/events/new?date=${dateStr}`);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Create event
              </Button>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-2 pt-3">
            {dayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {isAdmin ? "No events — tap Create event to add one." : "No events scheduled."}
              </p>
            ) : (
              dayEvents.map((e) => <UpcomingEventRow key={e.id} event={e} />)
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
