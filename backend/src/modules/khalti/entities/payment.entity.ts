import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Appointment } from '../../appointment/entities/appointment.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  pidx: string;

  @Column({ type: 'varchar', length: 32 })
  gateway: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 32 })
  status: string;

  @Column({ type: 'jsonb' })
  rawResponse: any;

  // Optional: for reverse lookup (all appointments paid by this payment)
  @OneToMany(() => Appointment, (appointment) => appointment.payment)
  appointments?: Appointment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
