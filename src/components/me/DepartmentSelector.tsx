import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Star } from "lucide-react";

interface UserDept {
  department_id: string;
  is_primary: boolean;
}

export default function DepartmentSelector() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60_000,
  });

  const { data: userDepts } = useQuery({
    queryKey: ["userDepartments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_departments")
        .select("department_id, is_primary")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as UserDept[];
    },
    enabled: !!user?.id,
  });

  const selected = new Set(userDepts?.map((d) => d.department_id) ?? []);
  const primaryId = userDepts?.find((d) => d.is_primary)?.department_id;

  const toggleDept = useMutation({
    mutationFn: async (deptId: string) => {
      if (selected.has(deptId)) {
        const { error } = await supabase
          .from("user_departments")
          .delete()
          .eq("user_id", user!.id)
          .eq("department_id", deptId);
        if (error) throw error;
      } else {
        if (selected.size >= 3) throw new Error("Maximum 3 departments");
        const isPrimary = selected.size === 0;
        const { error } = await supabase
          .from("user_departments")
          .insert({ user_id: user!.id, department_id: deptId, is_primary: isPrimary });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userDepartments"] });
      queryClient.invalidateQueries({ queryKey: ["tierProgress"] });
      toast.success("Departments updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const setPrimary = useMutation({
    mutationFn: async (deptId: string) => {
      const { error } = await supabase
        .from("user_departments")
        .update({ is_primary: true })
        .eq("user_id", user!.id)
        .eq("department_id", deptId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userDepartments"] });
      toast.success("Primary department set");
    },
  });

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">Departments</h3>
      <p className="text-xs text-muted-foreground">Select up to 3. Tap ★ to set primary.</p>
      <div className="grid grid-cols-2 gap-2">
        {departments?.map((dept) => {
          const isSelected = selected.has(dept.id);
          const isPrimary = primaryId === dept.id;
          const disabled = !isSelected && selected.size >= 3;
          return (
            <div
              key={dept.id}
              className={`relative rounded-lg border p-3 text-sm cursor-pointer min-h-[48px] flex items-center ${
                isSelected ? "border-primary bg-primary/5" : "border-border"
              } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              onClick={() => !disabled && toggleDept.mutate(dept.id)}
            >
              <span className="text-foreground">{dept.name}</span>
              {isSelected && (
                <button
                  className="absolute top-1 right-1 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrimary.mutate(dept.id);
                  }}
                >
                  <Star
                    className={`h-4 w-4 ${isPrimary ? "fill-primary text-primary" : "text-muted-foreground"}`}
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
