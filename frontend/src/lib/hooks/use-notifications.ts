import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/lib/api/client";
import type {
  BulkJob,
  BulkJobLog,
  BulkUploadResponse,
  BulkJobStatusResponse,
} from "@/types";

// Query keys
export const notificationKeys = {
  all: ["notifications"] as const,
  bulkJobs: () => [...notificationKeys.all, "bulk-jobs"] as const,
  bulkJob: (id: number) => [...notificationKeys.bulkJobs(), id] as const,
  bulkJobStatus: (id: number) =>
    [...notificationKeys.bulkJobs(), id, "status"] as const,
  bulkJobLogs: (id: number) =>
    [...notificationKeys.bulkJobs(), id, "logs"] as const,
};

// Get all bulk jobs
export function useBulkJobs() {
  return useQuery({
    queryKey: notificationKeys.bulkJobs(),
    queryFn: async () => {
      const { data } = await apiClient.get<BulkJob[]>("/bulk-appointment/jobs");
      return data;
    },
  });
}

// Get bulk job status
export function useBulkJobStatus(jobId: number) {
  return useQuery({
    queryKey: notificationKeys.bulkJobStatus(jobId),
    queryFn: async () => {
      const { data } = await apiClient.get<BulkJobStatusResponse>(
        `/bulk-appointment/job/${jobId}/status`
      );
      return data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling if job is completed or failed
      if (data?.status === "completed" || data?.status === "failed") {
        return false;
      }
      // Poll every 2 seconds while processing
      return 2000;
    },
  });
}

// Get bulk job logs
export function useBulkJobLogs(jobId: number) {
  return useQuery({
    queryKey: notificationKeys.bulkJobLogs(jobId),
    queryFn: async () => {
      const { data } = await apiClient.get<BulkJobLog[]>(
        `/bulk-appointment/job/${jobId}/logs`
      );
      return data;
    },
    enabled: !!jobId,
  });
}

// Upload bulk appointments (Excel file)
export function useUploadBulkAppointments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await apiClient.post<BulkUploadResponse>(
        "/bulk-appointment/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.bulkJobs() });
      toast.success(
        `File uploaded successfully! Processing ${data.totalRecords} appointments.`
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to upload file";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    },
  });
}
