import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import { createPlaybook, updatePlaybook, uploadPlaybookPdf } from "@/api/admin-playbooks";
import { generateSlug } from "@/api/playbooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PdfUploadField from "@/components/admin/PdfUploadField";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const categories = ["money", "career", "relationships", "health", "mindset", "craft"] as const;

interface FormValues {
  title: string;
  slug: string;
  summary: string;
  body_markdown: string;
  category: string;
  author_id: string;
  is_published: boolean;
}

export default function PlaybookForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;
  const [preview, setPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { data: existing } = useQuery({
    queryKey: ["playbook-edit", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("playbooks").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
  });

  const { data: admins } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("id, full_name").eq("is_admin", true);
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormValues>({
    values: existing ? {
      title: existing.title, slug: existing.slug, summary: existing.summary,
      body_markdown: existing.body_markdown, category: existing.category,
      author_id: existing.author_id, is_published: existing.is_published,
    } : { title: "", slug: "", summary: "", body_markdown: "", category: "career", author_id: "", is_published: true },
  });

  const titleVal = form.watch("title");
  const bodyVal = form.watch("body_markdown");
  const summaryVal = form.watch("summary");

  const mutation = useMutation({
    mutationFn: async (vals: FormValues) => {
      const slug = vals.slug || generateSlug(vals.title);
      const payload = { ...vals, slug, pdf_attachment_url: pdfUrl ?? existing?.pdf_attachment_url ?? undefined };
      if (isEdit) return updatePlaybook(id!, payload);
      return createPlaybook(payload as any);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Updated" : "Created");
      qc.invalidateQueries({ queryKey: ["adminPlaybooks"] });
      navigate("/admin/playbooks");
    },
  });

  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="p-6 space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-foreground">{isEdit ? "Edit" : "New"} Playbook</h1>

      <div className="space-y-2">
        <Label>Title</Label>
        <Input {...form.register("title", { required: true })} onBlur={() => {
          if (!form.getValues("slug")) form.setValue("slug", generateSlug(titleVal));
        }} />
      </div>
      <div className="space-y-2">
        <Label>Slug</Label>
        <Input {...form.register("slug")} />
      </div>
      <div className="space-y-2">
        <Label>Summary ({summaryVal.length}/200)</Label>
        <Textarea {...form.register("summary", { required: true, maxLength: 200 })} maxLength={200} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Body (Markdown supported)</Label>
          <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(!preview)}>
            {preview ? "Edit" : "Preview"}
          </Button>
        </div>
        {preview ? (
          <div className="prose prose-sm dark:prose-invert border border-border rounded-lg p-4 min-h-[200px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyVal}</ReactMarkdown>
          </div>
        ) : (
          <Textarea {...form.register("body_markdown", { required: true })} className="min-h-[200px]" />
        )}
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={form.watch("category")} onValueChange={(v) => form.setValue("category", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Author</Label>
        <Select value={form.watch("author_id")} onValueChange={(v) => form.setValue("author_id", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {admins?.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <PdfUploadField bucket="playbook-attachments" onUpload={setPdfUrl} currentUrl={existing?.pdf_attachment_url} />
      <div className="flex items-center gap-2">
        <Switch checked={form.watch("is_published")} onCheckedChange={(v) => form.setValue("is_published", v)} />
        <Label>Published</Label>
      </div>
      {isEdit && (
        <Button type="button" variant="outline" size="sm" onClick={async () => {
          await updatePlaybook(id!, { last_reviewed_at: new Date().toISOString() });
          toast.success("Marked as reviewed today");
        }}>
          Mark as reviewed today
        </Button>
      )}
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
