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

/**
 * Service handling authentication and authorization logic,
 * including OAuth login validation, token issuance (JWT),
 * logging user sessions, and automation bypass for testing.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(AllowedDomain) private domainRepository: Repository<AllowedDomain>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    private jwtService: JwtService,
    private systemLogsService: SystemLogsService, // 👈 Injected SystemLogsService
  ) {}

  /**
   * Retrieves all allowed email domains registered in the system.
   * 
   * @returns An object containing the list of allowed domains
   */
  async getPublicDomains() {
    const domains = await this.domainRepository.find({ select: ['domain'] });
    return { domains };
  }

  /**
   * Validates the login attempt from OAuth providers (Google/Microsoft).
   * Automatically registers new users (assigning Admin to the first user, and User to others)
   * after validating if their email domain is allowed.
   * 
   * @param reqUser Normalized user data from the OAuth provider
   * @returns The resolved User entity
   * @throws {InternalServerErrorException} If provider does not supply an email
   * @throws {ForbiddenException} If the email domain is not registered/allowed
   */
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

    // ⛔ BLOCK LOGIC (Log failed attempts here)
    if (!isFirstUser && !isAdmin) {
      if (!isDomainAllowed) {
        console.warn(`⛔ Blocked login attempt: ${email} (Domain not allowed)`);

        // 📸 AUDIT LOG: FAILED LOGIN (Invalid Email Domain)
        if (this.systemLogsService) {
          await this.systemLogsService.createLog({
            userId: user?.id ?? undefined, // If user does not exist in DB yet, pass undefined (log without user ID)
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

    // Create new user or update existing user provider IDs
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

    // Temporarily attach provider info to user object for audit logging inside the login method
    user['loginProvider'] = reqUser.provider;

    return user;
  }

  /**
   * Finalizes authentication, signs a JWT token, and records a successful login event.
   * 
   * @param user The user entity returned from validateOAuthLogin
   * @returns An object containing the signed JWT access token and user metadata
   */
  async login(user: any) {
    // Reload user with relationships (validateOAuthLogin only retrieves roles)
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

    // 📸 AUDIT LOG: SUCCESSFUL LOGIN
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
        // 🔥 Injected fields for Frontend to verify profile completion status
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

  /**
   * Records a logout audit trail log in the system logs.
   * 
   * @param user The current authenticated user from JWT payload
   * @returns A success message
   */
  async logout(user: any) {
    if (this.systemLogsService && user) {
      // Extract user ID from token payload (which uses 'sub' or 'id')
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

  /**
   * Directly logs in or registers a mock user.
   * Intended solely for automated testing/QA environments.
   * 
   * @param email Email of the test user
   * @param roleSlug Desired role (e.g., 'ADMIN' or 'USER')
   * @param name Desired display name
   * @param managementPositionSlug Target management position (e.g., 'truong-bo-mon')
   * @param departmentName Target department name
   * @returns JWT token and mock user payload
   */
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
      // Automatically spawn a new user for mock environment
      const slug = (roleSlug || 'USER').toUpperCase();
      let role = await this.roleRepository.findOne({ where: { slug } });
      if (!role) {
        role = await this.roleRepository.save({
          name: slug === 'ADMIN' ? 'Admin' : 'User',
          slug,
          description: 'Auto generated for testing',
        });
      }

      // Fetch management position if specified
      let mPosition: ManagementPosition | null = null;
      if (managementPositionSlug) {
        mPosition = await this.userRepository.manager.findOne(ManagementPosition, {
          where: { slug: managementPositionSlug.toUpperCase() },
        });
      }

      // Fetch department/faculty if specified
      let dept: Department | null = null;
      if (departmentName) {
        dept = await this.userRepository.manager.findOne(Department, {
          where: { name: departmentName },
        });
      }

      // Default to the first available department if none specified, facilitating automated testing
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
        jobTitle: 'Giảng viên' as any, // Default job title
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
