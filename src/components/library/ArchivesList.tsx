import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getArchives } from "@/api/archives";
import ArchiveCard from "./ArchiveCard";
import ArchiveDomainChips from "./ArchiveDomainChips";
import ArchiveTypeFilter from "./ArchiveTypeFilter";
import { Library } from "lucide-react";
import type { ArchiveContentType, ArchiveDomain } from "@/lib/archive-domains";

export default function ArchivesList() {
  const [domain, setDomain] = useState<ArchiveDomain | undefined>();
  const [type, setType] = useState<ArchiveContentType | "all">("all");

  const { data: archives } = useQuery({ queryKey: ["archives"], queryFn: getArchives });

  const filtered = useMemo(() => {
    if (!archives) return [];
    return archives.filter((a: any) => {
      if (domain && a.domain !== domain) return false;
      if (type !== "all" && a.content_type !== type) return false;
      return true;
    });
  }, [archives, domain, type]);

  return (
    <div className="space-y-4">
      <ArchiveDomainChips selected={domain} onSelect={setDomain} />
      <ArchiveTypeFilter value={type} onChange={setType} />
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <Library className="h-8 w-8" />
          <p className="text-sm">No archive entries match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((a: any) => (
            <ArchiveCard key={a.id} archive={a} />
          ))}
        </div>
      )}
    </div>
  );
}
