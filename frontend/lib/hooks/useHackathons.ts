import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import type { Hackathon, PaginatedResponse } from "./types";

type HackathonFilters = {
  mode?: string;
  search?: string;
  page?: number;
};

function toQueryString(filters?: HackathonFilters) {
  const params = new URLSearchParams();
  if (filters?.mode) params.set("mode", filters.mode);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.page) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useHackathons(filters?: HackathonFilters) {
  return useQuery({
    queryKey: ["hackathons", filters],
    queryFn: () =>
      api.get<PaginatedResponse<Hackathon>>(
        `/api/hackathons${toQueryString(filters)}`
      ),
  });
}
