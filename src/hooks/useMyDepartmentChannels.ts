import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getMyDepartmentsWithChannelSlug } from "@/api/home-departments";

export function useMyDepartmentChannels() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myDepartmentChannels", user?.id],
    queryFn: () => getMyDepartmentsWithChannelSlug(user!.id),
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}
