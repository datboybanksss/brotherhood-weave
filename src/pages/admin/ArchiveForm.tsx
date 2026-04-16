import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import { createArchive, updateArchive } from "@/api/admin-archives";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface FormValues {
  title: string;
  description: string;
  recording_url: string;
  recorded_at: string;
  is_published: boolean;
}

export default function ArchiveForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isEdit = !!id;

  const { data: existing } = useQuery({
    queryKey: ["archive", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("archives").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
  });

  const form = useForm<FormValues>({
    values: existing ? {
      title: existing.title,
      description: existing.description ?? "",
      recording_url: existing.recording_url,
      recorded_at: existing.recorded_at.slice(0, 10),
      is_published: existing.is_published,
    } : { title: "", description: "", recording_url: "", recorded_at: "", is_published: true },
  });

  const mutation = useMutation({
    mutationFn: (vals: FormValues) =>
      isEdit
        ? updateArchive(id!, { ...vals, recorded_at: new Date(vals.recorded_at).toISOString() })
        : createArchive({ ...vals, recorded_at: new Date(vals.recorded_at).toISOString(), created_by: user!.id }),
    onSuccess: () => {
      toast.success(isEdit ? "Updated" : "Created");
      qc.invalidateQueries({ queryKey: ["adminArchives"] });
      navigate("/admin/archives");
    },
  });

  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="p-6 space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-foreground">{isEdit ? "Edit" : "New"} Archive</h1>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input {...form.register("title", { required: true })} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea {...form.register("description")} />
      </div>
      <div className="space-y-2">
        <Label>Recording URL</Label>
        <Input {...form.register("recording_url", { required: true })} />
      </div>
      <div className="space-y-2">
        <Label>Recorded at</Label>
        <Input type="date" {...form.register("recorded_at", { required: true })} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.watch("is_published")} onCheckedChange={(v) => form.setValue("is_published", v)} />
        <Label>Published</Label>
      </div>
      <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save"}</Button>
    </form>
  );
}
