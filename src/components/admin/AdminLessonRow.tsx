import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLesson } from "@/api/admin-modules";
import { getLessonReleaseStatus } from "@/api/lessons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Lesson {
  id: string;
  title: string;
  is_released: boolean;
  release_date: string | null;
}

export default function AdminLessonRow({ lesson, moduleId }: { lesson: Lesson; moduleId: string }) {
  const qc = useQueryClient();
  const [dateInput, setDateInput] = useState(
    lesson.release_date ? format(new Date(lesson.release_date), "yyyy-MM-dd'T'HH:mm") : ""
  );
  const status = getLessonReleaseStatus(lesson);

  const mut = useMutation({
    mutationFn: (vals: { is_released?: boolean; release_date?: string | null }) =>
      updateLesson(lesson.id, vals),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminModuleLessons", moduleId] });
      toast.success("Updated");
    },
  });

  const badge =
    status === "live"
      ? "bg-green-500/15 text-green-600"
      : status === "scheduled"
      ? "bg-amber-500/15 text-amber-600"
      : "bg-destructive/15 text-destructive";
  const label =
    status === "live"
      ? "Live"
      : status === "scheduled"
      ? `Scheduled: ${format(new Date(lesson.release_date!), "MMM d")}`
      : "Locked";

  return (
    <div className="flex items-center gap-2 p-2 rounded border border-border text-xs">
      <span className="flex-1 truncate text-foreground">{lesson.title}</span>
      <span className={`px-2 py-0.5 rounded-full font-medium ${badge}`}>{label}</span>
      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => mut.mutate({ is_released: !lesson.is_released })}>
        {lesson.is_released ? "Lock" : "Release"}
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" className="h-7 w-7"><CalendarClock className="h-4 w-4" /></Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-2">
          <Input type="datetime-local" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => mut.mutate({ release_date: dateInput ? new Date(dateInput).toISOString() : null })}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setDateInput(""); mut.mutate({ release_date: null }); }}>
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}