// Appointment status enum matching backend
export enum AppointmentStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

// Service entity
export interface Service {
  id: number;
  name: string;
  duration: number; // in minutes
  price: number;
  createdAt: string;
  updatedAt: string;
}

// Appointment entity
export interface Appointment {
  id: number;
  userId: number;
  serviceId: number;
  service?: Service;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Time slot for availability
export interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
  available: boolean;
  isBreak?: boolean;
}

// Create appointment
export interface CreateAppointmentData {
  serviceId: number;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  notes?: string;
}

// Update appointment data
export interface UpdateAppointmentData {
  serviceId?: number;
  date?: string;
  startTime?: string;
  status?: AppointmentStatus;
  notes?: string;
}

// Create service data
export interface CreateServiceData {
  name: string;
  duration: number;
  price: number;
}

// Update service data
export interface UpdateServiceData {
  name?: string;
  duration?: number;
  price?: number;
}

// Available slots query params
export interface AvailableSlotsParams {
  date: string; // YYYY-MM-DD format
  serviceId: number;
}

// Available slots response
export interface AvailableSlotsResponse {
  date: string;
  service: {
    id: number;
    name: string;
    duration: number;
  };
  slots: TimeSlot[];
}

// Appointment filters
export interface AppointmentFilters {
  status?: AppointmentStatus;
  serviceId?: number;
  startDate?: string;
  endDate?: string;
  search?: string; // Search by customer name/email
}
