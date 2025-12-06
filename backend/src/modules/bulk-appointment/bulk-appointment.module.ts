import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { MulterModule } from '@nestjs/platform-express';
import { BulkAppointmentController } from './bulk-appointment.controller';
import { BulkAppointmentService } from './bulk-appointment.service';
import { BulkAppointmentGateway } from './bulk-appointment.gateway';
import { BulkAppointmentProcessor } from './processors/bulk-appointment.processor';
import { BulkJob } from './entities/bulk-job.entity';
import { BulkJobLog } from './entities/bulk-job-log.entity';
import { User } from '../user/entities/user.entity';
import { Service } from '../service/entities/service.entity';
import { Appointment } from '../appointment/entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BulkJob, BulkJobLog, User, Service, Appointment]),
    BullModule.registerQueue({
      name: 'bulk-appointment',
    }),
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [BulkAppointmentController],
  providers: [
    BulkAppointmentService,
    BulkAppointmentGateway,
    BulkAppointmentProcessor,
  ],
  exports: [BulkAppointmentService, BulkAppointmentGateway],
})
export class BulkAppointmentModule {}
