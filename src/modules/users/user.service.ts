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
import { ManagementPosition } from '../../database/entities/management-position.entity';
import { UserOkr } from '../../database/entities/performance/user-okr.entity';
import { UserEvaluation } from '../../database/entities/performance/user-evaluation.entity';
import { EvaluationCycle } from '../../database/entities/performance/evaluation-cycle.entity';

// 👇 Import Notification Service
import { NotificationService } from '../notification/notification.service';

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

    @InjectRepository(ManagementPosition)
    private positionRepository: Repository<ManagementPosition>,

    @InjectRepository(UserOkr)
    private userOkrRepo: Repository<UserOkr>,

    @InjectRepository(UserEvaluation)
    private userEvalRepo: Repository<UserEvaluation>,

    @InjectRepository(EvaluationCycle)
    private cycleRepository: Repository<EvaluationCycle>,

    private notificationService: NotificationService,
  ) {}

  // 🔥 HÀM PHỤ TRỢ: Chuẩn hóa Slug
  private normalizeSlug(slug: string): string {
    return slug.toUpperCase();
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
        where: { slug: 'USER' }, // db lưu là 'USER' in hoa
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
      relations: ['roles', 'department', 'managementPosition'],
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
      relations: ['roles', 'department', 'managementPosition'],
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
      relations: ['roles', 'department', 'managementPosition'],
    });
  }

  // ======================================================
  // 5. UPDATE PROFILE (Cá nhân tự sửa)
  // ======================================================
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.findOne(userId);

    const { departmentId, ...rest } = updateProfileDto;

    // Check if staffCode already exists for another user in the system
    if (rest.staffCode) {
      const trimmedStaffCode = rest.staffCode.trim();
      if (trimmedStaffCode) {
        const existingUser = await this.userRepository.findOne({
          where: { staffCode: trimmedStaffCode },
        });
        if (existingUser && existingUser.id !== userId) {
          throw new ConflictException('Mã nhân sự này đã tồn tại trong hệ thống');
        }
      }
    }

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

    // 👇 1. Chuẩn hóa slug
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
  // 7. ASSIGN MANAGEMENT POSITION: Gán chức vụ quản lý
  // ======================================================
  async assignManagementPosition(userId: string, positionId: string | null) {
    const user = await this.findOne(userId);

    if (positionId) {
      // Gán chức vụ mới
      const position = await this.positionRepository.findOne({ where: { id: positionId } });
      if (!position) {
        throw new NotFoundException(`Chức vụ với ID "${positionId}" không tồn tại`);
      }

      // Check unique constraints for TRUONG_KHOA and TRUONG_BO_MON
      if (position.slug === 'TRUONG_KHOA') {
        const existingDean = await this.userRepository.findOne({
          where: { managementPosition: { slug: 'TRUONG_KHOA' } },
        });
        if (existingDean && existingDean.id !== userId) {
          throw new BadRequestException(
            `Đã có người giữ chức vụ Trưởng khoa (${existingDean.name || existingDean.email}). Mỗi khoa chỉ có duy nhất 1 Trưởng khoa.`,
          );
        }
      } else if (position.slug === 'TRUONG_BO_MON') {
        if (!user.department) {
          throw new BadRequestException(
            'Không thể gán chức vụ Trưởng bộ môn vì nhân sự này chưa thuộc bộ môn nào.',
          );
        }
        const existingHead = await this.userRepository.findOne({
          where: {
            managementPosition: { slug: 'TRUONG_BO_MON' },
            department: { id: user.department.id },
          },
        });
        if (existingHead && existingHead.id !== userId) {
          throw new BadRequestException(
            `Bộ môn ${user.department.name} đã có Trưởng bộ môn (${existingHead.name || existingHead.email}). Mỗi bộ môn chỉ có duy nhất 1 Trưởng bộ môn.`,
          );
        }
      }

      user.managementPosition = position;

      // Tạo thông báo cho user
      await this.notificationService.create(
        userId,
        `Bạn đã được gán chức vụ quản lý: ${position.name}`,
      );
    } else {
      // Gỡ chức vụ
      if (user.managementPosition) {
        const oldPositionName = user.managementPosition.name;
        user.managementPosition = null as any;

        // Thông báo gỡ chức vụ
        await this.notificationService.create(
          userId,
          `Chức vụ quản lý "${oldPositionName}" của bạn đã được gỡ bỏ`,
        );
      }
    }

    return this.userRepository.save(user);
  }

  // ======================================================
  // 7b. ASSIGN DEPARTMENT: Gán / gỡ bộ môn
  // ======================================================
  async assignDepartment(userId: string, departmentId: string | null) {
    const user = await this.findOne(userId);

    if (departmentId) {
      // Gán bộ môn mới
      const department = await this.userRepository.manager.getRepository(Department).findOne({ where: { id: departmentId } });
      if (!department) {
        throw new NotFoundException(`Bộ môn với ID "${departmentId}" không tồn tại`);
      }

      // Nếu user là Trưởng bộ môn, kiểm tra xem bộ môn đích đã có Trưởng bộ môn chưa
      if (user.managementPosition?.slug === 'TRUONG_BO_MON') {
        const existingHead = await this.userRepository.findOne({
          where: {
            managementPosition: { slug: 'TRUONG_BO_MON' },
            department: { id: departmentId },
          },
        });
        if (existingHead && existingHead.id !== userId) {
          throw new BadRequestException(
            `Bộ môn ${department.name} đã có Trưởng bộ môn (${existingHead.name || existingHead.email}). Không thể chuyển Trưởng bộ môn sang bộ môn này.`,
          );
        }
      }

      user.department = department;

      // Tạo thông báo cho user
      await this.notificationService.create(
        userId,
        `Bạn đã được gán vào bộ môn: ${department.name}`,
      );
    } else {
      // Gỡ bộ môn
      if (user.department) {
        const oldDeptName = user.department.name;
        user.department = null as any;

        // Thông báo gỡ bộ môn
        await this.notificationService.create(
          userId,
          `Bạn đã được gỡ khỏi bộ môn: ${oldDeptName}`,
        );
      }
    }

    return this.userRepository.save(user);
  }

  // ======================================================
  // 8. FIND BY ROLE: Lọc users theo chức vụ + chức danh nghề nghiệp
  // ======================================================
  async findByRole(positionId?: string, jobTitle?: string) {
    const where: any = {};

    if (positionId) {
      where.managementPosition = { id: positionId };
    }
    if (jobTitle) {
      where.jobTitle = jobTitle;
    }

    return this.userRepository.find({
      where,
      relations: ['roles', 'department', 'managementPosition'],
      order: { name: 'ASC' },
    });
  }

  // ======================================================
  // 9. REMOVE: Xóa User
  // ======================================================
  async remove(id: string) {
    const user = await this.findOne(id);
    return this.userRepository.remove(user);
  }

  // ======================================================
  // 10. GET USER DETAIL: Lấy chi tiết user (Profile, OKR, Đánh giá) theo kỳ
  // ======================================================
  async getUserDetail(userId: string, cycleId?: string) {
    // Lấy profile user (findOne đã include roles, department, managementPosition)
    const user = await this.findOne(userId);

    // Lấy tất cả các kỳ đánh giá để FE hiện dropdown
    const allCycles = await this.cycleRepository.find({
      where: { isDel: false },
      order: { createdAt: 'DESC' },
    });

    // Xác định kỳ cần truy vấn (mặc định là kỳ mới nhất)
    let targetCycleId = cycleId;
    if (!targetCycleId && allCycles.length > 0) {
      targetCycleId = allCycles[0].id;
    }

    let okrs: UserOkr[] = [];
    let evaluation: UserEvaluation | null = null;

    if (targetCycleId) {
      okrs = await this.userOkrRepo.find({
        where: { userId, cycleId: targetCycleId },
        order: { createdAt: 'DESC' },
      });

      evaluation = await this.userEvalRepo.findOne({
        where: { userId, cycleId: targetCycleId },
      });
    }

    return {
      user,
      okrs,
      evaluation,
      allCycles,
    };
  }
}
