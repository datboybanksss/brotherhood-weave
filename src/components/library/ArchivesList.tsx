import { useQuery } from "@tanstack/react-query";
import { getArchives } from "@/api/archives";
import ArchiveRow from "./ArchiveRow";
import { Library } from "lucide-react";

export default function ArchivesList() {
  const { data: archives } = useQuery({
    queryKey: ["archives"],
    queryFn: getArchives,
  });

  if (!archives?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <Library className="h-8 w-8" />
        <p className="text-sm">No recorded meetings yet. Check back after the first meeting.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {archives.map((a) => (
        <ArchiveRow key={a.id} archive={a} />
      ))}
    </div>
  );
}
