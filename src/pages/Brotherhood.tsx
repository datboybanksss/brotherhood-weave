import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import DepartmentFilterBar from "@/components/brotherhood/DepartmentFilterBar";
import MemberRow from "@/components/brotherhood/MemberRow";

export default function Brotherhood() {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const { data: members } = useQuery({
    queryKey: ["brotherhood"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, avatar_url, tier_id, title, user_departments(department_id, is_primary, departments(name))")
        .eq("payment_status", "paid");
      if (error) throw error;
      return data;
    },
  });

  const filtered = selectedDept
    ? members?.filter((m) =>
        (m.user_departments as unknown as Array<{ department_id: string }>)?.some(
          (d) => d.department_id === selectedDept
        )
      )
    : members;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-background z-10 p-4 pb-2 border-b border-border">
        <h1 className="text-xl font-bold text-foreground mb-3">Brotherhood</h1>
        <DepartmentFilterBar selected={selectedDept} onSelect={setSelectedDept} />
      </div>
      <div className="px-4 space-y-2">
        {filtered?.map((member) => {
          const primaryDept = (
            member.user_departments as unknown as Array<{
              is_primary: boolean;
              departments: { name: string } | null;
            }>
          )?.find((d) => d.is_primary);
          return (
            <MemberRow
              key={member.id}
              userId={member.id}
              fullName={member.full_name}
              title={(member as { title: string | null }).title}
              departmentName={primaryDept?.departments?.name ?? null}
            />
          );
        })}
        {filtered?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No members found</p>
        )}
      </div>
    </div>
  );
}
