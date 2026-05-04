import { useNavigate } from "react-router-dom";

interface Props { bio: string | null; isOwnProfile?: boolean }

export default function BioCard({ bio, isOwnProfile = false }: Props) {
  const navigate = useNavigate();
  if (!bio) {
    if (isOwnProfile) {
      return (
        <button
          onClick={() => navigate("/account#bio")}
          className="w-full rounded-lg border border-dashed border-border p-4 text-left text-sm text-muted-foreground italic hover:border-primary hover:text-foreground transition-colors"
        >
          + Add a bio
        </button>
      );
    }
    return <p className="text-sm text-muted-foreground italic">No bio yet.</p>;
  }
  return (
    <div className="rounded-lg border-l-4 border-primary bg-muted/30 p-4">
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{bio}</p>
    </div>
  );
}
