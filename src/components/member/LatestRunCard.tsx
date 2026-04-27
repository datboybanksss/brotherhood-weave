import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Zap, Footprints, CheckCircle2 } from "lucide-react";
import { getLatestRunForMember } from "@/api/workouts";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  userId: string;
}

export default function LatestRunCard({ userId }: Props) {
  const { data: run, isLoading } = useQuery({
    queryKey: ["memberLatestRun", userId],
    queryFn: () => getLatestRunForMember(userId),
  });

  if (isLoading || !run) return null;

  const Icon = run.activity_type?.toLowerCase() === "walk" ? Footprints : Zap;
  const isStrava = run.verified_via === "strava";

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <Icon className="h-4 w-4" />
        Latest Run
      </h2>
      <Card>
        <CardContent className="p-4 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-foreground">{run.distance_km} km</span>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>{format(new Date(run.ran_at), "MMM d, yyyy")}</span>
              {isStrava && (
                <span className="flex items-center gap-1 text-[hsl(24_95%_53%)]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-xs">via Strava</span>
                </span>
              )}
            </div>
          </div>
          {run.note && <p className="text-sm italic text-muted-foreground">{run.note}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
