import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict, format } from "date-fns";
import { Pencil, Trash2, ExternalLink, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CATEGORY_META, FORMAT_META } from "@/lib/event-meta";
import { deleteEvent, getRecapForEvent } from "@/api/admin-events";
import { getEventRsvpSummary } from "@/api/events";
import type { EventRow as Row } from "@/api/events";
import { toast } from "sonner";

export default function EventRow({ event }: { event: Row }) {
  const nav = useNavigate(); const qc = useQueryClient();
  const isPast = new Date(event.starts_at) < new Date();
  const { data: summary } = useQuery({ queryKey: ["eventRsvpSummary", event.id], queryFn: () => getEventRsvpSummary(event.id), staleTime: 60_000 });
  const { data: recap } = useQuery({ queryKey: ["recapForEvent", event.id], queryFn: () => getRecapForEvent(event.id), enabled: isPast, staleTime: 60_000 });
  const del = useMutation({
    mutationFn: () => deleteEvent(event.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminEvents"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });
  const cat = CATEGORY_META[event.category]; const fmt = FORMAT_META[event.format];
  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium text-sm truncate">{event.title}</p>
          <div className="flex flex-wrap gap-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.badge}`}>{cat.label}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${fmt.badge}`}>{fmt.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">{format(new Date(event.starts_at), "MMM d, yyyy h:mm a")} · {formatDistanceToNowStrict(new Date(event.starts_at), { addSuffix: true })}</p>
          {summary && <p className="text-xs text-muted-foreground">{summary.going_in_person} in-person · {summary.going_remote} remote · {summary.not_going} declined</p>}
        </div>
        <div className="flex gap-0.5 shrink-0">
          <Button variant="ghost" size="icon" asChild><Link to={`/events/${event.id}`}><ExternalLink className="h-4 w-4" /></Link></Button>
          <Button variant="ghost" size="icon" onClick={() => nav(`/admin/events/${event.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete event?")) del.mutate(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>
      {isPast && !recap && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => nav(`/admin/archives/new?mode=event_recap&eventId=${event.id}`)}>
          <FileText className="h-4 w-4 mr-1" /> Add Recap
        </Button>
      )}
    </div>
  );
}
