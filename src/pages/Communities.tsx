import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyChannels } from "@/hooks/useMyChannels";
import { useUpcomingEvents } from "@/hooks/useUpcomingEvents";
import ChannelRow from "@/components/communities/ChannelRow";
import EventsCalendar from "@/components/communities/EventsCalendar";
import EventRowWithRSVP from "@/components/communities/EventRowWithRSVP";
import PulseTab from "@/components/communities/PulseTab";
import type { ChannelListItem } from "@/api/channels";

type Layer = "pulse" | "channels" | "events";

function GroupedChannels({ channels }: { channels: ChannelListItem[] }) {
  const pinned = channels.filter((c) => c.channel_type === "announcements");
  const dept = channels.filter((c) => c.channel_type === "department");
  const general = channels.filter((c) => c.channel_type === "general");

  const Section = ({ label, items }: { label: string; items: ChannelListItem[] }) =>
    items.length === 0 ? null : (
      <div className="mb-2">
        <p className="text-xs uppercase tracking-wide text-text-muted font-medium px-3 pt-3 pb-1">{label}</p>
        {items.map((c) => <ChannelRow key={c.id} channel={c} />)}
      </div>
    );

  if (channels.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8 px-4">
        No channels yet — join a department on the Me tab.
      </p>
    );
  }

  return (
    <div className="pb-10 px-2">
      <Section label="Pinned" items={pinned} />
      <Section label="Departments" items={dept} />
      <Section label="General" items={general} />
    </div>
  );
}

export default function Communities() {
  const [params, setParams] = useSearchParams();
  const layer = (params.get("layer") ?? "pulse") as Layer;
  const { data: channels, isLoading: chLoading } = useMyChannels();
  const { data: events, isLoading: evLoading } = useUpcomingEvents(20);

  const setLayer = (l: string) => setParams({ layer: l });

  return (
    <div>
      <div className="sticky top-0 bg-background z-10 px-4 pt-4 pb-0 border-b border-border space-y-3">
        <h1 className="text-xl font-bold text-foreground">Communities</h1>
        <Tabs value={layer} onValueChange={setLayer}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="pulse">Pulse</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {layer === "pulse" && (
        <PulseTab onGoToChannels={() => setLayer("channels")} />
      )}

      {layer === "channels" && (
        chLoading
          ? <p className="text-sm text-muted-foreground p-4">Loading…</p>
          : <GroupedChannels channels={channels ?? []} />
      )}

      {layer === "events" && (
        <div className="p-4 space-y-6 pb-10">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Upcoming</h2>
            {evLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!evLoading && (events ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>
            )}
            <div className="space-y-5">
              {(events ?? []).map((e) => <EventRowWithRSVP key={e.id} event={e} />)}
            </div>
          </section>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Calendar</h2>
            <EventsCalendar />
          </section>
        </div>
      )}
    </div>
  );
}
