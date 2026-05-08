import { useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBrotherhoodFeed } from "@/hooks/useBrotherhoodFeed";
import { sastDateKey } from "@/api/fitness";
import ActivityFeedRow from "./ActivityFeedRow";
import type { FeedItem } from "@/hooks/useBrotherhoodFeed";

function getGroup(item: FeedItem) {
  const today = new Date(`${sastDateKey()}T00:00:00`);
  const itemDay = new Date(`${sastDateKey(new Date(item.ts))}T00:00:00`);
  const diff = differenceInCalendarDays(today, itemDay);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return "Earlier";
}

function groupItems(items: FeedItem[]) {
  return ["Today", "Yesterday", "Earlier"].map((label) => ({
    label,
    items: items.filter((item) => getGroup(item) === label),
  })).filter((group) => group.items.length > 0);
}

export default function BrotherhoodActivityFeed() {
  const [limit, setLimit] = useState(15);
  const { data, isLoading } = useBrotherhoodFeed(60);
  const items = (data ?? []).slice(0, limit);
  const groups = groupItems(items);
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">The brotherhood is moving</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && items.length === 0 && <p className="text-sm text-muted-foreground">Be the first to move. Tap + to log your first activity.</p>}
        {groups.map((group) => {
          const moverCount = new Set(group.items.map((item) => item.user_id)).size;
          return (
            <section key={group.label} className="space-y-2">
              <div className="flex items-center justify-between border-b pb-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h3>
                <span className="text-[11px] text-muted-foreground">
                  {moverCount} {moverCount === 1 ? "brother" : "brothers"} moved
                </span>
              </div>
              <div className="space-y-1">
                {group.items.map((it) => <ActivityFeedRow key={`${it.kind}-${it.id}`} item={it} />)}
              </div>
            </section>
          );
        })}
        {data && data.length > limit && <Button variant="ghost" size="sm" className="w-full" onClick={() => setLimit((n) => n + 15)}>Load more</Button>}
      </CardContent>
    </Card>
  );
}
