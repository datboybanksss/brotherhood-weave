import Avatar from "@/components/Avatar";

interface AvatarStackProps {
  userIds: string[];
  max?: number;
  totalCount?: number;
}

export default function AvatarStack({ userIds, max = 5, totalCount }: AvatarStackProps) {
  const visible = userIds.slice(0, max);
  const total = totalCount ?? userIds.length;
  const remaining = total - visible.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-3">
        {visible.map((id) => (
          <div key={id} className="rounded-full ring-2 ring-card">
            <Avatar userId={id} size="md" />
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <div className="ml-2 px-2 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
          +{remaining} more
        </div>
      )}
    </div>
  );
}