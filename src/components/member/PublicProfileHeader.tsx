import Avatar from "@/components/Avatar";
import TierBadge from "@/components/TierBadge";
import { format, formatDistanceToNow } from "date-fns";
import type { PublicMember } from "@/api/members";

interface Props { member: PublicMember; primaryDept: string | null }

function PresenceText({ lastSeenAt }: { lastSeenAt: string | null }) {
  if (!lastSeenAt) return null;
  const isOnline = Date.now() - new Date(lastSeenAt).getTime() < 2 * 60_000;
  return (
    <p className={`text-xs font-medium ${isOnline ? "text-green-500" : "text-muted-foreground"}`}>
      {isOnline ? "Online now" : `Last seen ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`}
    </p>
  );
}

export default function PublicProfileHeader({ member, primaryDept }: Props) {
  return (
    <div className="flex flex-col items-center text-center space-y-2">
      <Avatar userId={member.id} size="xl" showStatus />
      <h1 className="text-xl font-bold text-foreground">{member.full_name}</h1>
      {member.tier_id && <TierBadge tierId={member.tier_id} />}
      {primaryDept && <p className="text-xs text-muted-foreground">{primaryDept}</p>}
      <PresenceText lastSeenAt={member.last_seen_at} />
      {member.membership_started_at && (
        <p className="text-xs text-muted-foreground">
          Member since {format(new Date(member.membership_started_at), "MMM yyyy")}
        </p>
      )}
    </div>
  );
}
