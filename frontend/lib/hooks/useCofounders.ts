import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import type { CofounderProfile, PaginatedResponse } from "./types";

type CofounderFilters = {
  role?: string;
  stage?: string;
  page?: number;
};

function toQueryString(filters?: CofounderFilters) {
  const params = new URLSearchParams();
  if (filters?.role) params.set("role", filters.role);
  if (filters?.stage) params.set("stage", filters.stage);
  if (filters?.page) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useCofounders(filters?: CofounderFilters) {
  return useQuery({
    queryKey: ["cofounders", filters],
    queryFn: () =>
      api.get<PaginatedResponse<CofounderProfile>>(
        `/api/cofounders${toQueryString(filters)}`
      ),
  });
}
