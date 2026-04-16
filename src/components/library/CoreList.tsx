import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ModuleCard from "./ModuleCard";

export default function CoreList() {
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

  const { data: progress } = useQuery({
    queryKey: ["moduleProgress", appUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_module_progress")
        .select("*")
        .eq("user_id", appUser!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!appUser?.id,
  });

  const userTierOrder = appUser?.tiers?.display_order ?? 0;

  return (
    <div className="space-y-4">
      {modules?.map((mod) => {
        const requiredOrder = (mod.tiers as unknown as { display_order: number } | null)?.display_order ?? 0;
        const requiredName = (mod.tiers as unknown as { name: string } | null)?.name;
        const locked = userTierOrder < requiredOrder;
        const mp = progress?.find((p) => p.module_id === mod.id);
        return (
          <ModuleCard
            key={mod.id}
            slug={mod.slug}
            title={mod.title}
            description={mod.description ?? ""}
            locked={locked}
            requiredTierName={requiredName ?? undefined}
            lessonsCompleted={mp?.lessons_completed ?? 0}
            totalLessons={6}
          />
        );
      })}
    </div>
  );
}
