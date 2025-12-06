import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('break_periods')
export class BreakPeriod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;
}
