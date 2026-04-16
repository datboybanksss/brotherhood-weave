// TODO: replace Mark Complete button with YouTube IFrame API onStateChange listener for automatic completion on video end.
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getLessonsByModule, getUserLessonProgress } from "@/api/lessons";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import LessonRow from "@/components/library/LessonRow";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ModuleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: appUser } = useCurrentUser();

  const { data: mod } = useQuery({
    queryKey: ["module", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("*").eq("slug", slug!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: lessons } = useQuery({
    queryKey: ["lessons", mod?.id],
    queryFn: () => getLessonsByModule(mod!.id),
    enabled: !!mod?.id,
  });

  const lessonIds = lessons?.map((l) => l.id) ?? [];
  const { data: progress } = useQuery({
    queryKey: ["lessonProgress", appUser?.id, mod?.id],
    queryFn: () => getUserLessonProgress(appUser!.id, lessonIds),
    enabled: !!appUser?.id && lessonIds.length > 0,
  });

  const completedSet = new Set(progress?.filter((p) => p.completed_at).map((p) => p.lesson_id));

  function getStatus(index: number, lessonId: string) {
    if (completedSet.has(lessonId)) return "complete" as const;
    if (index === 0) return "available" as const;
    const prevLesson = lessons![index - 1];
    return completedSet.has(prevLesson.id) ? "available" as const : "locked" as const;
  }

  if (!mod || !lessons) return null;

  return (
    <div className="p-6 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/library")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <div>
        <h1 className="text-xl font-bold text-foreground">{mod.title}</h1>
        {mod.description && <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>}
      </div>
      <div className="space-y-2">
        {lessons.map((lesson, i) => (
          <LessonRow
            key={lesson.id}
            index={i + 1}
            title={lesson.title}
            status={getStatus(i, lesson.id)}
            onTap={() => navigate(`/library/module/${slug}/lesson/${i + 1}`)}
          />
        ))}
      </div>
    </div>
  );
}
