import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import type { Startup } from "./types";

export function useStartup(slug?: string) {
  return useQuery({
    queryKey: ["startup", slug],
    queryFn: () => api.get<Startup>(`/api/startups/${slug}`),
    enabled: Boolean(slug),
  });
}
