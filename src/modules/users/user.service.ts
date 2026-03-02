import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

// 👇 Import Entities
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { Department } from '../../database/entities/department.entity';

// 👇 Import DTOs
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) { }

  // 🔥 HÀM PHỤ TRỢ: Chuẩn hóa Slug (Để fix lỗi DEAN != dean, SYSTEM_ADMIN != system-admin)
  private normalizeSlug(slug: string): string {
    return slug.toLowerCase().replace(/_/g, '-');
  }

  async create(createUserDto: CreateUserDto) {
    // 1. Check email trùng
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại trong hệ thống');
    }

    const { roles, departmentId, ...basicUserData } = createUserDto;

    // 2. Tạo instance user chỉ với thông tin cơ bản
    const newUser = this.userRepository.create(basicUserData);

    // 3. Xử lý Role (Tìm Entity từ Enum gửi lên)
    if (roles && roles.length > 0) {
      // 👇 Chuẩn hóa slug trước khi tìm
      const normalizedRoles = roles.map((r) => this.normalizeSlug(r));

      const roleEntities = await this.roleRepository.find({
        where: { slug: In(normalizedRoles) },
      });
      newUser.roles = roleEntities;
    } else {
      // Nếu không gửi role -> Gán mặc định USER
      const defaultRole = await this.roleRepository.findOne({
        where: { slug: 'user' }, // db lưu là 'user' thường
      });
      if (defaultRole) newUser.roles = [defaultRole];
    }

    // 4. Xử lý Department (Nếu có)
    if (departmentId) {
      newUser.department = { id: departmentId } as any;
    }

    return this.userRepository.save(newUser);
  }

  // ======================================================
  // 2. FIND ALL: Lấy danh sách (Cho Admin Portal)
  // ======================================================
  async findAll(departmentId?: string) {
    const where: any = {};
    if (departmentId) {
      where.department = { id: departmentId };
    }
    return this.userRepository.find({
      where,
      relations: ['roles', 'department'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // ======================================================
  // 3. FIND ONE: Chi tiết User
  // ======================================================
  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'department'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // ======================================================
  // 4. FIND BY EMAIL (Dùng cho Auth/Login)
  // ======================================================
  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'department'],
    });
  }

  // ======================================================
  // 5. UPDATE PROFILE (Cá nhân tự sửa)
  // ======================================================
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.findOne(userId);

    const { departmentId, ...rest } = updateProfileDto;
    Object.assign(user, rest);

    if (departmentId) {
      user.department = { id: departmentId } as Department;
    }

    return this.userRepository.save(user);
  }

  // ======================================================
  // 6. UPDATE ROLES (Chức năng Admin Phân Quyền) 🔥 QUAN TRỌNG ĐÃ FIX
  // ======================================================
  async updateRoles(userId: string, roleSlugs: string[]) {
    const user = await this.findOne(userId);

    // 👇 1. Chuẩn hóa slug: DEAN -> dean, SYSTEM_ADMIN -> system-admin
    const normalizedSlugs = roleSlugs.map((slug) => this.normalizeSlug(slug));

    console.log(`🔍 Update Roles: ${roleSlugs} -> Normalized: ${normalizedSlugs}`); // Debug log

    // 2. Tìm các Role Entity
    const roles = await this.roleRepository.find({
      where: {
        slug: In(normalizedSlugs),
      },
    });

    if (!roles || roles.length === 0) {
      throw new BadRequestException(
        `Role không hợp lệ hoặc không tìm thấy trong DB. (Input: ${roleSlugs})`,
      );
    }

    // 3. Gán lại mảng roles cho user
    user.roles = roles;

    return this.userRepository.save(user);
  }

  // ======================================================
  // 7. REMOVE: Xóa User
  // ======================================================
  async remove(id: string) {
    const user = await this.findOne(id);
    return this.userRepository.remove(user);
  }
}
