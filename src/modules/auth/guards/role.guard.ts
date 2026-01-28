import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator'; // 👈 Import đúng tên file số ít

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

    if (!user || !user.roles) {
      throw new ForbiddenException('User không tồn tại hoặc chưa có Role');
    }

    // 🔥 FIX LOGIC QUAN TRỌNG:
    // Role trong user có thể là String ('SUPER_ADMIN') hoặc Object ({ id: 1, slug: 'SUPER_ADMIN' })
    // Ta cần xử lý cả 2 trường hợp để không bị lỗi
    const hasRole = user.roles.some((role: any) => {
      const roleSlug = typeof role === 'string' ? role : role.slug; // Lấy slug nếu là object
      return requiredRoles.includes(roleSlug);
    });

    if (!hasRole) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này!');
    }
    return true;
  }
}
