import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DepartmentFilterBar from "@/components/brotherhood/DepartmentFilterBar";
import MemberRow from "@/components/brotherhood/MemberRow";
import FounderCarousel from "@/components/brotherhood/FounderCarousel";
import { founderCards } from "@/config/founderCards";

export default function Brotherhood() {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const { data: members } = useQuery({
    queryKey: ["brotherhood"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, avatar_url, tier_id, title, is_admin, created_at, user_departments(department_id, is_primary, departments(name))")
        .eq("payment_status", "paid")
        .is("rejected_at", null);
      if (error) throw error;
      return data;
    },
  });

  type Member = NonNullable<typeof members>[number];

  const getPrimaryDept = (m: Member) =>
    (m.user_departments as unknown as Array<{ is_primary: boolean; departments: { name: string } | null }>)
      ?.find(d => d.is_primary);

  const founders = (members ?? [])
    .filter(m => m.is_admin)
    .map(m => ({ ...m, ...founderCards[m.full_name] }));

  const recentMembers = [...(members ?? [])]
    .filter(m => !m.is_admin)
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 3);

  const filtered = (members ?? []).filter(m => {
    const matchesDept = !selectedDept ||
      (m.user_departments as unknown as Array<{ department_id: string }>)
        ?.some(d => d.department_id === selectedDept);
    const matchesSearch = !search || m.full_name?.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="pb-10">
      {/* Sticky header with title + search */}
      <div className="sticky top-0 bg-background z-10 px-5 pt-5 pb-4 border-b border-stroke-hairline space-y-3">
        <h1 className="font-serif italic text-display-h1 text-foreground">Brotherhood</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint pointer-events-none" />
          <input
            type="search"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pl-9 pr-3 text-body-md bg-white border border-stroke-hairline focus:border-brand-royal focus:outline-none rounded-none placeholder:text-text-faint"
          />
        </div>
      </div>

      {/* Founders carousel */}
      {founders.length > 0 && (
        <section className="mt-6">
          <p className="text-label uppercase text-text-muted px-5 mb-4">The Club Founders</p>
          <FounderCarousel founders={founders} />
        </section>
      )}

      {/* Recently joined */}
      {recentMembers.length > 0 && (
        <section className="mt-6 px-5 space-y-2">
          <p className="text-label uppercase text-text-muted mb-3">Recently Joined</p>
          {recentMembers.map(m => (
            <MemberRow
              key={m.id}
              userId={m.id}
              fullName={m.full_name}
              title={(m as unknown as { title: string | null }).title}
              departmentName={getPrimaryDept(m)?.departments?.name ?? null}
            />
          ))}
        </section>
      )}

      {/* All members */}
      <section className="mt-6">
        <div className="px-5 mb-3">
          <p className="text-label uppercase text-text-muted mb-3">All Members</p>
          <DepartmentFilterBar selected={selectedDept} onSelect={setSelectedDept} />
        </div>
        <div className="px-5 space-y-2">
          {filtered.map(m => (
            <MemberRow
              key={m.id}
              userId={m.id}
              fullName={m.full_name}
              title={(m as unknown as { title: string | null }).title}
              departmentName={getPrimaryDept(m)?.departments?.name ?? null}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-body-md text-text-muted text-center py-8">No members found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
