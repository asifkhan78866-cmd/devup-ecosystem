import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useStartup(slug: string) {
  return useQuery({
    queryKey: ["startups", slug],
    queryFn: () => api.get<any>(`/api/startups/${slug}`),
    enabled: !!slug,
  });
}

export function useStartupJobs(id: string) {
  return useQuery({
    queryKey: ["startups", id, "jobs"],
    queryFn: () => api.get<any>(`/api/startups/${id}/jobs`),
    enabled: !!id,
  });
}
