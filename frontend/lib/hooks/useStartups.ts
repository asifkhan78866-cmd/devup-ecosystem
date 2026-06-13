import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import type { PaginatedResponse, Startup } from "./types";

type StartupFilters = {
  domain?: string;
  search?: string;
  page?: number;
};

function toQueryString(filters?: StartupFilters) {
  const params = new URLSearchParams();
  if (filters?.domain) params.set("domain", filters.domain);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.page) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useStartups(filters?: StartupFilters) {
  return useQuery({
    queryKey: ["startups", filters],
    queryFn: () =>
      api.get<PaginatedResponse<Startup>>(`/api/startups${toQueryString(filters)}`),
  });
}

export function useFeaturedStartups() {
  return useQuery({
    queryKey: ["startups", "featured"],
    queryFn: () => api.get<Startup[]>("/api/startups/featured"),
  });
}
