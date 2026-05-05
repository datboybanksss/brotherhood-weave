import { useQuery } from "@tanstack/react-query";
import { getRecentArchivesForHome, type ArchiveCardItem } from "@/api/home-archives";

export function useRecentArchives() {
  const { data, isLoading } = useQuery({
    queryKey: ["home", "recentArchives"],
    queryFn: getRecentArchivesForHome,
    staleTime: 60_000,
  });
  return { archives: (data ?? []) as ArchiveCardItem[], isLoading };
}