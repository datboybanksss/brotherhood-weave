import { CATEGORY_META, FORMAT_META } from "@/lib/event-meta";
import type { EventRow } from "@/api/events";

export default function EventHero({ event }: { event: EventRow }) {
  const cat = CATEGORY_META[event.category];
  const fmt = FORMAT_META[event.format];
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
      {event.cover_url ? (
        <img src={event.cover_url} alt={event.title} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${cat.dot} opacity-30`}>
          <span className="text-white text-xl font-bold px-4 text-center">{event.title}</span>
        </div>
      )}
      <div className="absolute top-2 left-2 flex gap-1.5">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.badge}`}>{cat.label}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${fmt.badge}`}>{fmt.label}</span>
      </div>
    </div>
  );
}
