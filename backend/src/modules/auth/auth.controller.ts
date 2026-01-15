import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto';
import { Auth, CurrentUser } from './decorators';
import { UserRole } from 'src/common/enums';

@ApiTags('Authentication')
@Controller('auth')
@SkipThrottle() // Skip global throttle, apply only where specified
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Send password reset email - 3 requests per 5 minutes
   */
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send password reset email',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if user exists.',
    schema: {
      example: {
        status: true,
        message: 'A password reset link has been sent.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  /**
   * Reset password using token - 5 requests per minute
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password using token',
    description:
      'Resets user password using the token sent via email. Always returns success for security.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Generic success response (always the same)',
    schema: {
      example: {
        status: true,
        message: 'Password has been reset successfully.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  /**
   * Register a new user - 3 requests per 5 minutes
   */
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account and sends a verification email. User must verify email before logging in.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered. Verification email sent.',
    schema: {
      example: {
        message:
          'Registration successful! Please check your email to verify your account before logging in.',
        email: 'john@example.com',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Login user - 5 requests per minute
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description:
      'Authenticates user and issues JWT token. User must have verified email.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          email: 'john@example.com',
          name: 'John Doe',
          role: 'user',
          isVerified: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or email not verified',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Verify email - 5 requests per minute
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify user email with token',
    description: 'Verifies user email and issues JWT token for authentication',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully. JWT token issued.',
    schema: {
      example: {
        message: 'Email verified successfully! You can now log in.',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          email: 'john@example.com',
          name: 'John Doe',
          role: 'user',
          isVerified: true,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @Auth(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    schema: {
      example: {
        user: {
          id: 1,
          email: 'john@example.com',
          name: 'John Doe',
          role: 'user',
          isVerified: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: any) {
    return {
      user,
    };
  }

  /**
   * Change password for authenticated user
   */
  @Post('change-password')
  @Auth(UserRole.USER, UserRole.ADMIN)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        status: true,
        message: 'Password changed successfully.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid password' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user, changePasswordDto);
  }
}
