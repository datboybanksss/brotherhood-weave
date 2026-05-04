import { useQuery } from "@tanstack/react-query";
import { getProfilePhotos, type ProfilePhoto } from "@/api/profile-photos";

export function useProfilePhotos(userId: string | undefined) {
  return useQuery<ProfilePhoto[]>({
    queryKey: ["profilePhotos", userId],
    queryFn: () => getProfilePhotos(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}