import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/dto';

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

    // Create new user (password will be hashed by @BeforeInsert hook)
    const user = this.userRepository.create(registerDto);
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
    const user = await this.findById(id);
    user.isVerified = isVerified;
    return this.userRepository.save(user);
  }
}
