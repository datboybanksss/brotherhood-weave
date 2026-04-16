import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const sizes = { sm: 32, md: 40, lg: 64, xl: 96 } as const;
const ringWidths = { sm: 2, md: 2, lg: 3, xl: 3 } as const;

interface AvatarProps {
  userId: string;
  size?: keyof typeof sizes;
}

export default function Avatar({ userId, size = "md" }: AvatarProps) {
  const px = sizes[size];
  const ring = ringWidths[size];

  const { data } = useQuery({
    queryKey: ["avatarUser", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("full_name, avatar_url, tiers(ring_color)")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data as { full_name: string; avatar_url: string | null; tiers: { ring_color: string } | null };
    },
    staleTime: 5 * 60_000,
  });

  const initials = data?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  const ringColor = data?.tiers?.ring_color;
  const totalSize = px + ring * 2 + 4; // 4px gap (2px each side)

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
    </div>
  );
}
