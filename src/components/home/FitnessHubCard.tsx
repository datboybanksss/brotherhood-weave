import { useNavigate } from "react-router-dom";
import { Dumbbell, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function FitnessHubCard() {
  const nav = useNavigate();
  return (
    <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => nav("/fitness")}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Dumbbell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Fitness</div>
          <div className="text-xs text-muted-foreground">Log reps, climb the leaderboard, dodge the forfeit list.</div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
