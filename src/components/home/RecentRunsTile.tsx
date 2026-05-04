import { Footprints } from "lucide-react";
import RecentRunsFeed from "./RecentRunsFeed";

export default function RecentRunsTile() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Footprints className="h-3.5 w-3.5" /> Latest runs
        </div>
        <span className="text-xs text-primary">View all</span>
      </div>
      <RecentRunsFeed />
    </div>
  );
}