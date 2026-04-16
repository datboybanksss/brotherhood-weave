import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlaybooks } from "@/api/playbooks";
import PlaybookCard from "./PlaybookCard";
import CategoryFilterChips from "./CategoryFilterChips";

type Category = "money" | "career" | "relationships" | "health" | "mindset" | "craft";

export default function PlaybooksList() {
  const [category, setCategory] = useState<Category | undefined>();

  const { data: playbooks } = useQuery({
    queryKey: ["playbooks", "list", { category }],
    queryFn: () => getPlaybooks(category),
  });

  return (
    <div className="space-y-4">
      <CategoryFilterChips selected={category} onSelect={setCategory} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {playbooks?.map((p) => (
          <PlaybookCard key={p.id} playbook={p} />
        ))}
      </div>
      {playbooks && !playbooks.length && (
        <p className="text-sm text-muted-foreground text-center py-8">No playbooks in this category yet.</p>
      )}
    </div>
  );
}
