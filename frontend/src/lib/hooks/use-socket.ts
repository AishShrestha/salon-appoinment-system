import { useSocket as useSocketContext } from "@/contexts/socket-context";

// Re-export socket hooks from context for convenience
export { useSocket } from "@/contexts/socket-context";
export { useBulkJobUpdates } from "@/contexts/socket-context";
export { useAppointmentUpdates } from "@/contexts/socket-context";
export { useNotificationUpdates } from "@/contexts/socket-context";

// Additional helper hook for joining rooms
export function useJoinRoom(roomId?: string) {
  const { emit, isConnected } = useSocketContext();

  const joinRoom = (room: string) => {
    if (isConnected) {
      emit("join-room", { roomId: room });
    }
  };

  const leaveRoom = (room: string) => {
    if (isConnected) {
      emit("leave-room", { roomId: room });
    }
  };

  // Auto-join room on mount if roomId provided
  if (roomId && isConnected) {
    joinRoom(roomId);
  }

  return { joinRoom, leaveRoom, isConnected };
}
