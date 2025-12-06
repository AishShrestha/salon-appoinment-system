import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: 'bulk-appointments',
  cors: {
    origin: '*',
  },
})
export class BulkAppointmentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BulkAppointmentGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Emit job progress to specific job room
   */
  emitJobProgress(jobId: number, data: any): void {
    const room = `job-${jobId}`;
    this.server.to(room).emit('job-progress', {
      jobId,
      timestamp: new Date().toISOString(),
      ...data,
    });

    this.logger.debug(
      `Emitted progress for job ${jobId}: ${JSON.stringify(data)}`,
    );
  }

  /**
   * Emit job completion
   */
  emitJobCompleted(jobId: number, stats: any): void {
    const room = `job-${jobId}`;
    this.server.to(room).emit('job-completed', {
      jobId,
      timestamp: new Date().toISOString(),
      ...stats,
    });

    this.logger.log(`Job ${jobId} completed notification sent`);
  }

  /**
   * Emit job failure
   */
  emitJobFailed(jobId: number, error: string): void {
    const room = `job-${jobId}`;
    this.server.to(room).emit('job-failed', {
      jobId,
      timestamp: new Date().toISOString(),
      error,
    });

    this.logger.error(`Job ${jobId} failed notification sent`);
  }
}
