import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from './entities/notification-template.entity';

/**
 * NotificationTemplateSeeder
 * Seeds predefined appointment confirmation templates into the database
 * Follows SOLID, KISS, DRY principles with proper error handling
 */
@Injectable()
export class NotificationTemplateSeeder implements OnModuleInit {
  private readonly logger = new Logger(NotificationTemplateSeeder.name);

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
  ) {}

  /**
   * Runs automatically on module initialization
   */
  async onModuleInit() {
    await this.seedTemplates();
  }

  /**
   * Seed predefined templates if they don't exist
   * Uses KISS principle - simple and straightforward
   */
  private async seedTemplates(): Promise<void> {
    try {
      const templates = this.getPredefinedTemplates();

      for (const templateData of templates) {
        const existing = await this.templateRepository.findOne({
          where: { name: templateData.name },
        });

        if (!existing) {
          const template = this.templateRepository.create(templateData);
          await this.templateRepository.save(template);
          this.logger.log(`✓ Seeded template: ${templateData.name}`);
        }
      }

      this.logger.log('Template seeding completed');
    } catch (error) {
      // Proper error handling - log but don't crash the app
      this.logger.error(
        `Failed to seed templates: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get predefined appointment confirmation templates
   * DRY principle - centralized template definitions
   */
  private getPredefinedTemplates(): Partial<NotificationTemplate>[] {
    return [
      {
        name: 'booking-confirmation-classic',
        subject: 'Appointment Confirmed - {{serviceName}}',
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .checkmark { font-size: 48px; margin-bottom: 10px; }
    .content { padding: 30px 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4CAF50; border-radius: 4px; }
    .details p { margin: 10px 0; }
    .details strong { color: #4CAF50; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; background-color: #f0f0f0; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="checkmark">✓</div>
      <h1>Appointment Confirmed!</h1>
    </div>
    <div class="content">
      <p>Dear {{fullName}},</p>
      <p>Great news! Your appointment has been confirmed. We look forward to serving you.</p>
      
      <div class="details">
        <p><strong>Service:</strong> {{serviceName}}</p>
        <p><strong>Date:</strong> {{date}}</p>
        <p><strong>Time:</strong> {{startTime}} - {{endTime}}</p>
      </div>

      <p><strong>Important Reminders:</strong></p>
      <ul>
        <li>Please arrive 5-10 minutes early</li>
        <li>Bring any relevant materials or documentation</li>
        <li>Contact us if you need to reschedule</li>
      </ul>

      <p>Thank you for choosing our services!</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
      <p>&copy; {{year}} Salon Booking System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      },
      {
        name: 'booking-confirmation-modern',
        subject: 'Your Appointment is Confirmed - {{serviceName}}',
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #2c3e50; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 40px auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; font-weight: 300; }
    .status { display: inline-block; background-color: rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 20px; margin-top: 15px; font-size: 14px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #667eea; margin-bottom: 20px; }
    .details-box { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 8px; margin: 25px 0; }
    .detail-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.5); }
    .detail-item:last-child { border-bottom: none; }
    .detail-label { color: #667eea; font-weight: 600; }
    .detail-value { color: #2c3e50; font-weight: 500; }
    .footer { background-color: #2c3e50; color: white; padding: 30px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Appointment Confirmed</h1>
      <div class="status">✓ CONFIRMED</div>
    </div>
    <div class="content">
      <p class="greeting">Hello {{fullName}},</p>
      <p>Your appointment has been successfully confirmed. We're excited to see you!</p>
      
      <div class="details-box">
        <div class="detail-item">
          <span class="detail-label">Service</span>
          <span class="detail-value">{{serviceName}}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Date</span>
          <span class="detail-value">{{date}}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Time</span>
          <span class="detail-value">{{startTime}} - {{endTime}}</span>
        </div>
      </div>

      <p>Please arrive a few minutes early. We look forward to providing you with excellent service.</p>
    </div>
    <div class="footer">
      <p>Automated notification - No reply needed</p>
      <p>&copy; {{year}} Salon Booking System</p>
    </div>
  </div>
</body>
</html>`,
      },
      {
        name: 'booking-confirmation-elegant',
        subject: 'Confirmed: Your {{serviceName}} Appointment',
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #fafafa; }
    .container { max-width: 650px; margin: 30px auto; background-color: white; border: 1px solid #e0e0e0; }
    .header { background-color: #1a1a1a; color: #d4af37; padding: 35px 30px; text-align: center; border-bottom: 3px solid #d4af37; }
    .header h1 { margin: 0; font-size: 30px; letter-spacing: 2px; font-weight: normal; }
    .subheader { color: white; font-size: 14px; margin-top: 10px; letter-spacing: 1px; }
    .content { padding: 40px 35px; }
    .salutation { font-size: 16px; color: #d4af37; font-style: italic; margin-bottom: 20px; }
    .details-card { border: 2px solid #d4af37; padding: 25px; margin: 25px 0; background-color: #fefefe; }
    .details-card h3 { margin: 0 0 15px 0; color: #1a1a1a; font-size: 18px; text-align: center; border-bottom: 1px solid #d4af37; padding-bottom: 10px; }
    .detail-row { margin: 12px 0; padding: 8px 0; }
    .detail-row strong { color: #d4af37; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .note { background-color: #f9f9f9; border-left: 3px solid #d4af37; padding: 15px; margin: 20px 0; font-style: italic; }
    .footer { background-color: #1a1a1a; color: #999; padding: 25px; text-align: center; font-size: 12px; }
    .signature { font-family: 'Brush Script MT', cursive; font-size: 20px; color: #d4af37; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>APPOINTMENT CONFIRMED</h1>
      <div class="subheader">Luxury Service Experience</div>
    </div>
    <div class="content">
      <p class="salutation">Dear {{fullName}},</p>
      <p>We are delighted to confirm your appointment. It is our pleasure to serve you.</p>
      
      <div class="details-card">
        <h3>Appointment Details</h3>
        <div class="detail-row">
          <strong>Service:</strong> {{serviceName}}
        </div>
        <div class="detail-row">
          <strong>Date:</strong> {{date}}
        </div>
        <div class="detail-row">
          <strong>Time:</strong> {{startTime}} - {{endTime}}
        </div>
      </div>

      <div class="note">
        <strong>Please Note:</strong> We recommend arriving 10 minutes prior to your appointment time to ensure a seamless experience.
      </div>

      <p>Should you have any questions or require changes to your appointment, please do not hesitate to contact us.</p>
      
      <div class="signature">With warm regards,<br>The Management</div>
    </div>
    <div class="footer">
      <p>This is an automated confirmation message</p>
      <p>&copy; {{year}} Salon Booking System - Premium Services</p>
    </div>
  </div>
</body>
</html>`,
      },
      {
        name: 'booking-confirmation-simple',
        subject: 'Appointment Confirmed',
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #ddd; }
    h1 { color: #2196F3; font-size: 24px; margin-bottom: 20px; }
    .details { background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .details p { margin: 8px 0; }
    .highlight { color: #2196F3; font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✓ Appointment Confirmed</h1>
    
    <p>Hi {{fullName}},</p>
    <p>Your appointment has been confirmed.</p>
    
    <div class="details">
      <p><span class="highlight">Service:</span> {{serviceName}}</p>
      <p><span class="highlight">Date:</span> {{date}}</p>
      <p><span class="highlight">Time:</span> {{startTime}} - {{endTime}}</p>
    </div>

    <p>Please arrive on time. Contact us if you need to make changes.</p>
    
    <p>Thank you!</p>
    
    <div class="footer">
      <p>&copy; {{year}} Salon Booking System</p>
    </div>
  </div>
</body>
</html>`,
      },
    ];
  }
}
