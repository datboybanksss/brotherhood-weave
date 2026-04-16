import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getArchive } from "@/api/archives";
import LessonVideoEmbed from "@/components/library/LessonVideoEmbed";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function ArchiveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: archive } = useQuery({
    queryKey: ["archive", id],
    queryFn: () => getArchive(id!),
    enabled: !!id,
  });

  if (!archive) return null;

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate("/library?layer=archives")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <h1 className="text-xl font-bold text-foreground">{archive.title}</h1>
      <p className="text-sm text-muted-foreground">
        Recorded on {format(new Date(archive.recorded_at), "MMMM d, yyyy")}
      </p>
      {archive.description && <p className="text-sm text-muted-foreground">{archive.description}</p>}
      <LessonVideoEmbed url={archive.recording_url} />
    </div>
  );
}
