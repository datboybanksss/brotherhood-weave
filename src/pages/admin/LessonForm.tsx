import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLesson, updateLesson, getLessonById } from "@/api/admin-modules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import PdfUploadField from "@/components/admin/PdfUploadField";
import { format } from "date-fns";
import { getLessonReleaseStatus } from "@/api/lessons";

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
  const [isReleased, setIsReleased] = useState(false);
  const [releaseDate, setReleaseDate] = useState<string>("");

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
      setIsReleased(lesson.is_released ?? false);
      setReleaseDate(
        lesson.release_date ? format(new Date(lesson.release_date), "yyyy-MM-dd'T'HH:mm") : ""
      );
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
        is_released: isReleased,
        release_date: releaseDate ? new Date(releaseDate).toISOString() : null,
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
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Released</Label>
            <Switch checked={isReleased} onCheckedChange={setIsReleased} />
          </div>
          <div>
            <Label className="text-sm">Auto-release date</Label>
            <Input
              type="datetime-local"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lesson auto-unlocks at this date even if toggle is off.
            </p>
          </div>
          <StatusLine isReleased={isReleased} releaseDate={releaseDate} />
        </div>
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

function StatusLine({ isReleased, releaseDate }: { isReleased: boolean; releaseDate: string }) {
  const status = getLessonReleaseStatus({
    is_released: isReleased,
    release_date: releaseDate ? new Date(releaseDate).toISOString() : null,
  });
  if (status === "live") return <p className="text-xs font-medium text-green-600">Currently: Live</p>;
  if (status === "scheduled")
    return (
      <p className="text-xs font-medium text-amber-600">
        Currently: Scheduled for {format(new Date(releaseDate), "MMM d, yyyy h:mm a")}
      </p>
    );
  return <p className="text-xs font-medium text-destructive">Currently: Locked</p>;
}
