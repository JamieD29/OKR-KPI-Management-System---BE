import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity'; // Sửa lại đường dẫn import user.entity nếu cần
import { UsersService } from './user.service';
import { UsersController } from './user.controller'; // 👈 CÓ DÒNG NÀY CHƯA?

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController], // 👈 CÓ NẰM TRONG NÀY CHƯA?
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
