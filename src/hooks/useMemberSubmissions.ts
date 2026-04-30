import { useQuery } from "@tanstack/react-query";
import { getMemberSubmissionsSigned } from "@/api/fitness";

export function useMemberSubmissions(userId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ["memberSubmissions", userId, limit],
    queryFn: () => getMemberSubmissionsSigned(userId!, limit),
    enabled: !!userId,
    staleTime: 30_000,
  });
}
