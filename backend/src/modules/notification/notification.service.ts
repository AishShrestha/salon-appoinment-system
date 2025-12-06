import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * NotificationService - Handles email notifications
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  /**
   * Send booking confirmation email (auto-confirmed)
   */
  async sendBookingConfirmation(
    email: string,
    fullName: string,
    serviceName: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get('SMTP_FROM'),
      to: email,
      subject: 'Booking Confirmation - Your Appointment is Scheduled',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Confirmed! ✓</h1>
            </div>
            <div class="content">
              <p>Dear ${fullName},</p>
              <p><strong>Great news!</strong> Your appointment has been confirmed by our team. Here are the details:</p>
              
              <div class="details">
                <p><strong>Service:</strong> ${serviceName}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
              </div>

              <p>Please arrive 5-10 minutes before your scheduled time.</p>
              <p>If you need to cancel or reschedule, please contact us at least 24 hours in advance.</p>
              
              <p>We look forward to seeing you!</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Salon Booking System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Booking confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send booking confirmation to ${email}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send booking cancellation email
   */
  async sendBookingCancellation(
    email: string,
    fullName: string,
    serviceName: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get('SMTP_FROM'),
      to: email,
      subject: 'Appointment Cancelled',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
            .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Cancelled</h1>
            </div>
            <div class="content">
              <p>Dear ${fullName},</p>
              <p>Your appointment has been cancelled. Here are the details of the cancelled appointment:</p>
              
              <div class="details">
                <p><strong>Service:</strong> ${serviceName}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
              </div>

              <p>If you did not request this cancellation or would like to reschedule, please contact us as soon as possible.</p>
              
              <p>We hope to serve you again soon!</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Salon Booking System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Booking cancellation email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send booking cancellation to ${email}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
