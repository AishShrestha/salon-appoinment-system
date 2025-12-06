import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../../common/enums';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { BulkJob } from '../../bulk-job/entities/bulk-job.entity';
import { hashPassword } from '../../../common/utils';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'verification_token',
  })
  @Exclude()
  verificationToken: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'verification_token_expiry',
  })
  @Exclude()
  verificationTokenExpiry: Date | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Appointment, (appointment) => appointment.user)
  appointments: Appointment[];

  @OneToMany(() => BulkJob, (bulkJob) => bulkJob.user)
  bulkJobs: BulkJob[];
}
