import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { UserService } from '../user/user.service';
import { LoginDto, RegisterDto, VerifyEmailDto } from './dto';
import { comparePassword } from '../../common/utils';
import { User } from '../user/entities/user.entity';
import { VerificationEmailJob } from '../email/email.processor';
import {
  generateTokenExpiry,
  generateVerificationToken,
  isTokenExpired,
} from 'src/common/utils/token.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  /**
   * Validate user credentials
   * @param email - User email
   * @param password - Plain text password
   * @returns User if credentials are valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return null;
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Login user and generate JWT token
   * @param loginDto - Login credentials
   * @returns Access token and user info
   * @throws UnauthorizedException if credentials are invalid or email not verified
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if email is verified
    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in. Check your inbox for the verification link.',
      );
    }

    // Generate JWT token
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
   * Register a new user with email verification
   * @param registerDto - Registration data
   * @returns Success message (no JWT until verification)
   */
  async register(registerDto: RegisterDto) {
    // Create user (isVerified defaults to false)
    const user = await this.userService.create(registerDto);

    //Generate verification token and expiry
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = generateTokenExpiry();

    // Save verification token to user
    await this.userService.update(user.id, {
      verificationToken,
      verificationTokenExpiry,
    });

    //Queue verification email asynchronously
    await this.emailQueue.add(
      'send-verification',
      {
        email: user.email,
        name: user.name,
        token: verificationToken,
      } as VerificationEmailJob,
      {
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2s delay
        },
      },
    );

    this.logger.log(
      `Verification email queued for user: ${user.email} (ID: ${user.id})`,
    );

    return {
      message:
        'Registration successful! Please check your email to verify your account before logging in.',
      email: user.email,
    };
  }

  /**
   * Verify user email with token and issue JWT
   * @param verifyEmailDto - Contains verification token
   * @returns JWT access token and user info
   * @throws BadRequestException if token is invalid or expired
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { token } = verifyEmailDto;

    // Find user by verification token
    const user = await this.userService.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    //Check if token has expired
    if (
      !user.verificationTokenExpiry ||
      isTokenExpired(user.verificationTokenExpiry)
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    //Check if already verified
    if (user.isVerified) {
      // Already verified, just return JWT
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        message: 'Email already verified',
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

    //Update user as verified and clear token
    await this.userService.update(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });

    this.logger.log(
      `User verified successfully: ${user.email} (ID: ${user.id})`,
    );

    //Generate JWT token for the newly verified user
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Email verified successfully! You can now log in.',
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
}
