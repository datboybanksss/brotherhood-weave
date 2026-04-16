import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getModuleById, createModule, updateModule, getModuleLessons, deleteLesson } from "@/api/admin-modules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function ModuleForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [requiredTierId, setRequiredTierId] = useState<string | null>(null);

  const { data: tiers } = useQuery({
    queryKey: ["tiers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tiers").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: module } = useQuery({
    queryKey: ["adminModule", id],
    queryFn: () => getModuleById(id!),
    enabled: isEdit,
  });

  const { data: lessons } = useQuery({
    queryKey: ["adminModuleLessons", id],
    queryFn: () => getModuleLessons(id!),
    enabled: isEdit,
  });

  const deleteLessonMut = useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminModuleLessons", id] }); toast.success("Lesson deleted"); },
  });

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description ?? "");
      setDisplayOrder(module.display_order);
      setRequiredTierId(module.required_tier_id);
    }
  }, [module]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const values = { title, description, display_order: displayOrder, required_tier_id: requiredTierId };
      if (isEdit) await updateModule(id!, values);
      else await createModule(values);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminModules"] });
      toast.success(isEdit ? "Updated" : "Created");
      navigate("/admin/modules");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/modules")} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <h1 className="text-xl font-bold text-foreground">{isEdit ? "Edit Module" : "New Module"}</h1>

      <div className="space-y-4">
        <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div><Label>Display Order</Label><Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} /></div>
        <div>
          <Label>Required Tier</Label>
          <Select value={requiredTierId ?? "none"} onValueChange={(v) => setRequiredTierId(v === "none" ? null : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (open to all)</SelectItem>
              {tiers?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !title}>
          {saveMut.isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Module"}
        </Button>
      </div>

      {isEdit && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Lessons</h2>
            <Button size="sm" onClick={() => navigate(`/admin/modules/${id}/lessons/new`)}>
              <Plus className="h-4 w-4 mr-1" /> Add Lesson
            </Button>
          </div>
          {lessons?.map((l) => (
            <div key={l.id} className="flex items-center justify-between border border-border rounded-lg p-3">
              <div>
                <p className="font-medium text-foreground text-sm">{l.title}</p>
                <p className="text-xs text-muted-foreground">Order: {l.display_order}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/modules/${id}/lessons/${l.id}/edit`)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteLessonMut.mutate(l.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {!lessons?.length && <p className="text-sm text-muted-foreground">No lessons yet.</p>}
        </div>
      )}
    </div>
  );
}
