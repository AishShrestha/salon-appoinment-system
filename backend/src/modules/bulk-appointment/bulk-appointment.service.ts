import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as XLSX from 'xlsx';
import { BulkJob } from './entities/bulk-job.entity';
import { BulkJobLog } from './entities/bulk-job-log.entity';
import { BulkJobStatus } from '../../common/enums';

@Injectable()
export class BulkAppointmentService {
  private readonly logger = new Logger(BulkAppointmentService.name);

  constructor(
    @InjectRepository(BulkJob)
    private readonly bulkJobRepository: Repository<BulkJob>,
    @InjectRepository(BulkJobLog)
    private readonly bulkJobLogRepository: Repository<BulkJobLog>,
    @InjectQueue('bulk-appointment') private readonly bulkQueue: Queue,
  ) {}

  /**
   * Upload and process bulk appointment Excel file
   */
  async uploadBulkFile(
    file: Express.Multer.File,
    userId: number,
  ): Promise<{ jobId: number; totalRecords: number; status: string }> {
    try {
      // Validate file
      this.validateFile(file);

      // Parse Excel file
      const appointments = await this.parseExcelFile(file);

      if (appointments.length === 0) {
        throw new BadRequestException('No valid appointments found in file');
      }

      // Create bulk job
      const bulkJob = this.bulkJobRepository.create({
        userId,
        fileName: file.originalname,
        totalAppointments: appointments.length,
        status: BulkJobStatus.PENDING,
      });

      const savedJob = await this.bulkJobRepository.save(bulkJob);

      this.logger.log(
        `Bulk job ${savedJob.id} created with ${appointments.length} appointments`,
      );

      // Queue job for processing
      await this.bulkQueue.add(
        'process-bulk-appointments',
        {
          jobId: savedJob.id,
          appointments,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      return {
        jobId: savedJob.id,
        totalRecords: appointments.length,
        status: 'queued',
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload bulk file: ${error.message}`,
        error.stack,
      );

      if (error.status) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to process bulk upload. Please try again.',
      );
    }
  }

  /**
   * Get bulk job status
   */
  async getJobStatus(jobId: number, userId: number): Promise<any> {
    try {
      const job = await this.bulkJobRepository.findOne({
        where: { id: jobId, userId },
      });

      if (!job) {
        throw new NotFoundException(`Bulk job ${jobId} not found`);
      }

      const processedRecords = job.successCount + job.failureCount;
      const progress =
        job.totalAppointments > 0
          ? Math.round((processedRecords / job.totalAppointments) * 100)
          : 0;

      return {
        id: job.id,
        fileName: job.fileName,
        totalRecords: job.totalAppointments,
        processedRecords: job.successCount + job.failureCount,
        successCount: job.successCount,
        failureCount: job.failureCount,
        status: job.status,
        createdAt: job.createdAt,
        progress,
      };
    } catch (error) {
      if (error.status) {
        throw error;
      }

      this.logger.error(
        `Failed to get job status: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve job status');
    }
  }

  /**
   * Get job logs
   */
  async getJobLogs(jobId: number, userId: number): Promise<BulkJobLog[]> {
    try {
      const job = await this.bulkJobRepository.findOne({
        where: { id: jobId, userId },
      });

      if (!job) {
        throw new NotFoundException(`Bulk job ${jobId} not found`);
      }

      return this.bulkJobLogRepository.find({
        where: { bulkJobId: jobId },
        order: { createdAt: 'ASC' },
      });
    } catch (error) {
      if (error.status) {
        throw error;
      }

      this.logger.error(
        `Failed to get job logs: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve job logs');
    }
  }

  /**
   * Get all bulk jobs for user
   */
  async getAllJobs(userId: number): Promise<BulkJob[]> {
    try {
      return this.bulkJobRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get bulk jobs: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve bulk jobs');
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Check file type
    const allowedMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Please upload an Excel file (.xls or .xlsx)',
      );
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }
  }

  /**
   * Parse Excel file
   * Expected columns: Customer Name, Customer Email, Service Name, Date (YYYY-MM-DD), Start Time (HH:MM)
   */
  private async parseExcelFile(file: Express.Multer.File): Promise<any[]> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const appointments: any[] = [];

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        const rowNumber = i + 2; // Excel row number (accounting for header)

        // Validate required fields
        if (
          !row['Customer Name'] ||
          !row['Customer Email'] ||
          !row['Service Name'] ||
          !row['Date'] ||
          !row['Start Time']
        ) {
          this.logger.warn(`Row ${rowNumber}: Missing required fields`);
          continue;
        }

        appointments.push({
          rowNumber,
          customerName: row['Customer Name'].trim(),
          customerEmail: row['Customer Email'].trim().toLowerCase(),
          serviceName: row['Service Name'].trim(),
          date: this.parseDate(row['Date']),
          startTime: this.parseTime(row['Start Time']),
          notes: row['Notes'] || '',
        });
      }

      return appointments;
    } catch (error) {
      this.logger.error(`Failed to parse Excel file: ${error.message}`);
      throw new BadRequestException(
        'Failed to parse Excel file. Please check the file format.',
      );
    }
  }

  /**
   * Parse date from Excel
   */
  private parseDate(value: any): string {
    try {
      // Handle Excel serial date
      if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }

      // Handle string date (YYYY-MM-DD)
      if (typeof value === 'string') {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (datePattern.test(value)) {
          return value;
        }
      }

      throw new Error('Invalid date format');
    } catch (error) {
      throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
    }
  }

  /**
   * Parse time from Excel
   */
  private parseTime(value: any): string {
    try {
      // Handle Excel time (0-1 decimal)
      if (typeof value === 'number' && value >= 0 && value < 1) {
        const hours = Math.floor(value * 24);
        const minutes = Math.floor((value * 24 * 60) % 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }

      // Handle string time (HH:MM)
      if (typeof value === 'string') {
        const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (timePattern.test(value)) {
          const [hours, minutes] = value.split(':');
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
      }

      throw new Error('Invalid time format');
    } catch (error) {
      throw new BadRequestException('Invalid time format. Expected HH:MM');
    }
  }
}
