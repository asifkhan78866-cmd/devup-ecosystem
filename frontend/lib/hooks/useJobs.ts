import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import type { Job, PaginatedResponse } from "./types";

type JobFilters = {
  domain?: string;
  search?: string;
  type?: string;
  page?: number;
};

function toQueryString(filters?: JobFilters) {
  const params = new URLSearchParams();
  if (filters?.domain) params.set("domain", filters.domain);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.page) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: () =>
      api.get<PaginatedResponse<Job>>(`/api/jobs${toQueryString(filters)}`),
  });
}
