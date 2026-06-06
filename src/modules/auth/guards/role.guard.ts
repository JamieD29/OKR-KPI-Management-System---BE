import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator'; // 👈 Import the decorator metadata key

/**
 * Guard that enforces authorization based on user roles.
 * It extracts the required roles set via decorators on routes/controllers
 * and matches them against the current authenticated user's roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * @param reflector Utility to retrieve metadata attached to controllers or handlers
   */
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the current request is authorized based on the user's roles.
   * 
   * @param context Execution context of the request
   * @returns boolean true if authorized, throws ForbiddenException if unauthorized
   * @throws {ForbiddenException} If user is not found, has no roles, or lacks the required roles
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // If no roles are required on the endpoint, allow access
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      throw new ForbiddenException('User không tồn tại hoặc chưa có Role');
    }

    // IMPORTANT LOGIC FIX:
    // The user's role can either be a plain String (e.g., 'ADMIN') or an Object (e.g., { id: '...', slug: 'ADMIN' })
    // We must handle both cases gracefully to prevent runtime errors.
    const hasRole = user.roles.some((role: any) => {
      const roleSlug = typeof role === 'string' ? role : role.slug; // Retrieve the slug if the role is an object structure
      return requiredRoles.includes(roleSlug);
    });

    if (!hasRole) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này!');
    }
    return true;
  }
}
