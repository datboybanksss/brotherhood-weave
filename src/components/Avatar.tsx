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

export default function Avatar({ userId, size = "md", showStatus = false }: AvatarProps) {
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
        .single();
      if (error) throw error;
      return data as { full_name: string; avatar_url: string | null; ring_color: string | null; last_seen_at: string | null };
    },
    staleTime: 5 * 60_000,
  });

  const initials = data?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  const ringColor = data?.ring_color;
  const totalSize = px + ring * 2 + 4;

  const isOnline =
    showStatus && !!data?.last_seen_at
      ? Date.now() - new Date(data.last_seen_at).getTime() < 2 * 60_000
      : false;

  return (
    <div
      className="relative flex items-center justify-center rounded-full shrink-0"
      style={{
        width: totalSize,
        height: totalSize,
        border: ringColor ? `${ring}px solid ${ringColor}` : "none",
      }}
    >
      {data?.avatar_url ? (
        <img
          src={data.avatar_url}
          alt={data.full_name}
          className="rounded-full object-cover"
          style={{ width: px, height: px }}
        />
      ) : (
        <div
          className="rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium"
          style={{ width: px, height: px, fontSize: px * 0.35 }}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-background"
          style={{
            width: dot,
            height: dot,
            backgroundColor: isOnline ? "#22c55e" : "#9ca3af",
          }}
        />
      )}
    </div>
  );
}
