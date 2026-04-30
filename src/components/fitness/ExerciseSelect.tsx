import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXERCISES, type ExerciseKey } from "@/lib/exercises";

interface Props { value: ExerciseKey | undefined; onChange: (v: ExerciseKey) => void; }

export default function ExerciseSelect({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ExerciseKey)}>
      <SelectTrigger><SelectValue placeholder="Choose exercise" /></SelectTrigger>
      <SelectContent>
        {EXERCISES.map((e) => {
          const Icon = e.icon;
          return (
            <SelectItem key={e.key} value={e.key}>
              <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4" /> {e.label}</span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}