import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationTemplateSeeder } from './notification-template.seeder';
import { BookingNotificationProcessor } from './processors/booking-notification.processor';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationTemplate, User]),
    BullModule.registerQueue({
      name: 'notification',
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationTemplateSeeder,
    BookingNotificationProcessor,
  ],
  exports: [TypeOrmModule, NotificationService],
})
export class NotificationModule {}
