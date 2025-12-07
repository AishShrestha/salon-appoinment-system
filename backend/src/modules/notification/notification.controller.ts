import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationTemplate } from './entities/notification-template.entity';

@Controller('notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Get all notification templates
   * GET /notification/templates
   */
  @Get('templates')
  async getAllTemplates(): Promise<NotificationTemplate[]> {
    return this.notificationService.findAllTemplates();
  }

  /**
   * Get a single notification template by ID
   * GET /notification/templates/:id
   */
  @Get('templates/:id')
  async getTemplateById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NotificationTemplate> {
    return this.notificationService.findTemplateById(id);
  }
}
