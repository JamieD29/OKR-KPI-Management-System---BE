import { Injectable, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
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
  ) {}

  // Trong class AuthService
  async getPublicDomains() {
    // Lấy list domain từ DB trả về cho Frontend hiển thị chơi thôi
    const domains = await this.domainRepository.find({
      select: ['domain'], // Chỉ lấy tên domain, không cần lấy ID hay ngày tạo
    });
    return { domains };
  }

  // Hàm này được gọi bởi Google/Microsoft Strategy
  async validateOAuthLogin(reqUser: any) {
    const email = reqUser.email;
    if (!email) throw new InternalServerErrorException('Email not found from provider');

    // 1. Lấy thông tin User (nếu có)
    let user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });

    // ---------------------------------------------------------
    // 🔥 SỬA LẠI: CHECK DOMAIN CHO TẤT CẢ (CŨ + MỚI)
    // ---------------------------------------------------------

    // Đếm user để biết có phải hệ thống mới tinh không
    const userCount = await this.userRepository.count();
    const isFirstUser = userCount === 0;

    // Kiểm tra user hiện tại có phải Admin không (để tránh lock nhầm Admin)
    // Nếu user chưa tồn tại (người mới) thì mặc định isAdmin = false
    const isAdmin = user?.roles?.some((r) => r.slug === 'SYSTEM_ADMIN') || false;

    // Lấy domain từ email
    const domain = email.split('@')[1];
    const isDomainAllowed = await this.domainRepository.findOne({ where: { domain } });

    // LOGIC CHẶN:
    // Nếu KHÔNG phải user đầu tiên (First User)
    // VÀ KHÔNG phải là Admin (nếu là user cũ)
    // VÀ Domain không nằm trong Whitelist
    // -> THÌ CHẶN LUÔN
    if (!isFirstUser && !isAdmin) {
      if (!isDomainAllowed) {
        console.warn(`⛔ Blocked login attempt: ${email} (Domain not allowed)`);
        throw new ForbiddenException('DOMAIN_NOT_ALLOWED'); // Message này FE sẽ bắt để hiện trang 404
      }
    }

    // ---------------------------------------------------------
    // SAU KHI CHECK XONG MỚI ĐẾN ĐOẠN TẠO HOẶC UPDATE
    // ---------------------------------------------------------

    // 2. Nếu chưa có User -> Tạo mới
    if (!user) {
      // Logic xác định Role cho người mới
      const roleSlug = isFirstUser ? 'SYSTEM_ADMIN' : 'USER'; // Sửa LECTURER -> USER theo DB mới
      const roleName = isFirstUser ? 'System Admin' : 'User';

      let role = await this.roleRepository.findOne({ where: { slug: roleSlug } });
      if (!role) {
        role = await this.roleRepository.save({
          name: roleName,
          slug: roleSlug,
          description: 'Auto generated',
        });
      }

      // Tạo user
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
      // 3. User cũ -> Cập nhật info
      user.avatarUrl = reqUser.picture || reqUser.avatar;
      const providerId = reqUser.id || reqUser.sub;
      if (reqUser.provider === 'google') user.googleId = providerId;
      if (reqUser.provider === 'microsoft') user.microsoftId = providerId;

      user = await this.userRepository.save(user);
    }

    return user;
  }

  // Hàm này được gọi bởi AuthController để tạo Token
  async login(user: any) {
    // Đảm bảo roles luôn là mảng
    const userRoles = user.roles || [];

    const payload = {
      sub: user.id,
      email: user.email,
      roles: userRoles.map((r) => r.slug),
      name: user.name,
      picture: user.avatarUrl,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatarUrl,
        roles: userRoles.map((r) => r.slug), // Trả về slug role cho Frontend dùng
      },
    };
  }
}
