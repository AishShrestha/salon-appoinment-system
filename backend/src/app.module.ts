import { Module } from '@nestjs/common';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UserModule } from './modules/user/user.module';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    AppointmentModule,
    NotificationModule,
    QueueModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
