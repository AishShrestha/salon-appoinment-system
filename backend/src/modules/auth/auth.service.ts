import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { UserService } from '../user/user.service';
import {
  LoginDto,
  RegisterDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { User } from '../user/entities/user.entity';
import { VerificationEmailJob } from '../email/email.processor';
import {
  generateTokenExpiry,
  generateVerificationToken,
  isTokenExpired,
} from 'src/common/utils/token.util';

import { ChangePasswordDto } from './dto/change-password.dto';
import {
  hashPassword,
  comparePassword,
} from '../../common/utils/password.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Send password reset email if user exists
   * @param forgotPasswordDto - Contains user email
   * @returns Success message (always generic)
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const normalizedEmail = email.trim().toLowerCase();
    const minuteKey = `fp:minute:${normalizedEmail}`;
    const dailyKey = `fp:daily:${normalizedEmail}`;
    const GENERIC_RESPONSE = {
      status: true,
      message: 'A password reset link has been sent.',
    };

    // Email-based rate limiting (before DB query)
    try {
      // Check per-minute limit
      const minute = await this.cacheManager.get(minuteKey);
      if (minute) {
        this.logger.warn(
          `Forgot-password minute limit hit for ${normalizedEmail}`,
        );
        return GENERIC_RESPONSE;
      }

      // Check per-day limit
      const daily = await this.cacheManager.get(dailyKey);
      if (daily && Number(daily) >= 5) {
        this.logger.warn(
          `Forgot-password daily limit hit for ${normalizedEmail}`,
        );
        return GENERIC_RESPONSE;
      }

      // Set minute key (1 min TTL)
      await this.cacheManager.set(minuteKey, 1, 60);
      // Increment daily key (24h TTL)
      if (daily) {
        await this.cacheManager.set(dailyKey, Number(daily) + 1, 86400);
      } else {
        await this.cacheManager.set(dailyKey, 1, 86400);
      }
    } catch (err) {
      this.logger.error('Error in email-based rate limiting', err);
      // Fail open: allow request to proceed
    }

    // Now check if user exists and send email if so
    let user: User | null = null;
    try {
      user = await this.userService.findByEmail(normalizedEmail);
    } catch (err) {
      // Do not leak info
      this.logger.error('Error querying user for forgot-password', err);
    }

    if (user) {
      const passwordResetToken = generateVerificationToken();
      const passwordResetTokenExpiry = generateTokenExpiry();

      try {
        await this.userService.update(user.id, {
          passwordResetToken,
          passwordResetTokenExpiry,
        });

        await this.emailQueue.add(
          'send-password-reset',
          {
            email: user.email,
            name: user.name,
            token: passwordResetToken,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );

        this.logger.log(`Password reset email queued for user: ${user.email}`);
      } catch (err) {
        this.logger.error('Error queueing password reset email', err);
      }
    } else {
      this.logger.warn(
        `Password reset requested for non-existing email: ${normalizedEmail}`,
      );
    }

    // Always return generic response
    return GENERIC_RESPONSE;
  }

  /**
   * Change password for authenticated user
   * @param user - Current user object (from request)
   * @param changePasswordDto - Contains currentPassword and newPassword
   */
  async changePassword(user: any, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;
    const userId = user.id;

    // Fetch latest user from DB
    const dbUser = await this.userService.findById(userId);
    if (!dbUser) {
      this.logger.warn(
        `Password change attempted for non-existent user: ${userId}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      dbUser.password,
    );
    if (!isCurrentPasswordValid) {
      this.logger.warn(`Invalid current password for user: ${userId}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Prevent password reuse
    const isReuse = await comparePassword(newPassword, dbUser.password);
    if (isReuse) {
      this.logger.warn(`Password reuse attempt for user: ${userId}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Prepare update object
    const updateObj: any = {
      password: hashedNewPassword,
      passwordChangedAt: new Date(),
    };
    // Clear sensitive fields if present
    if ('passwordResetToken' in dbUser) updateObj.passwordResetToken = null;
    if ('passwordResetTokenExpiry' in dbUser)
      updateObj.passwordResetTokenExpiry = null;

    await this.userService.update(userId, updateObj);

    this.logger.log(`Password changed for user: ${userId}`);

    return {
      status: true,
      message: 'Password changed successfully.',
    };
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) return null;

    return user;
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in.',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }

  /**
   * Register user
   */
  async register(registerDto: RegisterDto) {
    const user = await this.userService.create(registerDto);

    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = generateTokenExpiry();

    await this.userService.update(user.id, {
      verificationToken,
      verificationTokenExpiry,
    });

    await this.emailQueue.add(
      'send-verification',
      {
        email: user.email,
        name: user.name,
        token: verificationToken,
      } as VerificationEmailJob,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    this.logger.log(
      `Verification email queued for user: ${user.email} (ID: ${user.id})`,
    );

    return {
      message:
        'Registration successful! Please check your email to verify your account.',
      email: user.email,
    };
  }

  /**
   * Verify email
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { token } = verifyEmailDto;

    const user = await this.userService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      !user.verificationTokenExpiry ||
      isTokenExpired(user.verificationTokenExpiry)
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    if (!user.isVerified) {
      await this.userService.update(user.id, {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Email verified successfully!',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: true,
      },
    };
  }

  /**
   * Reset user password using token
   * @param resetPasswordDto - Contains token and new password
   * @returns Generic success response (always the same)
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;
    const normalizedToken = token.trim();

    const GENERIC_RESPONSE = {
      status: true,
      message: 'Password has been reset successfully.',
    };

    // Email-based rate limiting (1 reset per minute per token)
    const tokenKey = `reset:${normalizedToken}`;
    try {
      const recentReset = await this.cacheManager.get(tokenKey);
      if (recentReset) {
        this.logger.warn(
          `Password reset rate limit hit for token: ${normalizedToken.substring(
            0,
            10,
          )}...`,
        );
        return GENERIC_RESPONSE;
      }
    } catch (err) {
      this.logger.error('Error checking reset rate limit', err);
      // Fail open: allow request to proceed
    }

    // Attempt to find user by token (silent failure)
    let user: User | null = null;
    try {
      console.log(
        'Searching for user with password reset token:',
        normalizedToken,
      );
      user = await this.userService.findByPasswordResetToken(normalizedToken);

      console.log('User found for password reset:', user);
    } catch (err) {
      // Silent failure - do not reveal error
      this.logger.error('Error querying user for password reset', err);
    }

    // Process reset if user exists and token is valid
    if (user) {
      // Check token expiry
      const isExpired =
        !user.passwordResetTokenExpiry ||
        isTokenExpired(user.passwordResetTokenExpiry);

      if (!isExpired) {
        try {
          // Hash new password
          const hashedPassword = await hashPassword(newPassword);

          // Update password and invalidate token
          await this.userService.update(user.id, {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetTokenExpiry: null,
          });

          // Set rate limit key (1 minute TTL)
          await this.cacheManager.set(tokenKey, 1, 60);

          this.logger.log(`Password reset successful for user ID: ${user.id}`);
        } catch (err) {
          // Silent failure - do not reveal error
          this.logger.error(
            `Error resetting password for user ID: ${user.id}`,
            err,
          );
        }
      } else {
        this.logger.warn(
          `Expired token used for password reset attempt (User ID: ${user.id})`,
        );
      }
    } else {
      this.logger.warn(
        `Password reset attempted with invalid token: ${normalizedToken.substring(
          0,
          10,
        )}...`,
      );
    }

    // Always return the same generic response
    return GENERIC_RESPONSE;
  }
}
