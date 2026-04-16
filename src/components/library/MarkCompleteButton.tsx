import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markLessonComplete } from "@/api/lessons";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Props {
  userId: string;
  lessonId: string;
  completedAt: string | null;
  moduleId: string;
}

export default function MarkCompleteButton({ userId, lessonId, completedAt, moduleId }: Props) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => markLessonComplete(userId, lessonId),
    onSuccess: () => {
      toast.success("Lesson complete");
      qc.invalidateQueries({ queryKey: ["lessonProgress"] });
      qc.invalidateQueries({ queryKey: ["moduleProgress"] });
      qc.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  if (completedAt) {
    return (
      <Button disabled variant="secondary" className="w-full gap-2">
        <CheckCircle className="h-4 w-4" />
        Completed {formatDistanceToNow(new Date(completedAt), { addSuffix: true })}
      </Button>
    );
  }

  return (
    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
      {mutation.isPending ? "Marking…" : "Mark as complete"}
    </Button>
  );
}
