import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export function useHeartbeat() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const tick = () =>
      supabase.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [user?.id]);
}
