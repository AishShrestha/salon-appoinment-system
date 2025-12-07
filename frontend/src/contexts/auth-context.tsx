"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import type { User, LoginData, RegisterData, LoginResponse } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const initAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Validate token by fetching user profile
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.data) {
        setUser(response.data.data);
      }
    } catch (error) {
      // Token invalid or expired
      console.error("Token validation failed:", error);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing token and validate on mount
  useEffect(() => {
    initAuth();
  }, []);

  const register = async (data: RegisterData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, data);

      toast.success(
        response.data.message ||
          "Registration successful! Please check your email to verify your account."
      );

      // Redirect to login after successful registration
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again.";

      toast.error(
        Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
      );
      throw error;
    }
  };

  const login = async (data: LoginData) => {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_URL}/auth/login`,
        data
      );

      const { accessToken, user: userData } = response.data;

      // Store token
      localStorage.setItem("token", accessToken);

      // Update user state
      setUser(userData);

      toast.success("Login successful!");

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";

      toast.error(
        Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
      );
      throw error;
    }
  };

  const logout = () => {
    // Clear token
    localStorage.removeItem("token");

    // Clear user state
    setUser(null);

    // Show success message
    toast.success("Logged out successfully");

    // Redirect to login
    router.push("/login");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
