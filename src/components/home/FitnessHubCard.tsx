import EmojiIcon from "@/components/EmojiIcon";

export default function FitnessHubCard() {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="h-9 w-9 flex items-center justify-center">
        <EmojiIcon cp="1f4aa" alt="Bicep" size={20} />
      </div>
      <div>
        <div className="text-heading-md font-semibold text-foreground">Fitness</div>
        <div className="text-body-md text-muted-foreground mt-0.5">Log reps, climb up.</div>
      </div>
    </div>
  );
}
