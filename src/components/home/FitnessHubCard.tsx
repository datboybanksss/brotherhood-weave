import { Dumbbell } from "lucide-react";

export default function FitnessHubCard() {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="h-9 w-9 bg-brand-royal-tint flex items-center justify-center">
        <Dumbbell className="h-5 w-5 text-brand-royal" />
      </div>
      <div>
        <div className="text-heading-md font-semibold text-foreground">Fitness</div>
        <div className="text-body-md text-muted-foreground mt-0.5">Log reps, climb up.</div>
      </div>
    </div>
  );
}
