"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import type { BulkJobStatusUpdate } from "@/types";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

interface SocketProviderProps {
  children: ReactNode;
  token?: string | null;
}

export function SocketProvider({ children, token }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only initialize socket if user is authenticated
    if (!token) {
      // Disconnect if token is removed (user logged out)
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const socketInstance = io(WS_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });

    // Connection event handlers
    socketInstance.on("connect", () => {
      console.log("✅ WebSocket connected");
      setIsConnected(true);
      toast.success("Connected to real-time updates");
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ WebSocket disconnected:", reason);
      setIsConnected(false);

      if (reason === "io server disconnect") {
        // Server disconnected, manually reconnect
        socketInstance.connect();
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      toast.success("Reconnected to real-time updates");
    });

    socketInstance.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
    });

    socketInstance.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    socketInstance.on("reconnect_failed", () => {
      console.error("❌ Failed to reconnect");
      toast.error("Failed to connect to real-time updates");
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token]);

  // Emit event to server
  const emit = useCallback(
    (event: string, data?: any) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      } else {
        console.warn(`Cannot emit "${event}": Socket not connected`);
      }
    },
    [socket, isConnected]
  );

  // Listen to event from server
  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      if (socket) {
        socket.on(event, callback);
      }
    },
    [socket]
  );

  // Remove event listener
  const off = useCallback(
    (event: string, callback?: (...args: any[]) => void) => {
      if (socket) {
        if (callback) {
          socket.off(event, callback);
        } else {
          socket.off(event);
        }
      }
    },
    [socket]
  );

  const value: SocketContextType = {
    socket,
    isConnected,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);

  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return context;
}

// Custom hook for bulk job updates
export function useBulkJobUpdates(
  onUpdate: (data: BulkJobStatusUpdate) => void
) {
  const { on, off, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const handleBulkJobUpdate = (data: BulkJobStatusUpdate) => {
      onUpdate(data);
    };

    on("bulk-job-update", handleBulkJobUpdate);

    return () => {
      off("bulk-job-update", handleBulkJobUpdate);
    };
  }, [on, off, onUpdate, isConnected]);
}

// Custom hook for appointment updates
export function useAppointmentUpdates(
  onCreated?: (data: any) => void,
  onUpdated?: (data: any) => void,
  onCancelled?: (data: any) => void
) {
  const { on, off, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const handleCreated = (data: any) => {
      toast.success("New appointment created");
      onCreated?.(data);
    };

    const handleUpdated = (data: any) => {
      toast.info("Appointment updated");
      onUpdated?.(data);
    };

    const handleCancelled = (data: any) => {
      toast.warning("Appointment cancelled");
      onCancelled?.(data);
    };

    if (onCreated) on("appointment-created", handleCreated);
    if (onUpdated) on("appointment-updated", handleUpdated);
    if (onCancelled) on("appointment-cancelled", handleCancelled);

    return () => {
      if (onCreated) off("appointment-created", handleCreated);
      if (onUpdated) off("appointment-updated", handleUpdated);
      if (onCancelled) off("appointment-cancelled", handleCancelled);
    };
  }, [on, off, onCreated, onUpdated, onCancelled, isConnected]);
}

// Custom hook for notification updates
export function useNotificationUpdates(onNotification?: (data: any) => void) {
  const { on, off, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const handleNotification = (data: any) => {
      toast.info(`Notification: ${data.message || "New notification"}`);
      onNotification?.(data);
    };

    if (onNotification) {
      on("notification-sent", handleNotification);
    }

    return () => {
      if (onNotification) {
        off("notification-sent", handleNotification);
      }
    };
  }, [on, off, onNotification, isConnected]);
}
