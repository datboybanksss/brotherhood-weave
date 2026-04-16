import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLesson, updateLesson, getLessonById } from "@/api/admin-modules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import PdfUploadField from "@/components/admin/PdfUploadField";

export default function LessonForm() {
  const { moduleId, lessonId } = useParams();
  const isEdit = !!lessonId;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [worksheetPdfUrl, setWorksheetPdfUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [durationSeconds, setDurationSeconds] = useState<number | "">("");

  const { data: lesson } = useQuery({
    queryKey: ["adminLesson", lessonId],
    queryFn: () => getLessonById(lessonId!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setVideoUrl(lesson.video_url ?? "");
      setBodyMarkdown(lesson.body_markdown ?? "");
      setWorksheetPdfUrl(lesson.worksheet_pdf_url ?? "");
      setDisplayOrder(lesson.display_order);
      setDurationSeconds(lesson.duration_seconds ?? "");
    }
  }, [lesson]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const values = {
        title,
        video_url: videoUrl || null,
        body_markdown: bodyMarkdown || null,
        worksheet_pdf_url: worksheetPdfUrl || null,
        display_order: displayOrder,
        duration_seconds: durationSeconds === "" ? null : Number(durationSeconds),
      };
      if (isEdit) await updateLesson(lessonId!, values);
      else await createLesson({ ...values, module_id: moduleId!, video_url: values.video_url ?? undefined, body_markdown: values.body_markdown ?? undefined, worksheet_pdf_url: values.worksheet_pdf_url ?? undefined, duration_seconds: values.duration_seconds ?? undefined });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminModuleLessons", moduleId] });
      toast.success(isEdit ? "Updated" : "Created");
      navigate(`/admin/modules/${moduleId}/edit`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/modules/${moduleId}/edit`)} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <h1 className="text-xl font-bold text-foreground">{isEdit ? "Edit Lesson" : "New Lesson"}</h1>

      <div className="space-y-4">
        <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><Label>Video URL</Label><Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." /></div>
        <div><Label>Body (Markdown)</Label><Textarea value={bodyMarkdown} onChange={(e) => setBodyMarkdown(e.target.value)} rows={8} /></div>
        <div><Label>Display Order</Label><Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} /></div>
        <div><Label>Duration (seconds)</Label><Input type="number" value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value === "" ? "" : Number(e.target.value))} /></div>
        <PdfUploadField bucket="lesson-worksheets" onUpload={setWorksheetPdfUrl} currentUrl={worksheetPdfUrl || null} />
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !title}>
          {saveMut.isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Lesson"}
        </Button>
      </div>
    </div>
  );
}
