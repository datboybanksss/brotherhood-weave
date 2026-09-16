import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface TierBadgeProps {
  tierId: string;
}

export default function TierBadge({ tierId }: TierBadgeProps) {
  const { data } = useQuery({
    queryKey: ["tier", tierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tiers")
        .select("name, ring_color")
        .eq("id", tierId)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60_000,
  });

  if (!data) return null;

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: data.ring_color + "20", color: data.ring_color, border: `1px solid ${data.ring_color}` }}
    >
      {data.name}
    </span>
  );
}
