import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { blueChipClassName } from "@/lib/blue-chip-styles";

interface DepartmentFilterBarProps {
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export default function DepartmentFilterBar({ selected, onSelect }: DepartmentFilterBarProps) {
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60_000,
  });

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
      <button
        onClick={() => onSelect(null)}
        className={blueChipClassName("all", !selected)}
      >
        All
      </button>
      {departments?.map((dept) => (
        <button
          key={dept.id}
          onClick={() => onSelect(selected === dept.id ? null : dept.id)}
          className={blueChipClassName(dept.id, selected === dept.id)}
        >
          {dept.name}
        </button>
      ))}
    </div>
  );
}
