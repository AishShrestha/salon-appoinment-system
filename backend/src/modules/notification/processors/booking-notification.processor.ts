import {
  Processor,
  Process,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { NotificationService } from '../notification.service';

/**
 * BookingNotificationProcessor - Handles booking confirmation emails
 * Processes jobs from the 'notification' queue
 */
@Processor('notification')
export class BookingNotificationProcessor {
  private readonly logger = new Logger(BookingNotificationProcessor.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Process booking confirmation (auto-confirmed on booking)
   */
  @Process('booking-confirmation')
  async handleBookingConfirmation(job: Job) {
    this.logger.log(
      `Processing booking confirmation for appointment ${job.data.appointmentId}`,
    );

    const { userId, serviceName, date, startTime, endTime } = job.data;

    try {
      // Get user
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return;
      }

      // Format date
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Send confirmation email
      await this.notificationService.sendBookingConfirmation(
        user.email,
        user.name,
        serviceName,
        formattedDate,
        startTime,
        endTime,
      );

      this.logger.log(
        `Booking confirmation sent to ${user.email} for appointment ${job.data.appointmentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking confirmation: ${error.message}`,
        error.stack,
      );
      throw error; // Bull will retry
    }
  }

  /**
   * Process status change notification (for cancellation)
   */
  @Process('status-change')
  async handleStatusChange(job: Job) {
    this.logger.log(
      `Processing status change notification for appointment ${job.data.appointmentId}`,
    );

    const { userId, serviceName, action, date, startTime, endTime } = job.data;

    try {
      // Get user
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return;
      }

      // Format date
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Send appropriate email based on action
      if (action === 'cancelled') {
        await this.notificationService.sendBookingCancellation(
          user.email,
          user.name,
          serviceName,
          formattedDate,
          startTime,
          endTime,
        );

        this.logger.log(
          `Cancellation notification sent to ${user.email} for appointment ${job.data.appointmentId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send status change notification: ${error.message}`,
        error.stack,
      );
      throw error; // Bull will retry
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
      error.stack,
    );
  }
}
