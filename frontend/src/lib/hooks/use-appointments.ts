import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/lib/api/client";
import type {
  Appointment,
  CreateAppointmentData,
  UpdateAppointmentData,
  AvailableSlotsParams,
  AvailableSlotsResponse,
  AppointmentFilters,
} from "@/types";

// Query keys
export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters?: AppointmentFilters) =>
    [...appointmentKeys.lists(), { filters }] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: number) => [...appointmentKeys.details(), id] as const,
  myAppointments: () => [...appointmentKeys.all, "my"] as const,
  availability: (params: AvailableSlotsParams) =>
    [...appointmentKeys.all, "availability", params] as const,
};

// Get all appointments (admin only)
export function useAppointments(filters?: AppointmentFilters) {
  return useQuery({
    queryKey: appointmentKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<Appointment[]>("/appointment", {
        params: filters,
      });
      return data;
    },
  });
}

// Get my appointments (current user)
export function useMyAppointments() {
  return useQuery({
    queryKey: appointmentKeys.myAppointments(),
    queryFn: async () => {
      const { data } = await apiClient.get<Appointment[]>(
        "/appointment/my-appointments"
      );
      return data;
    },
  });
}

// Get single appointment
export function useAppointment(id: number) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Appointment>(`/appointment/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// Get available time slots
export function useAvailableSlots(params: AvailableSlotsParams) {
  return useQuery({
    queryKey: appointmentKeys.availability(params),
    queryFn: async () => {
      const { data } = await apiClient.get<AvailableSlotsResponse>(
        "/appointment/availability",
        { params }
      );
      return data;
    },
    enabled: !!params.date && !!params.serviceId,
  });
}

// Create appointment
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      const response = await apiClient.post<Appointment>("/appointment", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.myAppointments(),
      });
      toast.success("Appointment created successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to create appointment";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    },
  });
}

// Update appointment
export function useUpdateAppointment(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAppointmentData) => {
      const response = await apiClient.patch<Appointment>(
        `/appointment/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.myAppointments(),
      });
      toast.success("Appointment updated successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update appointment";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    },
  });
}

// Cancel appointment
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete<Appointment>(
        `/appointment/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.myAppointments(),
      });
      toast.success("Appointment cancelled successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to cancel appointment";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    },
  });
}

// Approve appointment (admin only)
export function useApproveAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.patch<Appointment>(
        `/appointment/${id}/approve`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.detail(data.id),
      });
      toast.success("Appointment approved successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to approve appointment";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    },
  });
}

// Complete appointment (admin only)
export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.patch<Appointment>(
        `/appointment/${id}/complete`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.detail(data.id),
      });
      toast.success("Appointment marked as completed!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to complete appointment";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    },
  });
}
