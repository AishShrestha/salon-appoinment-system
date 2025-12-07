import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import type { Template } from "@/types";

// Query keys
export const templateKeys = {
  all: ["templates"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
  list: () => [...templateKeys.lists()] as const,
  details: () => [...templateKeys.all, "detail"] as const,
  detail: (id: number) => [...templateKeys.details(), id] as const,
};

// Get all notification templates
export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.list(),
    queryFn: async () => {
      const { data } = await apiClient.get<Template[]>(
        "/notification/templates"
      );
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - templates rarely change
  });
}

// Get single template
export function useTemplate(id: number) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Template>(
        `/notification/templates/${id}`
      );
      return data;
    },
    enabled: !!id,
  });
}
