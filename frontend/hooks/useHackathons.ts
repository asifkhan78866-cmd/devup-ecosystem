import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useHackathons() {
  return useQuery({
    queryKey: ["hackathons"],
    queryFn: () => api.get<any>("/api/hackathons"),
  });
}
