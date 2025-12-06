import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LogStatus } from '../../../common/enums';
import { BulkJob } from './bulk-job.entity';

@Entity('bulk_job_logs')
export class BulkJobLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'bulk_job_id' })
  bulkJobId: number;

  @Column({ type: 'jsonb', name: 'appointment_data' })
  appointmentData: Record<string, any>;

  @Column({
    type: 'enum',
    enum: LogStatus,
  })
  status: LogStatus;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => BulkJob, (bulkJob) => bulkJob.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bulk_job_id' })
  bulkJob: BulkJob;
}
