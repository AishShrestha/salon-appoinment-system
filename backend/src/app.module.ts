import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UserModule } from './modules/user/user.module';
import { QueueModule } from './modules/queue/queue.module';
import { EmailModule } from './modules/email/email.module';
import { ServiceModule } from './modules/service/service.module';
import { BulkJobModule } from './modules/bulk-job/bulk-job.module';
import { BreakPeriodModule } from './modules/break-period/break-period.module';
import { getTypeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    // Configure environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Configure TypeORM with async configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getTypeOrmConfig(configService),
    }),

    // Feature modules
    QueueModule, // Must be imported before modules that use queues
    EmailModule,
    AuthModule,
    UserModule,
    AppointmentModule,
    NotificationModule,
    ServiceModule,
    BulkJobModule,
    BreakPeriodModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
