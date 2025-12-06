import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/dto';
import { hashPassword } from '../../common/utils';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find user by email
   * @param email - User email
   * @returns User if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User if found
   * @throws NotFoundException if user doesn't exist
   */
  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find all users
   * @returns Array of users
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * Create a new user
   * @param registerDto - User registration data
   * @returns Created user
   * @throws ConflictException if email already exists
   */
  async create(registerDto: RegisterDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password before creating user
    const hashedPassword = await hashPassword(registerDto.password);

    // Create new user with hashed password
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  /**
   * Find user by verification token
   * @param token - Verification token
   * @returns User if found, null otherwise
   */
  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { verificationToken: token },
    });
  }

  /**
   * Update user fields
   * @param id - User ID
   * @param updateData - Partial user data to update
   * @returns Updated user
   */
  async update(id: number, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  /**
   * Update user verification status
   * @param id - User ID
   * @param isVerified - Verification status
   * @returns Updated user
   */
  async updateVerificationStatus(
    id: number,
    isVerified: boolean,
  ): Promise<User> {
    return this.update(id, { isVerified });
  }
}
