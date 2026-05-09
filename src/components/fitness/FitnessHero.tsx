import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/lib/supabase";
import Avatar from "@/components/Avatar";
import EmojiIcon from "@/components/EmojiIcon";
import { currentMonthStartISO, currentSastMondayISO, getUserStreak, sastDateKey } from "@/api/fitness";
import { getMyWeeklySubmissionCount, getMyRecentSubmissions } from "@/api/submissions";
import LogActivityDialog from "./LogActivityDialog";
import { Button } from "@/components/ui/button";
import { useBrotherhoodFeed } from "@/hooks/useBrotherhoodFeed";
import { Plus } from "lucide-react";
import { formatClubAddressName } from "@/lib/member-names";

const WEEK_GOAL = 3;

type StatsDeltaRow = {
  total_reps?: number | string;
  submission_count?: number | string;
};

export default function FitnessHero() {
  const { user } = useAuth();
  const { data: appUser } = useCurrentUser();
  const month = currentMonthStartISO();
  const weekStart = currentSastMondayISO();
  const monthName = new Date(month).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const todayKey = sastDateKey();

  const { data: stats } = useQuery({
    queryKey: ["statsDelta", user?.id, month],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const [r, streak] = await Promise.all([
        supabase.rpc("get_user_monthly_stats_with_delta", { _user_id: user!.id, month_start: month }),
        getUserStreak(user!.id),
      ]);
      if (r.error) throw r.error;
      const row = ((r.data ?? [])[0] ?? {}) as StatsDeltaRow;
      return {
        reps: Number(row.total_reps ?? 0),
        subs: Number(row.submission_count ?? 0),
        streak,
      };
    },
  });

  const { data: weekCount } = useQuery({
    queryKey: ["myWeeklyCount", weekStart],
    queryFn: () => getMyWeeklySubmissionCount(weekStart),
    staleTime: 30_000,
  });

  const { data: myRecent } = useQuery({
    queryKey: ["myRecentSubmissions"],
    queryFn: () => getMyRecentSubmissions(1),
    staleTime: 30_000,
  });
  const { data: feed } = useBrotherhoodFeed(80);

  const todayMovers = new Set((feed ?? []).filter((item) => sastDateKey(new Date(item.ts)) === todayKey).map((item) => item.user_id));
  const loggedToday = !!user?.id && todayMovers.has(user.id);
  const hasRecentToday = !!myRecent?.[0] && sastDateKey(new Date(myRecent[0].submitted_at)) === todayKey;
  const isDoneToday = loggedToday || hasRecentToday;
  const displayName = formatClubAddressName(appUser?.full_name);
  const streak = stats?.streak ?? 0;
  const count = weekCount ?? 0;
  const filledDots = Math.min(count, WEEK_GOAL);
  const extraDots = count > WEEK_GOAL ? count - WEEK_GOAL : 0;
  const movedCount = todayMovers.size + (!loggedToday && hasRecentToday && user?.id ? 1 : 0);

  return (
    <section className="relative -mx-4 px-4 pt-5 pb-5 mb-3 border-b border-stroke-hairline bg-surface-white">
      <div className="flex items-center gap-3 mb-5">
        <Avatar userId={user?.id ?? ""} size="md" showStatus={false} />
        <div className="flex-1 min-w-0">
          <p className="font-serif italic text-display-h2 text-text-ink leading-tight">{displayName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {streak > 0 ? (
              <>
                <EmojiIcon cp="1f525" alt="Fire" size={13} />
                <span className="text-xs text-muted-foreground">
                  {streak} week{streak === 1 ? "" : "s"} strong
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">{monthName}</span>
            )}
          </div>
        </div>
        <LogActivityDialog trigger={
          <Button size="sm" className="h-8 px-3 gap-1.5 shrink-0 bg-brand-royal text-text-inverse hover:bg-brand-royal-deep">
            <Plus className="h-4 w-4" />
            Log
          </Button>
        } />
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <StatPill label="Reps" value={stats?.reps ?? 0} />
        <StatPill label="Sessions" value={stats?.subs ?? 0} />
        <StatPill label="Streak" value={streak} suffix=" wks" />
      </div>

      <div className="mb-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground">This week</span>
          <span className="text-xs text-muted-foreground">
            {count} / {WEEK_GOAL} min sessions
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: WEEK_GOAL }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 transition-colors duration-200 ${
                i < filledDots ? "bg-brand-royal" : "bg-stroke-hairline"
              }`}
            />
          ))}
          {extraDots > 0 && (
            <div className="h-1.5 w-5 bg-brand-royal/40" />
          )}
        </div>
      </div>

      <div className={`flex items-start gap-2 border px-3 py-2.5 ${
        isDoneToday ? "border-brand-royal/20 bg-brand-royal-tint" : "border-state-danger/30 bg-state-danger/10"
      }`}>
        <EmojiIcon cp={isDoneToday ? "2705" : "26a0-fe0f"} alt={isDoneToday ? "Done" : "Warning"} size={15} className="mt-0.5" />
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${isDoneToday ? "text-brand-royal" : "text-state-danger"}`}>
            {movedCount} {movedCount === 1 ? "brother has" : "brothers have"} moved today. {isDoneToday ? "You're in." : "You haven't."}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {isDoneToday ? "Your name is off today's pressure list." : "Is that your standard?"}
          </p>
        </div>
      </div>
    </section>
  );
}

function StatPill({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="border border-stroke-hairline bg-surface-white p-2.5 text-center">
      <div className="font-mono text-xl font-semibold tabular-nums leading-none text-text-ink">
        {value}
        {suffix && <span className="text-sm font-medium">{suffix}</span>}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-text-muted mt-1">{label}</div>
    </div>
  );
}
