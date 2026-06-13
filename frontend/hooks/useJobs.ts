import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useJobs(params?: Record<string, string>) {
  const queryStr = params ? new URLSearchParams(params).toString() : "";
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: () => api.get<any>(`/api/jobs${queryStr ? `?${queryStr}` : ""}`),
  });
}
