import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

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

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth or query
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1] ||
        client.handshake.query?.token;

      if (!token) {
        this.logger.warn(
          `Client ${client.id} connection rejected: No token provided`,
        );
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);

      // Attach user info to socket for later use
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      this.logger.log(
        `Client connected: ${client.id} (User: ${payload.email})`,
      );
    } catch (error) {
      this.logger.warn(
        `Client ${client.id} authentication failed: ${error.message}`,
      );
      client.disconnect();
    }
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
