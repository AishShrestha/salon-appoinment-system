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
import { BulkAppointmentModule } from './modules/bulk-appointment/bulk-appointment.module';
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
    QueueModule,
    EmailModule,
    AuthModule,
    UserModule,
    AppointmentModule,
    NotificationModule,
    ServiceModule,
    BulkAppointmentModule,
    BreakPeriodModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
