import { useQuery } from "@tanstack/react-query";
import { getMyStravaConnection } from "@/api/strava";

export function useStravaConnection() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["stravaConnection"],
    queryFn: getMyStravaConnection,
  });
  return { connection: data ?? null, isLoading, refetch };
}
