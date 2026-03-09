import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { ManagementPosition } from '../../database/entities/management-position.entity';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, ManagementPosition]),
    NotificationModule, // Import để inject NotificationService
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
