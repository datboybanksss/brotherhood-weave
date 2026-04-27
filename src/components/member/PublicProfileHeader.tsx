import Avatar from "@/components/Avatar";
import TierBadge from "@/components/TierBadge";
import { format } from "date-fns";
import type { PublicMember } from "@/api/members";

interface Props { member: PublicMember; primaryDept: string | null }

export default function PublicProfileHeader({ member, primaryDept }: Props) {
  return (
    <div className="flex flex-col items-center text-center space-y-2">
      <Avatar userId={member.id} size="xl" />
      <h1 className="text-xl font-bold text-foreground">{member.full_name}</h1>
      {member.tier_id && <TierBadge tierId={member.tier_id} />}
      {primaryDept && <p className="text-xs text-muted-foreground">{primaryDept}</p>}
      {member.membership_started_at && (
        <p className="text-xs text-muted-foreground">
          Member since {format(new Date(member.membership_started_at), "MMM yyyy")}
        </p>
      )}
    </div>
  );
}
