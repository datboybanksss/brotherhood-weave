import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORY_KEYS, CATEGORY_META, FORMAT_KEYS, FORMAT_META, type EventCategory, type EventFormat } from "@/lib/event-meta";
import { createEvent, updateEvent, uploadEventCover } from "@/api/admin-events";

type F = { title: string; description: string; category: EventCategory; format: EventFormat; location: string; starts_at: string; ends_at: string; cover_url: string | null; is_published: boolean };
const blank: F = { title: "", description: "", category: "fitness", format: "in_person", location: "", starts_at: "", ends_at: "", cover_url: null, is_published: true };

export default function EventForm() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate(); const qc = useQueryClient(); const { user } = useAuth();
  const isEdit = !!id;
  const { data: existing } = useQuery({ queryKey: ["adminEvent", id], queryFn: async () => {
    const { data, error } = await supabase.from("events").select("*").eq("id", id!).single();
    if (error) throw error; return data;
  }, enabled: isEdit });
  const [f, setF] = useState<F>(blank); const [hyd, setHyd] = useState(false); const [up, setUp] = useState(false);
  if (existing && !hyd) {
    setF({ title: existing.title, description: existing.description ?? "", category: existing.category as EventCategory, format: existing.format as EventFormat, location: existing.location ?? "",
      starts_at: existing.starts_at.slice(0, 16), ends_at: existing.ends_at?.slice(0, 16) ?? "", cover_url: existing.cover_url, is_published: existing.is_published });
    setHyd(true);
  }
  const upd = <K extends keyof F>(k: K, v: F[K]) => setF((p) => ({ ...p, [k]: v }));
  const m = useMutation({
    mutationFn: async () => {
      if (!f.title.trim() || !f.starts_at) { toast.error("Title and start time required"); throw new Error("invalid"); }
      const payload = { title: f.title.trim(), description: f.description.trim() || null, category: f.category, format: f.format,
        location: f.location.trim() || null, starts_at: new Date(f.starts_at).toISOString(),
        ends_at: f.ends_at ? new Date(f.ends_at).toISOString() : null, cover_url: f.cover_url, is_published: f.is_published };
      if (isEdit) await updateEvent(id!, payload); else await createEvent({ ...payload, created_by: user!.id });
    },
    onSuccess: () => { toast.success(isEdit ? "Updated" : "Created"); qc.invalidateQueries({ queryKey: ["adminEvents"] }); nav("/admin/events"); },
    onError: (e: any) => { if (e.message !== "invalid") toast.error(e.message ?? "Save failed"); },
  });
  const onCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setUp(true);
    const url = await uploadEventCover(file).catch((err) => { toast.error(err.message); return null; });
    setUp(false); if (url) upd("cover_url", url);
  };
  const locPlaceholder = f.format === "in_person" ? "Venue address" : f.format === "remote" ? "e.g. Worldwide / Zoom" : "Venue + remote details";

  return (
    <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="p-6 space-y-4 max-w-2xl">
      <Button type="button" variant="ghost" size="sm" onClick={() => nav("/admin/events")} className="-ml-2 text-muted-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
      <h1 className="text-xl font-bold">{isEdit ? "Edit" : "New"} Event</h1>
      <div className="space-y-1"><Label>Title</Label><Input value={f.title} onChange={(e) => upd("title", e.target.value)} maxLength={120} required /></div>
      <div className="space-y-1"><Label>Description (markdown)</Label><Textarea rows={5} value={f.description} onChange={(e) => upd("description", e.target.value.slice(0, 5000))} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Category</Label>
          <Select value={f.category} onValueChange={(v) => upd("category", v as EventCategory)}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORY_KEYS.map((k) => <SelectItem key={k} value={k}>{CATEGORY_META[k].label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label>Format</Label>
          <Select value={f.format} onValueChange={(v) => upd("format", v as EventFormat)}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FORMAT_KEYS.map((k) => <SelectItem key={k} value={k}>{FORMAT_META[k].label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1"><Label>Location</Label><Input placeholder={locPlaceholder} value={f.location} onChange={(e) => upd("location", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Starts at</Label><Input type="datetime-local" value={f.starts_at} onChange={(e) => upd("starts_at", e.target.value)} required /></div>
        <div className="space-y-1"><Label>Ends at (optional)</Label><Input type="datetime-local" value={f.ends_at} onChange={(e) => upd("ends_at", e.target.value)} /></div>
      </div>
      <div className="space-y-1"><Label>Cover image</Label>
        {f.cover_url && <img src={f.cover_url} alt="cover" className="w-full max-w-xs aspect-video object-cover rounded-md border" />}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onCover} disabled={up} className="text-sm" />
      </div>
      <div className="flex items-center gap-2"><Switch checked={f.is_published} onCheckedChange={(v) => upd("is_published", v)} /><Label>Published</Label></div>
      <Button type="submit" disabled={m.isPending}>{m.isPending ? "Saving…" : "Save"}</Button>
    </form>
  );
}
