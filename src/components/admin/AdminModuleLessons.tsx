import { useQuery } from "@tanstack/react-query";
import { getModuleLessons } from "@/api/admin-modules";
import AdminLessonRow from "./AdminLessonRow";

export default function AdminModuleLessons({ moduleId }: { moduleId: string }) {
  const { data: lessons } = useQuery({
    queryKey: ["adminModuleLessons", moduleId],
    queryFn: () => getModuleLessons(moduleId),
  });

  if (!lessons?.length) {
    return <p className="text-xs text-muted-foreground py-2">No lessons yet.</p>;
  }
  return (
    <div className="space-y-1.5 pt-2">
      {lessons.map((l) => (
        <AdminLessonRow
          key={l.id}
          moduleId={moduleId}
          lesson={{
            id: l.id,
            title: l.title,
            is_released: (l as { is_released: boolean }).is_released,
            release_date: (l as { release_date: string | null }).release_date,
          }}
        />
      ))}
    </div>
  );
}