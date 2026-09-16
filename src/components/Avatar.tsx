import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const sizes = { sm: 32, md: 40, lg: 64, xl: 96 } as const;
const ringWidths = { sm: 2, md: 2, lg: 3, xl: 3 } as const;
const dotSizes = { sm: 8, md: 10, lg: 12, xl: 14 } as const;

interface AvatarProps {
  userId: string;
  size?: keyof typeof sizes;
  showStatus?: boolean;
}

export default function Avatar({ userId, size = "md", showStatus = true }: AvatarProps) {
  const [now, setNow] = useState(Date.now);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const px = sizes[size];
  const ring = ringWidths[size];
  const dot = dotSizes[size];

  const { data } = useQuery({
    queryKey: ["avatarUser", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_avatars")
        .select("full_name, avatar_url, ring_color, last_seen_at")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const initials = data?.full_name
    ?.trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const ringColor = data?.ring_color;
  const totalSize = px + ring * 2 + 4;

  const lastSeen = data?.last_seen_at ? Date.parse(data.last_seen_at) : NaN;
  const isOnline = showStatus && now >= lastSeen && now - lastSeen < 2 * 60_000;

  // Expire presence even while the five-minute display lookup remains cached.
  useEffect(() => {
    setNow(Date.now());
    if (!showStatus || !Number.isFinite(lastSeen)) return;
    const delay = lastSeen + 2 * 60_000 - Date.now();
    if (delay <= 0) return;
    const timer = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(timer);
  }, [lastSeen, showStatus]);

  return (
    <div
      className="relative flex items-center justify-center rounded-full shrink-0"
      style={{
        width: totalSize,
        height: totalSize,
        ...(ringColor ? { border: `${ring}px solid ${ringColor}` } : {}),
      }}
    >
      {data?.avatar_url && failedUrl !== data.avatar_url ? (
        <img
          src={data.avatar_url}
          alt={data.full_name ?? "Member"}
          onError={() => setFailedUrl(data.avatar_url)}
          className="rounded-full object-cover"
          style={{ width: px, height: px }}
        />
      ) : (
        <div
          className="rounded-full bg-muted flex items-center justify-center text-muted-foreground font-sans font-semibold"
          style={{ width: px, height: px, fontSize: px * 0.35 }}
        >
          {initials}
        </div>
      )}
      {showStatus && isOnline && (
        <span
          role="status"
          aria-label="Online"
          className="absolute bottom-0 right-0 rounded-full border-2 border-background"
          style={{
            width: dot,
            height: dot,
            backgroundColor: "var(--avatar-presence)",
          }}
        />
      )}
    </div>
  );
}
