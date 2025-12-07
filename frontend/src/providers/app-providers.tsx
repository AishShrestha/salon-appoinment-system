"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { SocketProvider } from "@/contexts/socket-context";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Create QueryClient instance with optimized defaults
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 1,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* SocketProvider receives token from AuthContext */}
        <SocketProviderWrapper>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </SocketProviderWrapper>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  );
}

// Wrapper to access auth context and pass token to SocketProvider
function SocketProviderWrapper({ children }: { children: ReactNode }) {
  // Import useAuth inside component to avoid hook order issues
  const { useAuth } = require("@/contexts/auth-context");
  const { user } = useAuth();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return <SocketProvider token={token}>{children}</SocketProvider>;
}
