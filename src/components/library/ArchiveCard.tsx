import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ARCHIVE_DOMAINS, CONTENT_TYPE_LABEL, type ArchiveContentType, type ArchiveDomain } from "@/lib/archive-domains";
import ArchiveCoverPlaceholder from "./ArchiveCoverPlaceholder";

interface Archive {
  id: string; title: string; content_type: ArchiveContentType;
  domain: ArchiveDomain | null; cover_url: string | null;
  curator_note: string | null; read_time_minutes: number | null;
  created_by: string | null;
}

export default function ArchiveCard({ archive }: { archive: Archive }) {
  const navigate = useNavigate();
  const meta = archive.domain ? ARCHIVE_DOMAINS[archive.domain] : null;

  const { data: author } = useQuery({
    queryKey: ["archiveAuthor", archive.created_by],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("full_name").eq("id", archive.created_by!).maybeSingle();
      return data as { full_name: string } | null;
    },
    enabled: !!archive.created_by,
    staleTime: 5 * 60_000,
  });

  const firstName = author?.full_name?.split(" ")[0];
  const verb = archive.content_type === "video" ? "watch" : "read";

  return (
    <button
      onClick={() => navigate(`/library/archive/${archive.id}`)}
      className="text-left rounded-lg border border-brand-royal/20 overflow-hidden bg-card hover:bg-brand-royal-tint transition-colors flex flex-col"
    >
      <div className="aspect-video w-full bg-muted overflow-hidden">
        {archive.cover_url ? (
          <img src={archive.cover_url} alt={archive.title} className="w-full h-full object-cover" />
        ) : (
          <ArchiveCoverPlaceholder title={archive.title} contentType={archive.content_type} domain={archive.domain} />
        )}
      </div>
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-foreground/5 text-foreground">
            {CONTENT_TYPE_LABEL[archive.content_type]}
          </span>
          {meta && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
          )}
        </div>
        <h3 className="font-semibold text-sm text-foreground line-clamp-2">{archive.title}</h3>
        {archive.curator_note && (
          <p className="text-xs italic text-muted-foreground line-clamp-2">"{archive.curator_note}"</p>
        )}
        {(firstName || archive.read_time_minutes) && (
          <p className="text-[11px] text-muted-foreground mt-auto">
            {firstName}
            {firstName && archive.read_time_minutes ? " · " : ""}
            {archive.read_time_minutes ? `${archive.read_time_minutes} min ${verb}` : ""}
          </p>
        )}
      </div>
    </button>
  );
}
