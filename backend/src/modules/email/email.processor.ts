import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailService } from './email.service';

export interface VerificationEmailJob {
  email: string;
  name: string;
  token: string;
}

/**
 * EmailProcessor - Processes email queue jobs (SRP)
 * Follows Single Responsibility Principle: only processes email jobs
 */
@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Process verification email job
   * @param job - Bull job containing email data
   */
  @Process('send-verification')
  async handleVerificationEmail(job: Job<VerificationEmailJob>) {
    this.logger.log(`Processing verification email job for ${job.data.email}`);

    try {
      await this.emailService.sendVerificationEmail(
        job.data.email,
        job.data.name,
        job.data.token,
      );

      this.logger.log(
        `Successfully processed verification email for ${job.data.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process verification email for ${job.data.email}`,
        error.stack,
      );
      throw error; // Bull will retry the job
    }
  }
}
