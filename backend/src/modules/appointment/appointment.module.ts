import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentLog } from './entities/appointment-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, AppointmentLog])],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [TypeOrmModule],
})
export class AppointmentModule {}
