import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getArchive } from "@/api/archives";
import { supabase } from "@/lib/supabase";
import LessonVideoEmbed from "@/components/library/LessonVideoEmbed";
import ArchiveCoverPlaceholder from "@/components/library/ArchiveCoverPlaceholder";
import CuratorNoteBlock from "@/components/library/CuratorNoteBlock";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ARCHIVE_DOMAINS, CONTENT_TYPE_LABEL, type ArchiveContentType, type ArchiveDomain } from "@/lib/archive-domains";
import { toast } from "sonner";

export default function ArchiveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [signing, setSigning] = useState(false);

  const { data: archive } = useQuery({
    queryKey: ["archive", id],
    queryFn: () => getArchive(id!),
    enabled: !!id,
  });

  if (!archive) return null;
  const a = archive as any;
  const contentType = a.content_type as ArchiveContentType;
  const domain = a.domain as ArchiveDomain | null;
  const meta = domain ? ARCHIVE_DOMAINS[domain] : null;

  async function getSignedUrl(): Promise<string | null> {
    setSigning(true);
    const { data, error } = await supabase.functions.invoke("get_archive_document_url", {
      body: { archive_id: id },
    });
    setSigning(false);
    if (error || !data?.url) { toast.error("Could not load document"); return null; }
    return data.url as string;
  }

  async function handleDownload() {
    const url = await getSignedUrl();
    if (url) window.open(url, "_blank");
  }

  const isPdf = a.document_filename?.toLowerCase().endsWith(".pdf");
  const verb = contentType === "video" ? "watch" : "read";

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate("/library?layer=archives")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted border border-border">
        {a.cover_url ? (
          <img src={a.cover_url} alt={a.title} className="w-full h-full object-cover" />
        ) : (
          <ArchiveCoverPlaceholder title={a.title} contentType={contentType} domain={domain} size="lg" />
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-foreground/5 text-foreground">
          {CONTENT_TYPE_LABEL[contentType]}
        </span>
        {meta && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>}
      </div>

      <h1 className="text-xl font-bold text-foreground">{a.title}</h1>
      <p className="text-xs text-muted-foreground">
        Posted {format(new Date(a.recorded_at), "MMMM d, yyyy")}
        {a.read_time_minutes ? ` · ${a.read_time_minutes} min ${verb}` : ""}
      </p>

      {a.curator_note && <CuratorNoteBlock note={a.curator_note} authorId={a.created_by} />}

      {contentType === "video" && a.video_url && <LessonVideoEmbed url={a.video_url} />}

      {contentType === "document" && (
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground truncate">{a.document_filename}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownload} disabled={signing} size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
            {isPdf && (
              <Button onClick={handleDownload} disabled={signing} size="sm" variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> View in browser
              </Button>
            )}
          </div>
        </div>
      )}

      {contentType === "text" && a.body_markdown && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.body_markdown}</ReactMarkdown>
        </div>
      )}

      {a.description && contentType !== "text" && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.description}</p>
      )}
    </div>
  );
}
