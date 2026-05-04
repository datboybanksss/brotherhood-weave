import { ARCHIVE_DOMAIN_KEYS, ARCHIVE_DOMAINS, type ArchiveDomain } from "@/lib/archive-domains";

interface Props {
  selected: ArchiveDomain | undefined;
  onSelect: (d: ArchiveDomain | undefined) => void;
}

export default function ArchiveDomainChips({ selected, onSelect }: Props) {
  const base = "shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors";
  const active = "bg-primary text-primary-foreground";
  const inactive = "bg-muted text-muted-foreground hover:bg-accent";
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      <button onClick={() => onSelect(undefined)} className={`${base} ${!selected ? active : inactive}`}>All</button>
      {ARCHIVE_DOMAIN_KEYS.map((d) => (
        <button
          key={d}
          onClick={() => onSelect(selected === d ? undefined : d)}
          className={`${base} ${selected === d ? active : inactive}`}
        >
          {ARCHIVE_DOMAINS[d].label}
        </button>
      ))}
    </div>
  );
}