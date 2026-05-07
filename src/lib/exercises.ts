export type ExerciseKey =
  | "push_ups" | "squats" | "sit_ups" | "pull_ups"
  | "plank_seconds" | "wall_sit_seconds"
  | "burpees" | "lunges" | "mountain_climbers";

export interface ExerciseMeta {
  key: ExerciseKey;
  label: string;
  unit: "reps" | "seconds";
  emoji: { cp: string; alt: string };
}

export const EXERCISES: ExerciseMeta[] = [
  { key: "push_ups",          label: "Push-ups",          unit: "reps",    emoji: { cp: "1f4aa", alt: "Bicep" } },
  { key: "squats",            label: "Squats",            unit: "reps",    emoji: { cp: "1f3cb-fe0f", alt: "Weight lifter" } },
  { key: "sit_ups",           label: "Sit-ups",           unit: "reps",    emoji: { cp: "1f938", alt: "Cartwheel" } },
  { key: "pull_ups",          label: "Pull-ups",          unit: "reps",    emoji: { cp: "1f4aa", alt: "Bicep" } },
  { key: "plank_seconds",     label: "Plank",             unit: "seconds", emoji: { cp: "23f1-fe0f", alt: "Stopwatch" } },
  { key: "wall_sit_seconds",  label: "Wall sit",          unit: "seconds", emoji: { cp: "23f1-fe0f", alt: "Stopwatch" } },
  { key: "burpees",           label: "Burpees",           unit: "reps",    emoji: { cp: "26a1", alt: "Lightning" } },
  { key: "lunges",            label: "Lunges",            unit: "reps",    emoji: { cp: "1f463", alt: "Footprints" } },
  { key: "mountain_climbers", label: "Mountain climbers", unit: "reps",    emoji: { cp: "1f3d4-fe0f", alt: "Mountain" } },
];

export const EXERCISE_MAP: Record<ExerciseKey, ExerciseMeta> = Object.fromEntries(
  EXERCISES.map((e) => [e.key, e]),
) as Record<ExerciseKey, ExerciseMeta>;

export const isTimeBased = (k: ExerciseKey) => EXERCISE_MAP[k].unit === "seconds";

export const formatRepsLabel = (k: ExerciseKey, reps: number) =>
  isTimeBased(k) ? `${reps}s` : `${reps} reps`;
