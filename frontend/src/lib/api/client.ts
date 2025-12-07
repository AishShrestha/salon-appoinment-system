import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem("token");
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          toast.error("Session expired. Please login again.");
          break;

        case 403:
          toast.error("You do not have permission to perform this action.");
          break;

        case 404:
          toast.error("Resource not found.");
          break;

        case 422:
          // Validation errors
          const validationErrors = (data as any)?.message;
          if (Array.isArray(validationErrors)) {
            validationErrors.forEach((err: string) => toast.error(err));
          } else {
            toast.error(validationErrors || "Validation error.");
          }
          break;

        case 500:
          toast.error("Server error. Please try again later.");
          break;

        default:
          toast.error((data as any)?.message || "An error occurred.");
      }
    } else if (error.request) {
      // Network error
      toast.error("Network error. Please check your connection.");
    } else {
      toast.error("An unexpected error occurred.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
