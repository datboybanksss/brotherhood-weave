import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border min-h-[36px] ${
          !selected ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"
        }`}
      >
        All
      </button>
      {departments?.map((dept) => (
        <button
          key={dept.id}
          onClick={() => onSelect(selected === dept.id ? null : dept.id)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border min-h-[36px] ${
            selected === dept.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border"
          }`}
        >
          {dept.name}
        </button>
      ))}
    </div>
  );
}
