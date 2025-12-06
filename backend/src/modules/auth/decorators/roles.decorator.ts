import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../common/enums';

export const ROLES_KEY = 'roles';

/**
 * Roles Decorator - Specify required roles for a route
 * Usage: @Roles(UserRole.ADMIN, UserRole.USER)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
