import { Controller, Get, Body, Patch, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
// 👇 Import Guard (Kiểm tra lại đường dẫn này nếu file guard của mày nằm chỗ khác)
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard) // Bắt buộc Login
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Req() req) {
    // req.user lấy từ token JWT
    return this.usersService.findOne(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }
}
