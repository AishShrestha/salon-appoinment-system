import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<string>('SMTP_PORT')),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }
  /**
   * Send password reset email to user
   * @param email - User's email address
   * @param name - User's name
   * @param token - Password reset token
   */
  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    try {
      const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM_EMAIL'),
        to: email,
        subject: 'Reset Your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${name},</h2>
            <p>You requested a password reset. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #2196F3; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send verification email to user
   * @param email - User's email address
   * @param name - User's name
   * @param token - Verification token
   */
  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    try {
      const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM_EMAIL'),
        to: email,
        subject: 'Verify Your Email Address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome ${name}!</h2>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              If you didn't create this account, please ignore this email.
            </p>
          </div>
        `,
      });

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}`,
        error.stack,
      );
      throw error;
    }
  }
}
