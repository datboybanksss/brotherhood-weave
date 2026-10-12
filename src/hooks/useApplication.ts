import { useQuery } from "@tanstack/react-query";
import { getApplication } from "@/api/applications";
export function useApplication(userId?: string) {
  return useQuery({ queryKey: ["application", userId], queryFn: () => getApplication(userId!), enabled: !!userId });
}
