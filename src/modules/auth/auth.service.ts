import { Injectable, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { AllowedDomain } from '../../database/entities/allowed-domain.entity';
import { Role } from '../../database/entities/role.entity';

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
    const isAdmin = user?.roles?.some((r) => r.slug === 'SYSTEM_ADMIN') || false;

    const domain = email.split('@')[1];
    const isDomainAllowed = await this.domainRepository.findOne({ where: { domain } });

    // ⛔ LOGIC CHẶN (GHI LOG THẤT BẠI Ở ĐÂY)
    if (!isFirstUser && !isAdmin) {
      if (!isDomainAllowed) {
        console.warn(`⛔ Blocked login attempt: ${email} (Domain not allowed)`);

        // 📸 GHI LOG: ĐĂNG NHẬP THẤT BẠI (Do sai Domain)
        if (this.systemLogsService) {
          await this.systemLogsService.createLog({
            userId: (user?.id as any) || null, // Nếu user chưa tồn tại thì để null
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
      const roleSlug = isFirstUser ? 'SYSTEM_ADMIN' : 'USER';
      const roleName = isFirstUser ? 'System Admin' : 'User';

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
    const userRoles = user.roles || [];
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
}
