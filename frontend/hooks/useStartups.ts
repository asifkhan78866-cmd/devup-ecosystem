import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useStartups() {
  return useQuery({
    queryKey: ["startups"],
    queryFn: () => api.get<any>("/api/startups"),
  });
}

export function useFeaturedStartups() {
  return useQuery({
    queryKey: ["startups", "featured"],
    queryFn: () => api.get<any>("/api/startups/featured"),
  });
}
