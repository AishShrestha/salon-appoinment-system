// API error response structure
export interface ApiError {
  message: string | string[];
  error?: string;
  statusCode: number;
}

// Standard success response with message and data
export interface ApiResponse<T = any> {
  message: string;
  data: T;
}

// Simple message response (used for login, verify-email)
export interface MessageResponse {
  message: string;
  email?: string;
  [key: string]: any;
}

// Business hours configuration
export interface BusinessHours {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

// Break period configuration
export interface BreakPeriod {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

// System settings
export interface SystemSettings {
  businessHours: BusinessHours;
  breakPeriod: BreakPeriod;
  timezone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
}
