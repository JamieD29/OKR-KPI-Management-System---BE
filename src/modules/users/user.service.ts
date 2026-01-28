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
import { Role } from '../../database/entities/role.entity'; // Phải có cái này để tìm Role
import { Department } from '../../database/entities/department.entity';

// 👇 Import DTOs
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';

// import { UpdateUserRolesDto } from './dto/update-user-roles.dto'; // Nếu dùng DTO riêng

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

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
      const roleEntities = await this.roleRepository.find({
        where: { slug: In(roles) }, // Tìm các role có slug trùng khớp
      });
      newUser.roles = roleEntities;
    } else {
      // Nếu không gửi role -> Gán mặc định USER
      const defaultRole = await this.roleRepository.findOne({
        where: { slug: 'USER' },
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
  async findAll() {
    return this.userRepository.find({
      relations: ['roles', 'department'], // 🔥 Quan trọng: Load role và bộ môn để hiện lên bảng
      order: {
        createdAt: 'DESC', // User mới nhất lên đầu
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
    const user = await this.findOne(userId); // Dùng lại hàm findOne cho gọn

    // Tách departmentId ra xử lý riêng
    const { departmentId, ...rest } = updateProfileDto;

    // Merge thông tin mới vào user
    Object.assign(user, rest);

    // Xử lý quan hệ Bộ môn
    if (departmentId) {
      // TypeORM shortcut: gán object { id } là nó tự hiểu quan hệ
      user.department = { id: departmentId } as Department;
    }

    return this.userRepository.save(user);
  }

  // ======================================================
  // 6. UPDATE ROLES (Chức năng Admin Phân Quyền) 🔥 QUAN TRỌNG
  // ======================================================
  async updateRoles(userId: string, roleSlugs: string[]) {
    const user = await this.findOne(userId);

    // 1. Tìm các Role Entity dựa trên slug gửi lên (VD: ['SUPER_ADMIN'])
    const roles = await this.roleRepository.find({
      where: {
        slug: In(roleSlugs), // Tìm tất cả role có slug nằm trong mảng
      },
    });

    if (!roles || roles.length === 0) {
      throw new BadRequestException('Role không hợp lệ');
    }

    // 2. Gán lại mảng roles cho user
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
