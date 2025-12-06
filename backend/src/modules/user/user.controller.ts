import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { Auth, CurrentUser } from '../auth/decorators';
import { UserRole } from '../../common/enums';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get all users - Admin only
   * GET /users
   * Requires: JWT token + admin role
   */
  @Get()
  @Auth(UserRole.ADMIN) // Requires authentication + admin role
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
   * Requires: JWT token (any role)
   */
  @Get('profile')
  @Auth() // Requires authentication, any role
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
   * Admin-only dashboard stats
   * GET /users/admin/dashboard
   * Requires: JWT token + admin role
   */
  @Get('admin/dashboard')
  @Auth(UserRole.ADMIN) // Requires authentication + admin role
  @ApiOperation({ summary: 'Get admin dashboard statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics',
    schema: {
      example: {
        message: 'Admin dashboard data',
        data: {
          totalUsers: 10,
          verifiedUsers: 7,
          adminUser: {
            id: 1,
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getAdminDashboard(@CurrentUser() user: any) {
    const users = await this.userService.findAll();

    return {
      message: 'Admin dashboard data',
      data: {
        totalUsers: users.length,
        adminUser: user,
        verifiedUsers: users.filter((u) => u.isVerified).length,
      },
    };
  }
}
