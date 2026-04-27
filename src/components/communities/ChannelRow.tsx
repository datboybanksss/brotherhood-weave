import { Link } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { BellOff, Hash, Megaphone, Users as UsersIcon } from "lucide-react";
import type { ChannelListItem } from "@/api/channels";

const ICONS = {
  general: Hash,
  announcements: Megaphone,
  department: UsersIcon,
} as const;

function fmtTime(iso: string) {
  return formatDistanceToNowStrict(new Date(iso)).replace(" minutes", "m").replace(" minute", "m").replace(" hours", "h").replace(" hour", "h").replace(" days", "d").replace(" day", "d");
}

export default function ChannelRow({ channel }: { channel: ChannelListItem }) {
  const Icon = ICONS[channel.channel_type];
  const lm = channel.last_message;
  const preview = lm
    ? lm.deleted_at
      ? "[deleted]"
      : `${lm.sender_name ? lm.sender_name + ": " : ""}${lm.body.slice(0, 60)}`
    : "No messages yet";
  return (
    <Link to={`/communities/${channel.slug}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-foreground truncate">{channel.name}</span>
          {channel.is_muted && <BellOff className="h-3 w-3 text-muted-foreground shrink-0" />}
        </div>
        <p className={`text-sm truncate ${lm?.deleted_at ? "italic text-muted-foreground" : "text-muted-foreground"}`}>{preview}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {lm && <span className="text-xs text-muted-foreground">{fmtTime(lm.created_at)}</span>}
        {channel.unread_count > 0 && (
          <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 min-w-5 text-center">
            {channel.unread_count > 9 ? "9+" : channel.unread_count}
          </span>
        )}
      </div>
    </Link>
  );
}