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

    // Nếu không có email thì chặn luôn
    if (!email) throw new InternalServerErrorException('Email not found from provider');

    const name = reqUser.firstName ? `${reqUser.firstName} ${reqUser.lastName}` : reqUser.name;
    const avatar = reqUser.picture || reqUser.avatar || null;
    const providerId = reqUser.id || reqUser.sub;
    const provider = reqUser.provider || 'google'; // mặc định là google nếu thiếu

    // ---------------------------------------------------------
    // 🔥 LOGIC TỰ ĐỘNG PHÂN QUYỀN (AUTO ASSIGN ROLE)
    // ---------------------------------------------------------

    // 1. Kiểm tra xem User này đã tồn tại chưa?
    let user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles'], // Quan trọng: Phải load cả roles ra
    });

    // 2. Nếu chưa có User -> Tạo mới
    if (!user) {
      // Đếm số lượng user đang có trong DB
      const userCount = await this.userRepository.count();

      // Nếu count = 0 -> Đây là FIRST USER -> SYSTEM_ADMIN
      // Nếu count > 0 -> Đây là user thường -> LECTURER
      const isFirstUser = userCount === 0;
      const roleSlug = isFirstUser ? 'SYSTEM_ADMIN' : 'LECTURER';
      const roleName = isFirstUser ? 'System Admin' : 'Lecturer';

      // 3. Tìm Role trong DB, nếu chưa có thì TỰ TẠO (Self-healing)
      let role = await this.roleRepository.findOne({ where: { slug: roleSlug } });

      if (!role) {
        console.log(`⚠️ Role ${roleSlug} chưa tồn tại. Đang tự động tạo...`);
        role = await this.roleRepository.save({
          name: roleName,
          slug: roleSlug,
          description: isFirstUser ? 'Super User - Auto generated' : 'Lecturer - Auto generated',
        });
      }

      // 4. Kiểm tra Whitelist (Chỉ check nếu KHÔNG PHẢI là First User)
      // Nghĩa là: Ông đầu tiên luôn được vào. Ông thứ 2 trở đi mới bị check domain.
      if (!isFirstUser) {
        const domain = email.split('@')[1];
        const isAllowed = await this.domainRepository.findOne({ where: { domain } });
        if (!isAllowed) {
          throw new ForbiddenException(
            `Domain @${domain} is not authorized. Please contact Admin.`,
          );
        }
      }

      // 5. Tạo User mới với Role đã xác định
      const newUser = this.userRepository.create({
        email,
        name,
        avatarUrl: avatar,
        isActive: true,
        googleId: provider === 'google' ? providerId : null,
        microsoftId: provider === 'microsoft' ? providerId : null,
        roles: [role], // Gán role ngay lập tức
      });

      user = await this.userRepository.save(newUser);

      // Log ra để biết ông nào vừa đăng ký thành công
      console.log(`✅ Created New User: ${email} | Role: ${roleSlug}`);
    } else {
      // Nếu user đã tồn tại -> Update thông tin mới nhất (Avatar, Provider ID)
      user.avatarUrl = avatar;
      if (provider === 'google') user.googleId = providerId;
      if (provider === 'microsoft') user.microsoftId = providerId;
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
