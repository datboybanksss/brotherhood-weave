import { useNavigate } from "react-router-dom";
import { Dumbbell } from "lucide-react";

export default function FitnessLink() {
  const nav = useNavigate();
  return (
    <button
      onClick={() => nav("/fitness")}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
    >
      <Dumbbell className="h-4 w-4" /> Fitness
    </button>
  );
}
