import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BulkJobStatus } from '../../../common/enums';
import { User } from '../../user/entities/user.entity';
import { BulkJobLog } from './bulk-job-log.entity';

@Entity('bulk_jobs')
export class BulkJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', length: 255, name: 'file_name' })
  fileName: string;

  @Column({
    type: 'enum',
    enum: BulkJobStatus,
    default: BulkJobStatus.PENDING,
  })
  status: BulkJobStatus;

  @Column({ type: 'int', name: 'total_appointments', default: 0 })
  totalAppointments: number;

  @Column({ type: 'int', name: 'success_count', default: 0 })
  successCount: number;

  @Column({ type: 'int', name: 'failure_count', default: 0 })
  failureCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.bulkJobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => BulkJobLog, (log) => log.bulkJob)
  logs: BulkJobLog[];
}
