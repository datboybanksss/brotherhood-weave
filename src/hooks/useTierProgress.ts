import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export interface TierProgress {
  meetingsAttended: number;
  moduleCompleted: boolean;
  departmentCount: number;
  daysMember: number;
}

export function useTierProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tierProgress", user?.id],
    queryFn: async (): Promise<TierProgress> => {
      const uid = user!.id;

      const [attendanceRes, progressRes, deptRes, userRes] = await Promise.all([
        supabase.from("meeting_attendance").select("meeting_id").eq("user_id", uid).eq("attended", true),
        supabase.from("user_module_progress").select("completed_at, module_id").eq("user_id", uid),
        supabase.from("user_departments").select("department_id").eq("user_id", uid),
        supabase.from("users").select("membership_started_at").eq("id", uid).single(),
      ]);

      const meetingsAttended = attendanceRes.data?.length ?? 0;

      // Check if identity-alchemy module is completed
      const moduleCompleted = progressRes.data?.some((p) => p.completed_at !== null) ?? false;

      const departmentCount = deptRes.data?.length ?? 0;

      const memberSince = userRes.data?.membership_started_at;
      const daysMember = memberSince
        ? Math.floor((Date.now() - new Date(memberSince).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return { meetingsAttended, moduleCompleted, departmentCount, daysMember };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}
