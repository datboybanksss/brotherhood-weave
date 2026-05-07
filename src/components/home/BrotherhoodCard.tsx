import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import AvatarStack from "@/components/home/AvatarStack";
import brotherhoodIcon from "@/assets/brotherhood-icon.png";

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
    queryKey: ["brotherhoodStackAvatars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, is_admin, created_at")
        .eq("payment_status", "paid")
        .is("rejected_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = (data ?? []) as { id: string; is_admin: boolean | null; created_at: string }[];
      const founders = rows
        .filter((r) => r.is_admin)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      const rest = rows.filter((r) => !r.is_admin);
      return [...founders, ...rest].map((r) => r.id);
    },
    staleTime: 60_000,
  });

  const total = count ?? 0;
  return (
    <div className="flex h-full flex-col gap-2 md:gap-3">
      <div className="flex items-center gap-1.5 text-label font-medium uppercase text-text-muted">
        <img src={brotherhoodIcon} alt="" className="h-4 w-4 sm:h-5 sm:w-5 object-contain" /> Brotherhood
      </div>
      {recent && recent.length > 0 && (
        <div className="hidden md:block">
          <AvatarStack userIds={recent} max={5} totalCount={total} />
        </div>
      )}
      <div className="text-body-md text-text-muted mt-auto">
        {total} {total === 1 ? "brother" : "brothers"}
      </div>
    </div>
  );
}