import { Activity, Dumbbell, Footprints, Timer, Mountain, Zap, ArrowDownUp, ArrowUp, ArrowDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ExerciseKey =
  | "push_ups" | "squats" | "sit_ups" | "pull_ups"
  | "plank_seconds" | "wall_sit_seconds"
  | "burpees" | "lunges" | "mountain_climbers";

export interface ExerciseMeta {
  key: ExerciseKey;
  label: string;
  unit: "reps" | "seconds";
  icon: LucideIcon;
}

export const EXERCISES: ExerciseMeta[] = [
  { key: "push_ups",          label: "Push-ups",          unit: "reps",    icon: ArrowDownUp },
  { key: "squats",            label: "Squats",            unit: "reps",    icon: ArrowDown },
  { key: "sit_ups",           label: "Sit-ups",           unit: "reps",    icon: ArrowUp },
  { key: "pull_ups",          label: "Pull-ups",          unit: "reps",    icon: Dumbbell },
  { key: "plank_seconds",     label: "Plank",             unit: "seconds", icon: Timer },
  { key: "wall_sit_seconds",  label: "Wall sit",          unit: "seconds", icon: Timer },
  { key: "burpees",           label: "Burpees",           unit: "reps",    icon: Zap },
  { key: "lunges",            label: "Lunges",            unit: "reps",    icon: Footprints },
  { key: "mountain_climbers", label: "Mountain climbers", unit: "reps",    icon: Mountain },
];

export const EXERCISE_MAP: Record<ExerciseKey, ExerciseMeta> = Object.fromEntries(
  EXERCISES.map((e) => [e.key, e]),
) as Record<ExerciseKey, ExerciseMeta>;

export const isTimeBased = (k: ExerciseKey) => EXERCISE_MAP[k].unit === "seconds";

export const formatRepsLabel = (k: ExerciseKey, reps: number) =>
  isTimeBased(k) ? `${reps}s` : `${reps} reps`;

export function exerciseIcon(k: ExerciseKey) {
  return EXERCISE_MAP[k]?.icon ?? Activity;
}