import { Injectable, InternalServerErrorException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { AllowedDomain } from '../../database/entities/allowed-domain.entity';
import { Role } from '../../database/entities/role.entity';
import { ManagementPosition } from '../../database/entities/management-position.entity';
import { Department } from '../../database/entities/department.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(AllowedDomain) private domainRepository: Repository<AllowedDomain>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    private jwtService: JwtService,
    private systemLogsService: SystemLogsService, // 👈 Đã Inject SystemLogsService
  ) {}

  async getPublicDomains() {
    const domains = await this.domainRepository.find({ select: ['domain'] });
    return { domains };
  }

  // Hàm này được gọi bởi Google/Microsoft Strategy
  async validateOAuthLogin(reqUser: any) {
    const email = reqUser.email;
    if (!email) throw new InternalServerErrorException('Email not found from provider');

    let user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });

    const userCount = await this.userRepository.count();
    const isFirstUser = userCount === 0;
    const isAdmin = user?.roles?.some((r) => r.slug === 'ADMIN') || false;

    const domain = email.split('@')[1];
    const isDomainAllowed = await this.domainRepository.findOne({ where: { domain } });

    // ⛔ LOGIC CHẶN (GHI LOG THẤT BẠI Ở ĐÂY)
    if (!isFirstUser && !isAdmin) {
      if (!isDomainAllowed) {
        console.warn(`⛔ Blocked login attempt: ${email} (Domain not allowed)`);

        // 📸 GHI LOG: ĐĂNG NHẬP THẤT BẠI (Do sai Domain)
        if (this.systemLogsService) {
          await this.systemLogsService.createLog({
            userId: user?.id ?? undefined, // Nếu user chưa tồn tại thì để undefined → ghi log không gắn user
            action: 'LOGIN',
            resource: 'AUTH',
            message: `Đăng nhập thất bại: Tên miền @${domain} bị chặn`,
            details: { email, provider: reqUser.provider, error: 'DOMAIN_NOT_ALLOWED' },
            status: 'FAILED' as any,
          });
        }

        throw new ForbiddenException('DOMAIN_NOT_ALLOWED');
      }
    }

    // Tạo mới hoặc Cập nhật User...
    if (!user) {
      const roleSlug = isFirstUser ? 'ADMIN' : 'USER';
      const roleName = isFirstUser ? 'Admin' : 'User';

      let role = await this.roleRepository.findOne({ where: { slug: roleSlug } });
      if (!role) {
        role = await this.roleRepository.save({
          name: roleName,
          slug: roleSlug,
          description: 'Auto generated',
        });
      }

      const newUser = this.userRepository.create({
        email,
        name: reqUser.firstName ? `${reqUser.firstName} ${reqUser.lastName}` : reqUser.name,
        avatarUrl: reqUser.picture || reqUser.avatar,
        isActive: true,
        googleId: reqUser.provider === 'google' ? reqUser.id || reqUser.sub : null,
        microsoftId: reqUser.provider === 'microsoft' ? reqUser.id || reqUser.sub : null,
        roles: [role],
      });

      user = await this.userRepository.save(newUser);
      console.log(`✅ Created New User: ${email}`);
    } else {
      user.avatarUrl = reqUser.picture || reqUser.avatar;
      const providerId = reqUser.id || reqUser.sub;
      if (reqUser.provider === 'google') user.googleId = providerId;
      if (reqUser.provider === 'microsoft') user.microsoftId = providerId;

      user = await this.userRepository.save(user);
    }

    // Gắn thêm thông tin provider vào user để hàm login bên dưới có cái để log
    user['loginProvider'] = reqUser.provider;

    return user;
  }

  // Hàm này được gọi bởi AuthController để tạo Token
  async login(user: any) {
    // Reload user with department relation (validateOAuthLogin chỉ load roles)
    const fullUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['roles', 'department', 'managementPosition'],
    });

    const userRoles = fullUser?.roles || user.roles || [];
    const payload = {
      sub: user.id,
      email: user.email,
      roles: userRoles.map((r) => r.slug),
      name: user.name,
      picture: user.avatarUrl,
    };

    // 📸 GHI LOG: ĐĂNG NHẬP THÀNH CÔNG
    if (this.systemLogsService) {
      await this.systemLogsService.createLog({
        userId: user.id,
        action: 'LOGIN',
        resource: 'AUTH',
        message: `Đăng nhập thành công vào hệ thống`,
        details: { method: `SSO (${user.loginProvider || 'Google/Microsoft'})`, email: user.email },
        status: 'SUCCESS' as any,
      });
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatarUrl,
        roles: userRoles.map((r) => r.slug),
        // 🔥 Thêm các field để FE kiểm tra profile đã hoàn tất chưa
        jobTitle: fullUser?.jobTitle || null,
        profileCompleted: fullUser?.profileCompleted || false,
        department: fullUser?.department
          ? { id: fullUser.department.id, name: fullUser.department.name }
          : null,
        managementPosition: fullUser?.managementPosition
          ? {
              id: fullUser.managementPosition.id,
              name: fullUser.managementPosition.name,
              slug: fullUser.managementPosition.slug,
              permissionLevel: fullUser.managementPosition.permissionLevel,
            }
          : null,
      },
    };
  }

  // 📸 HÀM MỚI: XỬ LÝ ĐĂNG XUẤT ĐỂ GHI LOG
  async logout(user: any) {
    if (this.systemLogsService && user) {
      // Vì payload JWT của mày dùng 'sub' làm ID, nên user từ token sẽ có sub hoặc id
      const userId = user.id || user.sub;

      await this.systemLogsService.createLog({
        userId: userId,
        action: 'LOGOUT',
        resource: 'AUTH',
        message: `Đã đăng xuất khỏi hệ thống`,
        status: 'SUCCESS' as any,
      });
    }
    return { message: 'Đăng xuất thành công' };
  }

  // 🧪 HÀM MỚI: BYPASS LOGIN CHO AUTOMATION TEST
  async bypassLogin(
    email: string,
    roleSlug?: string,
    name?: string,
    managementPositionSlug?: string,
    departmentName?: string,
  ) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    let user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'department', 'managementPosition'],
    });

    if (!user) {
      // Tự động tạo user mới cho môi trường test
      const slug = (roleSlug || 'USER').toUpperCase();
      let role = await this.roleRepository.findOne({ where: { slug } });
      if (!role) {
        role = await this.roleRepository.save({
          name: slug === 'ADMIN' ? 'Admin' : 'User',
          slug,
          description: 'Auto generated for testing',
        });
      }

      // Tìm chức vụ quản lý nếu được yêu cầu
      let mPosition: ManagementPosition | null = null;
      if (managementPositionSlug) {
        mPosition = await this.userRepository.manager.findOne(ManagementPosition, {
          where: { slug: managementPositionSlug.toUpperCase() },
        });
      }

      // Tìm bộ môn / phòng ban
      let dept: Department | null = null;
      if (departmentName) {
        dept = await this.userRepository.manager.findOne(Department, {
          where: { name: departmentName },
        });
      }

      // Nếu không chỉ định bộ môn, gán mặc định bộ môn đầu tiên trong DB để tester dễ test
      if (!dept) {
        const allDepts = await this.userRepository.manager.find(Department);
        if (allDepts.length > 0) {
          dept = allDepts[0];
        }
      }

      const newUser = this.userRepository.create({
        email,
        name: name || email.split('@')[0],
        isActive: true,
        roles: [role],
        profileCompleted: true,
        managementPosition: mPosition || undefined,
        department: dept || undefined,
        jobTitle: 'Giảng viên' as any, // Chức danh mặc định
      });

      user = await this.userRepository.save(newUser);
      console.log(
        `[TESTING] Auto created mock user for testing: ${email} (Role: ${slug}, Position: ${managementPositionSlug || 'None'})`,
      );
    }

    if (!user) {
      throw new InternalServerErrorException('Failed to retrieve or create user');
    }

    user['loginProvider'] = 'AutomationBypass';
    return this.login(user);
  }
}
