import { Controller, Get, Post, UseGuards, Req, Res, UseFilters } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthExceptionFilter } from './filters/auth-exception.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // 👈 QUAN TRỌNG: Nhớ import JwtAuthGuard

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('allowed-domains')
  async getDomains() {
    return this.authService.getPublicDomains();
  }

  // ==================== GOOGLE ====================
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseFilters(new AuthExceptionFilter())
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const result = await this.authService.login(req.user);
    const FRONTEND_URL = 'http://localhost:5173';

    return res.redirect(
      `${FRONTEND_URL}/login?accessToken=${result.access_token}&user=${encodeURIComponent(JSON.stringify(result.user))}`,
    );
  }

  // ==================== MICROSOFT ====================
  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth(@Req() req) {}

  @Get('microsoft/callback')
  @UseFilters(new AuthExceptionFilter()) // 👈 Thêm filter bắt lỗi cho Microsoft luôn
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthRedirect(@Req() req, @Res() res) {
    const data = await this.authService.login(req.user);
    const FRONTEND_URL = 'http://localhost:5173';

    return res.redirect(
      // 👈 Sửa lại JSON.stringify(data.user) để Frontend nhận đúng format
      `${FRONTEND_URL}/login?accessToken=${data.access_token}&user=${encodeURIComponent(JSON.stringify(data.user))}`,
    );
  }

  // ==================== LOGOUT ====================
  // 👈 THÊM API LOGOUT ĐỂ GHI LOG
  @Post('logout')
  @UseGuards(JwtAuthGuard) // Chỉ cho phép user đang đăng nhập mới gọi được
  async logout(@Req() req) {
    return this.authService.logout(req.user);
  }
}
