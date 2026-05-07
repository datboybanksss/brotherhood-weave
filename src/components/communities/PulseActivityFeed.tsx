import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useBrotherhoodFeed } from "@/hooks/useBrotherhoodFeed";
import ActivityFeedRow from "@/components/fitness/ActivityFeedRow";

export default function PulseActivityFeed() {
  const { data, isLoading } = useBrotherhoodFeed(8);
  const items = data ?? [];
  if (isLoading || items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-stroke-hairline bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <p className="text-xs uppercase tracking-wide text-text-muted font-medium">Brothers are moving</p>
        <Link to="/fitness" className="text-xs text-brand-royal flex items-center gap-0.5 hover:opacity-80">
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="px-4 pb-4 space-y-3">
        {items.map((it) => (
          <ActivityFeedRow key={`${it.kind}-${it.id}`} item={it} />
        ))}
      </div>
    </div>
  );
}
