import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { Auth, CurrentUser } from '../auth/decorators';
import { UserRole } from '../../common/enums';
import { ParseUUIDPipe } from '@nestjs/common';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get all users - Admin only
   * GET /users
   */
  @Get()
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    schema: {
      example: {
        message: 'Users retrieved successfully',
        data: [
          {
            id: 1,
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
            isVerified: true,
            createdAt: '2025-12-06T10:00:00Z',
            updatedAt: '2025-12-06T10:00:00Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getAllUsers() {
    const users = await this.userService.findAll();
    return {
      message: 'Users retrieved successfully',
      data: users,
    };
  }

  /**
   * Get current user profile
   * GET /users/profile
   */
  @Get('profile')
  @Auth(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    schema: {
      example: {
        message: 'Profile retrieved successfully',
        data: {
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
      message: 'Profile retrieved successfully',
      data: user,
    };
  }

  /**
   * Get user by ID (Admin only)
   * GET /users/:id
   */
  @Get(':id')
  @Auth(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'User ID',
  })
  @ApiResponse({
    status: 200,
    description: 'User details',
    schema: {
      example: {
        id: 123,
        name: 'John Doe',
        email: 'john@example.com',
        roles: ['ADMIN'],
        status: 'ACTIVE',
        createdAt: '2026-01-01T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: number) {
    const user = await this.userService.getUserById(id);
    return user;
  }
}
