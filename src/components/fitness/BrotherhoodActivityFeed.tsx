import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBrotherhoodFeed } from "@/hooks/useBrotherhoodFeed";
import ActivityFeedRow from "./ActivityFeedRow";

export default function BrotherhoodActivityFeed() {
  const [limit, setLimit] = useState(15);
  const { data, isLoading } = useBrotherhoodFeed(60);
  const items = (data ?? []).slice(0, limit);
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">The brotherhood is moving</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && items.length === 0 && <p className="text-sm text-muted-foreground">Be the first to move. Tap + to log your first activity.</p>}
        {items.map((it) => <ActivityFeedRow key={`${it.kind}-${it.id}`} item={it} />)}
        {data && data.length > limit && <Button variant="ghost" size="sm" className="w-full" onClick={() => setLimit((n) => n + 15)}>Load more</Button>}
      </CardContent>
    </Card>
  );
}
