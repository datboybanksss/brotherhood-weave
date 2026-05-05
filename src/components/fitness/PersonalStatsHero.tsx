import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { currentMonthStartISO, getUserStreak } from "@/api/fitness";

export default function PersonalStatsHero() {
  const { user } = useAuth();
  const { data: appUser } = useCurrentUser();
  const month = currentMonthStartISO();
  const monthName = new Date(month).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const { data } = useQuery({
    queryKey: ["statsDelta", user?.id, month],
    enabled: !!user?.id,
    queryFn: async () => {
      const [r, streak] = await Promise.all([
        supabase.rpc("get_user_monthly_stats_with_delta", { _user_id: user!.id, month_start: month }),
        getUserStreak(user!.id),
      ]);
      if (r.error) throw r.error;
      const row = ((r.data ?? [])[0] ?? {}) as {
        total_reps?: number | string;
        submission_count?: number | string;
        prev_total_reps?: number | string;
        prev_submission_count?: number | string;
      };
      return {
        reps: Number(row.total_reps ?? 0), subs: Number(row.submission_count ?? 0),
        prevReps: Number(row.prev_total_reps ?? 0), prevSubs: Number(row.prev_submission_count ?? 0), streak,
      };
    },
  });
  if (!user || !appUser || !data) return null;
  const delta = data.prevReps === 0 && data.prevSubs === 0
    ? "First month logging — keep going"
    : data.reps >= data.prevReps
      ? `Up ${data.prevReps ? Math.round(((data.reps - data.prevReps) / data.prevReps) * 100) : 100}% from last month`
      : `Down ${Math.round(((data.prevReps - data.reps) / data.prevReps) * 100)}% from last month`;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar userId={user.id} size="md" />
        <h2 className="text-base font-semibold">Your fitness in {monthName}</h2>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Reps" value={data.reps} /><Stat label="Submissions" value={data.subs} /><Stat label="Streak (wks)" value={data.streak} />
      </div>
      <p className="text-xs text-muted-foreground">{delta}</p>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return <div className="border border-border rounded-md p-2 text-center"><div className="text-lg font-bold tabular-nums">{value}</div><div className="text-[10px] text-muted-foreground">{label}</div></div>;
}
