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
import { BulkJob } from '../entities/bulk-job.entity';
import { BulkJobLog } from '../entities/bulk-job-log.entity';
import {
  BulkJobStatus,
  LogStatus,
  AppointmentStatus,
} from '../../../common/enums';
import { User } from '../../user/entities/user.entity';
import { Service } from '../../service/entities/service.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';
import {
  calculateEndTime,
  validateDateFormat,
  validateTimeFormat,
  isDateInPast,
} from '../../../common/utils';
import { BulkAppointmentGateway } from '../bulk-appointment.gateway';

@Processor('bulk-appointment')
export class BulkAppointmentProcessor {
  private readonly logger = new Logger(BulkAppointmentProcessor.name);

  constructor(
    @InjectRepository(BulkJob)
    private readonly bulkJobRepository: Repository<BulkJob>,
    @InjectRepository(BulkJobLog)
    private readonly bulkJobLogRepository: Repository<BulkJobLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly bulkGateway: BulkAppointmentGateway,
  ) {}

  @Process('process-bulk-appointments')
  async handleBulkAppointments(job: Job) {
    const { jobId, appointments } = job.data;

    this.logger.log(
      `Processing bulk job ${jobId} with ${appointments.length} appointments`,
    );

    try {
      // Update job status to processing
      await this.updateJobStatus(jobId, BulkJobStatus.PROCESSING);

      // Emit real-time update
      this.emitProgress(jobId, {
        status: BulkJobStatus.PROCESSING,
        processedRecords: 0,
        totalRecords: appointments.length,
        progress: 0,
      });

      // Process each appointment
      for (let i = 0; i < appointments.length; i++) {
        const appointment = appointments[i];

        try {
          await this.processAppointment(jobId, appointment);
        } catch (error) {
          this.logger.error(
            `Row ${appointment.rowNumber} failed: ${error.message}`,
          );
        }

        // Progress is tracked via success/failure counts
        const job = await this.bulkJobRepository.findOne({
          where: { id: jobId },
        });
        if (job) {
          const processed = job.successCount + job.failureCount;
          const progress = Math.round((processed / appointments.length) * 100);

          // Emit real-time progress
          this.emitProgress(jobId, {
            status: BulkJobStatus.PROCESSING,
            processedRecords: processed,
            totalRecords: appointments.length,
            progress,
          });
        }
      }

      // Mark job as completed
      await this.updateJobStatus(jobId, BulkJobStatus.COMPLETED);

      // Emit completion
      const finalStats = await this.getJobStats(jobId);
      this.emitProgress(jobId, {
        status: BulkJobStatus.COMPLETED,
        ...finalStats,
        progress: 100,
      });

      this.logger.log(`Bulk job ${jobId} completed successfully`);
    } catch (error) {
      this.logger.error(
        `Bulk job ${jobId} failed: ${error.message}`,
        error.stack,
      );

      await this.updateJobStatus(jobId, BulkJobStatus.FAILED, error.message);

      this.emitProgress(jobId, {
        status: BulkJobStatus.FAILED,
        error: error.message,
      });

      throw error;
    }
  }

  private async processAppointment(
    jobId: number,
    appointmentData: any,
  ): Promise<void> {
    const {
      rowNumber,
      customerName,
      customerEmail,
      serviceName,
      date,
      startTime,
      notes,
    } = appointmentData;

    try {
      // Validate date and time formats
      validateDateFormat(date);
      validateTimeFormat(startTime);

      // Check if date is in the past
      if (isDateInPast(date)) {
        throw new Error('Cannot book appointments in the past');
      }

      // Find or create user
      let user = await this.userRepository.findOne({
        where: { email: customerEmail },
      });

      if (!user) {
        throw new Error(`User with email ${customerEmail} not found`);
      }

      // Find service
      const service = await this.serviceRepository.findOne({
        where: { name: serviceName },
      });

      if (!service) {
        throw new Error(`Service "${serviceName}" not found`);
      }

      // Calculate end time
      const endTime = calculateEndTime(startTime, service.duration);

      // Check for overlapping appointments
      const existingAppointment = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.date = :date', { date: new Date(date) })
        .andWhere(
          '(appointment.start_time < :endTime AND appointment.end_time > :startTime)',
          { startTime, endTime },
        )
        .andWhere('appointment.status != :cancelled', {
          cancelled: AppointmentStatus.CANCELLED,
        })
        .getOne();

      if (existingAppointment) {
        throw new Error('Time slot overlaps with existing appointment');
      }

      // Create appointment with PENDING status
      const appointment = this.appointmentRepository.create({
        userId: user.id,
        serviceId: service.id,
        date: new Date(date),
        startTime,
        endTime,
        status: AppointmentStatus.PENDING,
        notes,
      });

      const savedAppointment =
        await this.appointmentRepository.save(appointment);

      // Log success
      await this.logAppointmentResult(
        jobId,
        rowNumber,
        appointmentData,
        LogStatus.SUCCESS,
        null,
        savedAppointment.id,
      );

      await this.incrementSuccessCount(jobId);

      this.logger.log(
        `Row ${rowNumber}: Appointment created successfully (ID: ${savedAppointment.id})`,
      );
    } catch (error) {
      // Log failure
      await this.logAppointmentResult(
        jobId,
        rowNumber,
        appointmentData,
        LogStatus.FAILURE,
        error.message,
      );

      await this.incrementFailureCount(jobId);

      this.logger.error(`Row ${rowNumber}: ${error.message}`);
    }
  }

  /**
   * Log appointment processing result
   */
  private async logAppointmentResult(
    jobId: number,
    rowNumber: number,
    appointmentData: any,
    status: LogStatus,
    errorMessage: string | null,
    appointmentId?: number,
  ): Promise<void> {
    await this.bulkJobLogRepository.save({
      bulkJobId: jobId,
      appointmentData: {
        rowNumber,
        customerName: appointmentData.customerName,
        customerEmail: appointmentData.customerEmail,
        serviceName: appointmentData.serviceName,
        date: appointmentData.date,
        startTime: appointmentData.startTime,
        ...(appointmentId && { appointmentId }),
      },
      status,
      ...(errorMessage && { errorMessage }),
    });
  }

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: number,
    status: BulkJobStatus,
    errorMessage?: string,
  ): Promise<void> {
    await this.bulkJobRepository.update(jobId, {
      status,
      ...(errorMessage && { errorMessage }),
    });
  }

  /**
   * Increment success count
   */
  private async incrementSuccessCount(jobId: number): Promise<void> {
    await this.bulkJobRepository.increment({ id: jobId }, 'successCount', 1);
  }

  /**
   * Increment failure count
   */
  private async incrementFailureCount(jobId: number): Promise<void> {
    await this.bulkJobRepository.increment({ id: jobId }, 'failureCount', 1);
  }

  /**
   * Get job statistics
   */
  private async getJobStats(jobId: number): Promise<any> {
    const job = await this.bulkJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      return {
        processedRecords: 0,
        totalRecords: 0,
        successCount: 0,
        failureCount: 0,
      };
    }
    const processedRecords = job.successCount + job.failureCount;
    return {
      processedRecords,
      totalRecords: job.totalAppointments,
      successCount: job.successCount,
      failureCount: job.failureCount,
    };
  }

  /**
   * Emit real-time progress update via WebSocket
   */
  private emitProgress(jobId: number, data: any): void {
    this.bulkGateway.emitJobProgress(jobId, data);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Bulk job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Bulk job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }
}
