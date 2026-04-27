import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Avatar from "@/components/Avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import { getPairingsForWeek, triggerAssignFullMode } from "@/api/admin-pairings";
import { getCurrentWeekStartSAST } from "@/api/peers";
import { registerStravaWebhook } from "@/api/strava";

function weekOption(offsetWeeks: number): { value: string; label: string } {
  const cur = getCurrentWeekStartSAST();
  const d = new Date(cur + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + offsetWeeks * 7);
  const value = d.toISOString().slice(0, 10);
  const label = offsetWeeks === 0 ? "This week" : offsetWeeks === -1 ? "Last week" : `${Math.abs(offsetWeeks)} weeks ago`;
  return { value, label: `${label} (${format(d, "MMM d")})` };
}

export default function AdminPairings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const options = [weekOption(0), weekOption(-1), weekOption(-2), weekOption(-3)];
  const [week, setWeek] = useState(options[0].value);

  const { data: pairings } = useQuery({
    queryKey: ["adminPairings", week],
    queryFn: () => getPairingsForWeek(week),
  });

  const runMut = useMutation({
    mutationFn: () => triggerAssignFullMode(week),
    onSuccess: (data) => {
      toast.success(`Created ${data?.pairings_created ?? 0} pairings`);
      qc.invalidateQueries({ queryKey: ["adminPairings", week] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stravaMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await registerStravaWebhook();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => toast.success(`Strava webhook: ${data?.status ?? "ok"}`),
    onError: (e: Error) => toast.error(`Strava webhook: ${e.message}`),
  });

  const pairs = pairings?.filter((p) => !p.is_trio) ?? [];
  const trios = pairings?.filter((p) => p.is_trio) ?? [];
  const memberCount = pairs.length * 2 + trios.length * 3;

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate("/me")} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-foreground">Pairings</h1>
        <Select value={week} onValueChange={setWeek}>
          <SelectTrigger className="w-auto"><SelectValue /></SelectTrigger>
          <SelectContent>
            {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground">
        {pairs.length} pair{pairs.length !== 1 && "s"}, {trios.length} trio{trios.length !== 1 && "s"}, {memberCount} members paired this week
      </p>
      <Button size="sm" variant="outline" onClick={() => runMut.mutate()} disabled={runMut.isPending}>
        {runMut.isPending ? "Running..." : "Run full match for this week"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => stravaMut.mutate()} disabled={stravaMut.isPending}>
        {stravaMut.isPending ? "Registering..." : "Register Strava Webhook"}
      </Button>
      <div className="space-y-2">
        {pairings?.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {p.members.map((m, i) => (
                <div key={m.id} className="flex items-center gap-2">
                  {i > 0 && <span className="text-muted-foreground">↔</span>}
                  <Avatar userId={m.id} size="sm" />
                  <span className="text-sm text-foreground">{m.full_name}</span>
                </div>
              ))}
            </div>
            {p.is_trio && <Badge variant="secondary">Trio</Badge>}
          </div>
        ))}
        {pairings?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No pairings for this week.</p>
        )}
      </div>
    </div>
  );
}
