import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventRow from "@/components/admin/EventRow";
import { listAdminEvents } from "@/api/admin-events";

export default function AdminEvents() {
  const nav = useNavigate();
  const { data: events } = useQuery({ queryKey: ["adminEvents"], queryFn: listAdminEvents });
  const now = new Date();
  const upcoming = (events ?? []).filter((e) => new Date(e.ends_at ?? e.starts_at) >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = (events ?? []).filter((e) => new Date(e.ends_at ?? e.starts_at) < now)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  return (
    <div className="p-6 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => nav("/me")} className="-ml-2 text-muted-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Events</h1>
        <Button size="sm" onClick={() => nav("/admin/events/new")}><Plus className="h-4 w-4 mr-1" />New Event</Button>
      </div>
      <Tabs defaultValue="upcoming">
        <TabsList><TabsTrigger value="upcoming">Upcoming</TabsTrigger><TabsTrigger value="past">Past</TabsTrigger></TabsList>
        <TabsContent value="upcoming" className="space-y-2 mt-3">
          {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
          {upcoming.map((e) => <EventRow key={e.id} event={e} />)}
        </TabsContent>
        <TabsContent value="past" className="space-y-2 mt-3">
          {past.length === 0 && <p className="text-sm text-muted-foreground">No past events.</p>}
          {past.map((e) => <EventRow key={e.id} event={e} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
