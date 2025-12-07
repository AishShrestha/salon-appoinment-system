import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/lib/api/client";
import type { Service, CreateServiceData, UpdateServiceData } from "@/types";

// Query keys
export const serviceKeys = {
  all: ["services"] as const,
  lists: () => [...serviceKeys.all, "list"] as const,
  list: () => [...serviceKeys.lists()] as const,
  details: () => [...serviceKeys.all, "detail"] as const,
  detail: (id: number) => [...serviceKeys.details(), id] as const,
};

// Get all services
export function useServices() {
  return useQuery({
    queryKey: serviceKeys.list(),
    queryFn: async () => {
      const { data } = await apiClient.get<Service[]>("/service");
      return data;
    },
  });
}

// Get single service
export function useService(id: number) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Service>(`/service/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// Create service (admin only)
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceData) => {
      const response = await apiClient.post<Service>("/service", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      toast.success("Service created successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to create service";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    },
  });
}

// Update service (admin only)
export function useUpdateService(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateServiceData) => {
      const response = await apiClient.patch<Service>(`/service/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(id) });
      toast.success("Service updated successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update service";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    },
  });
}

// Delete service (admin only)
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/service/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      toast.success("Service deleted successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to delete service";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    },
  });
}
