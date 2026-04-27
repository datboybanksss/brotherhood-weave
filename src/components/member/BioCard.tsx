interface Props { bio: string | null }

export default function BioCard({ bio }: Props) {
  if (!bio) {
    return <p className="text-sm text-muted-foreground italic">No bio yet.</p>;
  }
  return (
    <div className="rounded-lg border-l-4 border-primary bg-muted/30 p-4">
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{bio}</p>
    </div>
  );
}
