import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPlaybook } from "@/api/playbooks";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const categoryColors: Record<string, string> = {
  money: "bg-emerald-500/10 text-emerald-700",
  career: "bg-blue-500/10 text-blue-700",
  relationships: "bg-pink-500/10 text-pink-700",
  health: "bg-orange-500/10 text-orange-700",
  mindset: "bg-purple-500/10 text-purple-700",
  craft: "bg-amber-500/10 text-amber-700",
};

export default function PlaybookDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: playbook } = useQuery({
    queryKey: ["playbook", slug],
    queryFn: () => getPlaybook(slug!),
    enabled: !!slug,
  });

  if (!playbook) return null;

  const author = playbook.author as { id: string; full_name: string } | null;
  const colorClass = categoryColors[playbook.category] ?? "bg-muted text-muted-foreground";

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate("/library?layer=playbooks")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${colorClass}`}>
          {playbook.category}
        </span>
      </div>

      <h1 className="text-xl font-bold text-foreground">{playbook.title}</h1>

      {author && (
        <div className="flex items-center gap-2">
          <Avatar userId={author.id} size="md" />
          <div>
            <p className="text-sm font-medium text-foreground">{author.full_name}</p>
            <p className="text-xs text-muted-foreground">
              Last reviewed {format(new Date(playbook.last_reviewed_at), "MMM d, yyyy")}
            </p>
          </div>
        </div>
      )}

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{playbook.body_markdown}</ReactMarkdown>
      </div>

      {playbook.pdf_attachment_url && (
        <a href={playbook.pdf_attachment_url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </a>
      )}
    </div>
  );
}
