import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface Props {
  archive: { id: string; title: string; description: string | null; recorded_at: string };
}

export default function ArchiveRow({ archive }: Props) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/library/archive/${archive.id}`)}
      className="w-full text-left rounded-lg border border-border p-4 space-y-1 hover:bg-accent/50 transition-colors"
    >
      <h3 className="font-semibold text-foreground">{archive.title}</h3>
      {archive.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{archive.description}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Recorded {formatDistanceToNow(new Date(archive.recorded_at), { addSuffix: true })}
      </p>
    </button>
  );
}
