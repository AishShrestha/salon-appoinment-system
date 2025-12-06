import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentLog } from './entities/appointment-log.entity';
import { Service } from '../service/entities/service.entity';
import { BreakPeriod } from '../break-period/entities/break-period.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentLog,
      Service,
      BreakPeriod,
    ]),
    BullModule.registerQueue({
      name: 'notification',
    }),
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [TypeOrmModule, AppointmentService],
})
export class AppointmentModule {}
