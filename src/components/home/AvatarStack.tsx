import Avatar from "@/components/Avatar";

interface AvatarStackProps {
  userIds: string[];
  max?: number;
  totalCount?: number;
}

export default function AvatarStack({ userIds, max = 5, totalCount }: AvatarStackProps) {
  const visible = userIds.slice(0, Math.max(0, max));
  const total = totalCount ?? userIds.length;
  const remaining = total - visible.length;
  const overlap = 18;
  const mask = "radial-gradient(circle 25px at 54px 24px, transparent 99%, black 100%)";

  return (
    <div className="flex items-center">
      {visible.map((id, i) => {
        const isLast = i === visible.length - 1;
        return (
          <div
            key={id}
            className="rounded-full shrink-0"
            style={{
              marginLeft: i === 0 ? 0 : -overlap,
              WebkitMaskImage: !isLast ? mask : undefined,
              maskImage: !isLast ? mask : undefined,
            }}
          >
            <Avatar userId={id} size="md" />
          </div>
        );
      })}
      {remaining > 0 && (
        <div className="ml-2 px-2 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
          +{remaining} more
        </div>
      )}
    </div>
  );
}