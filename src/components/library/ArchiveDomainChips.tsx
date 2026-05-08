import { ARCHIVE_DOMAIN_KEYS, ARCHIVE_DOMAINS, type ArchiveDomain } from "@/lib/archive-domains";
import { blueChipClassName } from "@/lib/blue-chip-styles";

interface Props {
  selected: ArchiveDomain | undefined;
  onSelect: (d: ArchiveDomain | undefined) => void;
}

export default function ArchiveDomainChips({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      <button onClick={() => onSelect(undefined)} className={blueChipClassName("all", !selected)}>
        All
      </button>
      {ARCHIVE_DOMAIN_KEYS.map((d) => (
        <button
          key={d}
          onClick={() => onSelect(selected === d ? undefined : d)}
          className={blueChipClassName(d, selected === d)}
        >
          {ARCHIVE_DOMAINS[d].label}
        </button>
      ))}
    </div>
  );
}