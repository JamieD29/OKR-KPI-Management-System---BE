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
import { UserOkr } from '../../database/entities/performance-evaluation/user-okr.entity';
import { UserEvaluation } from '../../database/entities/performance-evaluation/user-evaluation.entity';
import { EvaluationCycle } from '../../database/entities/performance-evaluation/evaluation-cycle.entity';

// 👇 Import Notification Service
import { NotificationService } from '../notification/notification.service';

// 👇 Import DTOs
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';

/**
 * Service handling user operations, including user creation, profiles updates,
 * role assignments, management position mappings, department allocations, 
 * and retrieving comprehensive user profiles with cycle-based OKRs and evaluations.
 */
@Injectable()
export class UsersService {
  /**
   * @param userRepository Repository for User entity
   * @param roleRepository Repository for Role entity
   * @param positionRepository Repository for ManagementPosition entity
   * @param userOkrRepo Repository for UserOkr entity
   * @param userEvalRepo Repository for UserEvaluation entity
   * @param cycleRepository Repository for EvaluationCycle entity
   * @param notificationService Service to record and dispatch notifications
   */
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

  /**
   * Normalizes an input string to uppercase slug format.
   * 
   * @param slug Input string
   * @returns Uppercased string
   */
  private normalizeSlug(slug: string): string {
    return slug.toUpperCase();
  }

  /**
   * Registers a new user in the system.
   * Maps roles (defaulting to USER) and departments.
   * 
   * @param createUserDto Payload containing email, name, roles, departmentId, and status details
   * @returns The newly registered User entity
   * @throws {ConflictException} If the email is already in use
   */
  async create(createUserDto: CreateUserDto) {
    // 1. Check for duplicate email
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại trong hệ thống');
    }

    const { roles, departmentId, ...basicUserData } = createUserDto;

    // 2. Instantiate user entity with basic fields
    const newUser = this.userRepository.create(basicUserData);

    // 3. Process Roles (Find entities from input slugs)
    if (roles && roles.length > 0) {
      // 👇 Normalize input slugs
      const normalizedRoles = roles.map((r) => this.normalizeSlug(r));

      const roleEntities = await this.roleRepository.find({
        where: { slug: In(normalizedRoles) },
      });
      newUser.roles = roleEntities;
    } else {
      // Fallback: Assign default USER role if empty
      const defaultRole = await this.roleRepository.findOne({
        where: { slug: 'USER' }, // Database stores uppercase 'USER'
      });
      if (defaultRole) newUser.roles = [defaultRole];
    }

    // 4. Handle Department association if provided
    if (departmentId) {
      newUser.department = { id: departmentId } as any;
    }

    return this.userRepository.save(newUser);
  }

  // ======================================================
  // 2. FIND ALL: Retrieve user list (For Admin Portal)
  // ======================================================
  
  /**
   * Retrieves all users, optionally filtered by a department ID.
   * Ordered by creation date descending.
   * 
   * @param departmentId Optional department filter ID
   * @returns Array of User entities with resolved relations
   */
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
  // 3. FIND ONE: Fetch detailed user profile
  // ======================================================
  
  /**
   * Retrieves a single user's profile with relationships by their ID.
   * 
   * @param id The user ID
   * @returns The matching User entity
   * @throws {NotFoundException} If the user is not found
   */
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
  // 4. FIND BY EMAIL (Used by Auth/Login workflow)
  // ======================================================
  
  /**
   * Retrieves a user by their email address.
   * 
   * @param email The user email
   * @returns The User entity, or null if not found
   */
  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'department', 'managementPosition'],
    });
  }

  // ======================================================
  // 5. UPDATE PROFILE (User self-service update)
  // ======================================================
  
  /**
   * Updates a user's personal profile details.
   * Validates that the staffCode is unique across the system if modified.
   * 
   * @param userId The ID of the user updating their profile
   * @param updateProfileDto Payload containing the modified profile fields
   * @returns The updated User entity
   * @throws {ConflictException} If the staffCode is already taken by another user
   */
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
  // 6. UPDATE ROLES (Admin Role Assignment)
  // ======================================================
  
  /**
   * Updates the authorization roles assigned to a user.
   * Intended for Administrator configuration.
   * 
   * @param userId Target user ID
   * @param roleSlugs Array of role slugs (e.g. ['ADMIN', 'USER'])
   * @returns The updated User entity
   * @throws {BadRequestException} If role slugs do not exist in the database
   */
  async updateRoles(userId: string, roleSlugs: string[]) {
    const user = await this.findOne(userId);

    // 👇 1. Normalize slugs
    const normalizedSlugs = roleSlugs.map((slug) => this.normalizeSlug(slug));

    console.log(`🔍 Update Roles: ${roleSlugs} -> Normalized: ${normalizedSlugs}`); // Debug log

    // 2. Retrieve Role entities
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

    // 3. Update roles mapping
    user.roles = roles;

    return this.userRepository.save(user);
  }

  // ======================================================
  // 7. ASSIGN MANAGEMENT POSITION: Map management position
  // ======================================================
  
  /**
   * Assigns or clears a management position for a user.
   * Enforces unique business constraints:
   * - Only one user can hold the Dean ('TRUONG_KHOA') position.
   * - Only one user per department can hold the Department Head ('TRUONG_BO_MON') position.
   * Dispatches notification alert logs to the user.
   * 
   * @param userId Target user ID
   * @param positionId Target position ID, or null to clear
   * @returns The updated User entity
   * @throws {NotFoundException} If the management position is not found
   * @throws {BadRequestException} If position limits are exceeded or user lacks department mapping
   */
  async assignManagementPosition(userId: string, positionId: string | null) {
    const user = await this.findOne(userId);

    if (positionId) {
      // Assign new position
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

      // Notify the user
      await this.notificationService.create(
        userId,
        `Bạn đã được gán chức vụ quản lý: ${position.name}`,
      );
    } else {
      // Remove position
      if (user.managementPosition) {
        const oldPositionName = user.managementPosition.name;
        user.managementPosition = null as any;

        // Notify position removal
        await this.notificationService.create(
          userId,
          `Chức vụ quản lý "${oldPositionName}" của bạn đã được gỡ bỏ`,
        );
      }
    }

    return this.userRepository.save(user);
  }

  // ======================================================
  // 7b. ASSIGN DEPARTMENT: Allocate/deallocate department
  // ======================================================
  
  /**
   * Assigns or clears a department allocation for a user.
   * If the user is a Department Head ('TRUONG_BO_MON'), verifies that the target department
   * does not already have an active department head assigned.
   * Dispatches notification logs to the user.
   * 
   * @param userId Target user ID
   * @param departmentId Target department ID, or null to clear
   * @returns The updated User entity
   * @throws {NotFoundException} If the department is not found
   * @throws {BadRequestException} If target department already has a head and user is TRUONG_BO_MON
   */
  async assignDepartment(userId: string, departmentId: string | null) {
    const user = await this.findOne(userId);

    if (departmentId) {
      // Associate new department
      const department = await this.userRepository.manager.getRepository(Department).findOne({ where: { id: departmentId } });
      if (!department) {
        throw new NotFoundException(`Bộ môn với ID "${departmentId}" không tồn tại`);
      }

      // If user is Head of Department, check if target department already has a head
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

      // Notify the user
      await this.notificationService.create(
        userId,
        `Bạn đã được gán vào bộ môn: ${department.name}`,
      );
    } else {
      // Unlink department
      if (user.department) {
        const oldDeptName = user.department.name;
        user.department = null as any;

        // Notify department dissociation
        await this.notificationService.create(
          userId,
          `Bạn đã được gỡ khỏi bộ môn: ${oldDeptName}`,
        );
      }
    }

    return this.userRepository.save(user);
  }

  // ======================================================
  // 8. FIND BY ROLE: Filter users by management position and/or job title
  // ======================================================
  
  /**
   * Retrieves a list of users filtered by management position and/or job title.
   * Ordered alphabetically by name ascending.
   * 
   * @param positionId Optional management position ID filter
   * @param jobTitle Optional job title string filter
   * @returns Array of User entities
   */
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
  // 9. REMOVE: Delete User profile
  // ======================================================
  
  /**
   * Deletes a user profile from the system.
   * 
   * @param id The ID of the user to delete
   * @returns The deleted User entity
   */
  async remove(id: string) {
    const user = await this.findOne(id);
    return this.userRepository.remove(user);
  }

  // ======================================================
  // 10. GET USER DETAIL: Retrieve user history metrics scoped by cycle
  // ======================================================
  
  /**
   * Compiles detailed profile history for a user in a specific cycle.
   * Includes user profile info, their OKR targets list, and quality evaluation sheet.
   * Also returns all active cycles for frontend selection dropdowns.
   * 
   * @param userId The ID of the user
   * @param cycleId Evaluation cycle filter (defaults to latest cycle)
   * @returns Compiled detailed profile history
   */
  async getUserDetail(userId: string, cycleId?: string) {
    // Fetch basic profile with mappings
    const user = await this.findOne(userId);

    // Fetch all cycles for frontend selectors dropdown
    const allCycles = await this.cycleRepository.find({
      where: { isDel: false },
      order: { createdAt: 'DESC' },
    });

    // Resolve query cycle (default to latest)
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
