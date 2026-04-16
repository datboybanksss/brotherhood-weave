import { useNavigate } from "react-router-dom";
import Avatar from "@/components/Avatar";
import { formatDistanceToNow } from "date-fns";

const categoryColors: Record<string, string> = {
  money: "bg-emerald-500/10 text-emerald-700",
  career: "bg-blue-500/10 text-blue-700",
  relationships: "bg-pink-500/10 text-pink-700",
  health: "bg-orange-500/10 text-orange-700",
  mindset: "bg-purple-500/10 text-purple-700",
  craft: "bg-amber-500/10 text-amber-700",
};

interface Props {
  playbook: {
    slug: string;
    title: string;
    summary: string;
    category: string;
    last_reviewed_at: string;
    author: { id: string; full_name: string } | null;
  };
}

export default function PlaybookCard({ playbook }: Props) {
  const navigate = useNavigate();
  const colorClass = categoryColors[playbook.category] ?? "bg-muted text-muted-foreground";

  return (
    <button
      onClick={() => navigate(`/library/playbook/${playbook.slug}`)}
      className="flex flex-col text-left rounded-lg border border-border p-3 gap-2 hover:bg-accent/50 transition-colors h-full"
    >
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit capitalize ${colorClass}`}>
        {playbook.category}
      </span>
      <h3 className="text-sm font-semibold text-foreground line-clamp-2">{playbook.title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-3 flex-1">{playbook.summary}</p>
      {playbook.author && (
        <div className="flex items-center gap-1.5 mt-auto">
          <Avatar userId={playbook.author.id} size="sm" />
          <span className="text-[10px] text-muted-foreground truncate">{playbook.author.full_name}</span>
        </div>
      )}
    </button>
  );
}
