import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMemberSubmissions } from "@/hooks/useMemberSubmissions";
import { useMemberMonthlyStats } from "@/hooks/useMyMonthlyStats";
import { currentMonthStartISO } from "@/api/fitness";
import FitnessStats from "./FitnessStats";
import FitnessActivityRow from "./FitnessActivityRow";

export default function FitnessSection({ userId }: { userId: string }) {
  const [showAll, setShowAll] = useState(false);
  const { data: submissions } = useMemberSubmissions(userId, 50);
  const { data: stats } = useMemberMonthlyStats(userId, currentMonthStartISO());

  if (!submissions || submissions.length === 0) return null;
  const visible = showAll ? submissions : submissions.slice(0, 10);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Fitness</h2>
      {stats && (
        <FitnessStats
          totalReps={stats.total_reps}
          submissionCount={stats.submission_count}
          streak={stats.streak}
          rank={stats.rank}
        />
      )}
      <div>
        {visible.map((s) => <FitnessActivityRow key={s.id} s={s} />)}
        {submissions.length > 10 && (
          <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show recent only" : `View all activity (${submissions.length})`}
          </Button>
        )}
      </div>
    </div>
  );
}
