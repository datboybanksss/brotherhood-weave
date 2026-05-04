import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { createArchive, updateArchive, type ArchiveInput } from "@/api/admin-archives";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Eye, Edit3 } from "lucide-react";
import { toast } from "sonner";
import ContentTypeSelector from "@/components/admin/ContentTypeSelector";
import VideoUrlField from "@/components/admin/VideoUrlField";
import DocumentUploadField from "@/components/admin/DocumentUploadField";
import CoverUploadField from "@/components/admin/CoverUploadField";
import { ARCHIVE_DOMAIN_KEYS, ARCHIVE_DOMAINS, type ArchiveContentType, type ArchiveDomain } from "@/lib/archive-domains";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type FormState = {
  title: string;
  description: string;
  content_type: ArchiveContentType;
  domain: ArchiveDomain | "none";
  curator_note: string;
  read_time_minutes: string;
  recorded_at: string;
  is_published: boolean;
  cover_url: string | null;
  video_url: string;
  document_url: string | null;
  document_filename: string | null;
  body_markdown: string;
};

const blank: FormState = {
  title: "", description: "", content_type: "video", domain: "none", curator_note: "",
  read_time_minutes: "", recorded_at: new Date().toISOString().slice(0, 10),
  is_published: true, cover_url: null, video_url: "", document_url: null,
  document_filename: null, body_markdown: "",
};

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
      return data as any;
    },
    enabled: isEdit,
  });

  const [form, setForm] = useState<FormState>(blank);
  const [hydrated, setHydrated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (existing && !hydrated) {
    setForm({
      title: existing.title ?? "",
      description: existing.description ?? "",
      content_type: existing.content_type ?? "video",
      domain: (existing.domain as ArchiveDomain) ?? "none",
      curator_note: existing.curator_note ?? "",
      read_time_minutes: existing.read_time_minutes != null ? String(existing.read_time_minutes) : "",
      recorded_at: existing.recorded_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      is_published: existing.is_published ?? true,
      cover_url: existing.cover_url ?? null,
      video_url: existing.video_url ?? "",
      document_url: existing.document_url ?? null,
      document_filename: existing.document_filename ?? null,
      body_markdown: existing.body_markdown ?? "",
    });
    setHydrated(true);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function buildPayload(): ArchiveInput | null {
    if (!form.title.trim()) { toast.error("Title required"); return null; }
    if (form.content_type === "video" && !form.video_url) { toast.error("Video URL required"); return null; }
    if (form.content_type === "document" && !form.document_url) { toast.error("Upload a document"); return null; }
    if (form.content_type === "text" && !form.body_markdown.trim()) { toast.error("Article body required"); return null; }
    if (form.curator_note.length > 400) { toast.error("Curator note too long"); return null; }
    return {
      title: form.title.trim(),
      description: form.description.trim() || null,
      content_type: form.content_type,
      domain: form.domain === "none" ? null : form.domain,
      curator_note: form.curator_note.trim() || null,
      read_time_minutes: form.read_time_minutes ? Number(form.read_time_minutes) : null,
      recorded_at: new Date(form.recorded_at).toISOString(),
      is_published: form.is_published,
      cover_url: form.cover_url,
      video_url: form.content_type === "video" ? form.video_url.trim() : null,
      document_url: form.content_type === "document" ? form.document_url : null,
      document_filename: form.content_type === "document" ? form.document_filename : null,
      body_markdown: form.content_type === "text" ? form.body_markdown : null,
    };
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (!payload) throw new Error("invalid");
      if (isEdit) await updateArchive(id!, payload);
      else await createArchive({ ...payload, created_by: user!.id });
    },
    onSuccess: () => {
      toast.success(isEdit ? "Updated" : "Created");
      qc.invalidateQueries({ queryKey: ["adminArchives"] });
      qc.invalidateQueries({ queryKey: ["archives"] });
      navigate("/admin/archives");
    },
    onError: (e: any) => { if (e.message !== "invalid") toast.error(e.message ?? "Save failed"); },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-5 max-w-2xl">
      <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/admin/archives")} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <h1 className="text-xl font-bold text-foreground">{isEdit ? "Edit" : "New"} Archive</h1>

      <div className="space-y-2">
        <Label>Content type {isEdit && <span className="text-xs text-muted-foreground">(locked)</span>}</Label>
        <ContentTypeSelector value={form.content_type} onChange={(v) => update("content_type", v)} disabled={isEdit} />
      </div>

      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => update("title", e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label>Domain</Label>
        <Select value={form.domain} onValueChange={(v) => update("domain", v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None / General</SelectItem>
            {ARCHIVE_DOMAIN_KEYS.map((d) => (
              <SelectItem key={d} value={d}>{ARCHIVE_DOMAINS[d].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Description (short summary)</Label>
        <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} />
      </div>

      <div className="space-y-2">
        <Label>Curator's note <span className="text-xs text-muted-foreground">({form.curator_note.length}/400)</span></Label>
        <Textarea value={form.curator_note} onChange={(e) => update("curator_note", e.target.value.slice(0, 400))} rows={3}
          placeholder="Why does this matter to the brotherhood?" />
      </div>

      <CoverUploadField value={form.cover_url} onChange={(v) => update("cover_url", v)} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={form.recorded_at} onChange={(e) => update("recorded_at", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Read/watch time (min)</Label>
          <Input type="number" min={1} value={form.read_time_minutes} onChange={(e) => update("read_time_minutes", e.target.value)} />
        </div>
      </div>

      {form.content_type === "video" && (
        <VideoUrlField value={form.video_url} onChange={(v) => update("video_url", v)} />
      )}

      {form.content_type === "document" && user && (
        <DocumentUploadField
          userId={user.id}
          filename={form.document_filename}
          onChange={(path, name) => { update("document_url", path); update("document_filename", name); }}
        />
      )}

      {form.content_type === "text" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Body (markdown)</Label>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview((p) => !p)} className="gap-1">
              {showPreview ? <Edit3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showPreview ? "Edit" : "Preview"}
            </Button>
          </div>
          {showPreview ? (
            <div className="prose prose-sm dark:prose-invert max-w-none border border-border rounded-md p-3 min-h-[200px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.body_markdown || "*Nothing to preview*"}</ReactMarkdown>
            </div>
          ) : (
            <Textarea value={form.body_markdown} onChange={(e) => update("body_markdown", e.target.value)} rows={12}
              placeholder="# Heading&#10;&#10;Write your article in markdown..." className="font-mono text-xs" />
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Switch checked={form.is_published} onCheckedChange={(v) => update("is_published", v)} />
        <Label>Published</Label>
      </div>

      <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save"}</Button>
    </form>
  );
}
