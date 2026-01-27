import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // Không yêu cầu role thì cho qua
    }

    const { user } = context.switchToHttp().getRequest();

    // Logic check role: user.roles là mảng string ['SYSTEM_ADMIN', 'USER']
    const hasRole = user.roles?.some((role: string) => requiredRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Không được cấp quyền!');
    }
    return true;
  }
}
