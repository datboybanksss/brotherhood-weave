// TODO: replace Mark Complete button with YouTube IFrame API onStateChange listener for automatic completion on video end.
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getLessonsByModule, getUserLessonProgress } from "@/api/lessons";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import LessonVideoEmbed from "@/components/library/LessonVideoEmbed";
import MarkCompleteButton from "@/components/library/MarkCompleteButton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function LessonReader() {
  const { moduleSlug, lessonIndex } = useParams<{ moduleSlug: string; lessonIndex: string }>();
  const navigate = useNavigate();
  const { data: appUser } = useCurrentUser();
  const idx = parseInt(lessonIndex ?? "1", 10) - 1;

  const { data: mod } = useQuery({
    queryKey: ["module", moduleSlug],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("*").eq("slug", moduleSlug!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!moduleSlug,
  });

  const { data: lessons } = useQuery({
    queryKey: ["lessons", mod?.id],
    queryFn: () => getLessonsByModule(mod!.id),
    enabled: !!mod?.id,
  });

  const lesson = lessons?.[idx];
  const lessonIds = lessons?.map((l) => l.id) ?? [];

  const { data: progress } = useQuery({
    queryKey: ["lessonProgress", appUser?.id, mod?.id],
    queryFn: () => getUserLessonProgress(appUser!.id, lessonIds),
    enabled: !!appUser?.id && lessonIds.length > 0,
  });

  if (!lesson || !mod || !appUser) return null;

  const myProgress = progress?.find((p) => p.lesson_id === lesson.id);
  const isComplete = !!myProgress?.completed_at;
  const hasNext = lessons && idx < lessons.length - 1;

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/library/module/${moduleSlug}`)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <div className="text-xs text-muted-foreground">{mod.title} → Lesson {idx + 1}</div>
      <h1 className="text-xl font-bold text-foreground">{lesson.title}</h1>

      {lesson.video_url && <LessonVideoEmbed url={lesson.video_url} />}

      <MarkCompleteButton
        userId={appUser.id}
        lessonId={lesson.id}
        completedAt={myProgress?.completed_at ?? null}
        moduleId={mod.id}
      />

      {lesson.body_markdown && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.body_markdown}</ReactMarkdown>
        </div>
      )}

      {lesson.worksheet_pdf_url && (
        <a href={lesson.worksheet_pdf_url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full gap-2">
            <Download className="h-4 w-4" /> Download worksheet
          </Button>
        </a>
      )}

      <div className="flex gap-2">
        {hasNext && (
          <Button
            className="flex-1"
            disabled={!isComplete}
            onClick={() => navigate(`/library/module/${moduleSlug}/lesson/${idx + 2}`)}
          >
            Next lesson
          </Button>
        )}
        {!hasNext && (
          <Button variant="outline" className="flex-1" onClick={() => navigate(`/library/module/${moduleSlug}`)}>
            Back to module
          </Button>
        )}
      </div>
    </div>
  );
}
