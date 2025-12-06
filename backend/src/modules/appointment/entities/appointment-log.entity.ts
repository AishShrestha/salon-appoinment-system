import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LogStatus } from '../../../common/enums';
import { Appointment } from './appointment.entity';

@Entity('appointment_logs')
export class AppointmentLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'appointment_id' })
  appointmentId: number;

  @Column({
    type: 'enum',
    enum: LogStatus,
  })
  status: LogStatus;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Appointment, (appointment) => appointment.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;
}
