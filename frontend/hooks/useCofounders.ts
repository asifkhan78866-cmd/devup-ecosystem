import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useCofounders(params?: Record<string, string>) {
  const queryStr = params ? new URLSearchParams(params).toString() : "";
  return useQuery({
    queryKey: ["cofounders", params],
    queryFn: () => api.get<any>(`/api/cofounders${queryStr ? `?${queryStr}` : ""}`),
  });
}
