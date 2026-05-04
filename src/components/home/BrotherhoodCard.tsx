import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import Avatar from "@/components/Avatar";
import { supabase } from "@/lib/supabase";

export default function BrotherhoodCard() {
  const { data: count } = useQuery({
    queryKey: ["brotherhoodCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "paid")
        .is("rejected_at", null);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  const { data: recent } = useQuery({
    queryKey: ["brotherhoodRecentAvatars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("payment_status", "paid")
        .is("rejected_at", null)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Users className="h-3.5 w-3.5" /> Brotherhood
      </div>
      <div>
        <div className="text-3xl font-bold leading-none text-foreground">{count ?? 0}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {count === 1 ? "brother" : "brothers"}
        </div>
      </div>
      {recent && recent.length > 0 && (
        <div className="flex -space-x-1">
          {recent.map((u) => (
            <div key={u.id} className="rounded-full ring-[3px] ring-card">
              <Avatar userId={u.id} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}