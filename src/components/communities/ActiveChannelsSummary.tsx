import { Link } from "react-router-dom";
import { Hash, Megaphone, Users as UsersIcon, ChevronRight } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { useMyChannels } from "@/hooks/useMyChannels";

const ICONS = { general: Hash, announcements: Megaphone, department: UsersIcon } as const;

interface Props { onViewAll: () => void; }

export default function ActiveChannelsSummary({ onViewAll }: Props) {
  const { data } = useMyChannels();
  const top = (data ?? []).filter((c) => c.last_message).slice(0, 3);
  if (top.length === 0) return null;

  return (
    <div className="rounded-2xl border border-stroke-hairline bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-xs uppercase tracking-wide text-text-muted font-medium">Active Channels</p>
        <button onClick={onViewAll} className="text-xs text-brand-royal flex items-center gap-0.5 hover:opacity-80">
          See all <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div>
        {top.map((c) => {
          const Icon = ICONS[c.channel_type];
          const lm = c.last_message!;
          const preview = lm.deleted_at ? "[deleted]" : `${lm.sender_name ? lm.sender_name + ": " : ""}${lm.body.slice(0, 50)}`;
          const timeAgo = formatDistanceToNowStrict(new Date(lm.created_at))
            .replace(" minutes", "m").replace(" minute", "m")
            .replace(" hours", "h").replace(" hour", "h")
            .replace(" days", "d").replace(" day", "d");
          return (
            <Link
              key={c.id}
              to={`/communities/${c.slug}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent border-t border-stroke-hairline"
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{c.name}</p>
                <p className="text-xs text-text-muted truncate">{preview}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-text-muted">{timeAgo}</span>
                {c.unread_count > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 min-w-5 text-center">
                    {c.unread_count > 9 ? "9+" : c.unread_count}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
