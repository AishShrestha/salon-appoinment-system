// Log status enum
export enum LogStatus {
  SUCCESS = "success",
  FAILED = "failed",
  PENDING = "pending",
}

// Bulk job status enum
export enum BulkJobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

// Bulk job entity
export interface BulkJob {
  id: number;
  userId: number;
  fileName: string;
  status: BulkJobStatus;
  totalAppointments: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
}

// Bulk job log entity
export interface BulkJobLog {
  id: number;
  bulkJobId: number;
  appointmentData: Record<string, any>;
  status: LogStatus;
  errorMessage?: string;
  createdAt: string;
}

// Bulk upload data
export interface BulkAppointmentData {
  rowNumber: number;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  notes?: string;
}

// Bulk upload response
export interface BulkUploadResponse {
  jobId: number;
  totalRecords: number;
  status: string;
}

// Bulk job status response
export interface BulkJobStatusResponse {
  id: number;
  fileName: string;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  failureCount: number;
  status: BulkJobStatus;
  createdAt: string;
  progress: number;
}

// Bulk job status update
export interface BulkJobStatusUpdate {
  jobId: number;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  failureCount: number;
  status: BulkJobStatus;
  progress: number;
  errors?: Array<{
    rowNumber: number;
    customerName: string;
    error: string;
  }>;
}
