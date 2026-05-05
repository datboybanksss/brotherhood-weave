import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyChannels } from "@/hooks/useMyChannels";
import ChannelRow from "@/components/communities/ChannelRow";
import EventsLayer from "@/components/communities/EventsLayer";

export default function Communities() {
  const [params, setParams] = useSearchParams();
  const layer = params.get("layer") === "events" ? "events" : "channels";
  const { data, isLoading } = useMyChannels();
  return (
    <div>
      <div className="sticky top-0 bg-background z-10 p-4 pb-3 border-b border-border space-y-3">
        <h1 className="text-xl font-bold text-foreground">Communities</h1>
        <Tabs value={layer} onValueChange={(v) => setParams({ layer: v })}>
          <TabsList className="grid grid-cols-2 w-full"><TabsTrigger value="channels">Channels</TabsTrigger><TabsTrigger value="events">Events</TabsTrigger></TabsList>
        </Tabs>
      </div>
      {layer === "channels" ? (
        <div className="px-2">
          {isLoading && <p className="text-sm text-muted-foreground p-4">Loading…</p>}
          {data?.map((c) => <ChannelRow key={c.id} channel={c} />)}
          {data?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8 px-4">No channels yet — make sure you've joined a department on the Me tab.</p>}
        </div>
      ) : <EventsLayer />}
    </div>
  );
}
