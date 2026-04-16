import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ModuleCard from "@/components/library/ModuleCard";

export default function Library() {
  const { data: appUser } = useCurrentUser();

  const { data: modules } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*, tiers:required_tier_id(name, display_order)")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const userTierOrder = appUser?.tiers?.display_order ?? 0;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-foreground">Library</h1>
      {modules?.map((mod) => {
        const requiredOrder = (mod.tiers as unknown as { display_order: number } | null)?.display_order ?? 0;
        const locked = userTierOrder < requiredOrder;
        return (
          <ModuleCard
            key={mod.id}
            title={mod.title}
            description={mod.description ?? ""}
            locked={locked}
          />
        );
      })}
    </div>
  );
}
