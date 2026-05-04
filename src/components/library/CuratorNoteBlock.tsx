import Avatar from "@/components/Avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface Props { note: string; authorId: string | null; }

export default function CuratorNoteBlock({ note, authorId }: Props) {
  const { data: author } = useQuery({
    queryKey: ["archiveAuthor", authorId],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("full_name").eq("id", authorId!).maybeSingle();
      return data as { full_name: string } | null;
    },
    enabled: !!authorId,
    staleTime: 5 * 60_000,
  });

  return (
    <blockquote className="border-l-4 border-primary/40 bg-muted/40 rounded-r-md p-3 space-y-2">
      <p className="text-sm italic text-foreground">"{note}"</p>
      {authorId && (
        <div className="flex items-center gap-2">
          <Avatar userId={authorId} size="sm" />
          {author && <p className="text-xs font-medium text-muted-foreground">{author.full_name}</p>}
        </div>
      )}
    </blockquote>
  );
}