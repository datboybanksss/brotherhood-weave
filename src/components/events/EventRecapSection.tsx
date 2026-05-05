import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEventRecap } from "@/hooks/useEvent";

export default function EventRecapSection({ eventId }: { eventId: string }) {
  const { data } = useEventRecap(eventId);
  if (!data) return null;
  const author = (data as any).users?.full_name ?? "Admin";
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">Recap by {author}</h3>
      {data.cover_url && <img src={data.cover_url} alt="recap cover" className="w-full rounded-md" />}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.body_markdown ?? ""}</ReactMarkdown>
      </div>
      <Link to={`/library/archive/${data.id}`} className="text-sm text-primary underline">Read in Archives →</Link>
    </div>
  );
}
