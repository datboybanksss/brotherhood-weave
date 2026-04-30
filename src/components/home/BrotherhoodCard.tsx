import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function BrotherhoodCard() {
  const nav = useNavigate();
  const { data: count } = useQuery({
    queryKey: ["brotherhoodCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "paid")
        .is("rejected_at", null);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  return (
    <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => nav("/brotherhood")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />Brotherhood
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {count ?? 0} {count === 1 ? "brother" : "brothers"}
        </p>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}