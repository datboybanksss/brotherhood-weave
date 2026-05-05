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
  // Avatar md: 40 + ring(2)*2 + gap(4) = 48px container, overlap 12px
  const overlap = 18;
  const tile = 48;
  // Cut a circle out of the right side of each non-last avatar so the next
  // avatar's ring doesn't overlay the previous one's ring.
  const cutRadius = tile / 2 + 1;
  const cutCx = tile - overlap + tile / 2;
  const cutCy = tile / 2;
  const mask = `radial-gradient(circle ${cutRadius}px at ${cutCx}px ${cutCy}px, transparent 99%, black 100%)`;

  return (
    <div className="flex items-center">
      {visible.map((id, i) => {
        const isLast = i === visible.length - 1;
        return (
          <div
            key={id}
            className="rounded-full"
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