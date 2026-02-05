import { Controller, Get, UseGuards, Req, Res, UseFilters } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthExceptionFilter } from './filters/auth-exception.filter';

@Controller('auth')
export class AuthController {
  // 1. PHẢI CÓ CÁI NÀY ĐỂ GỌI SERVICE (Inject Dependency)
  constructor(private authService: AuthService) {}

  @Get('allowed-domains')
  async getDomains() {
    return this.authService.getPublicDomains();
  }

  // --- GOOGLE ---
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseFilters(new AuthExceptionFilter()) // 👈 THÊM DÒNG NÀY: Để bắt lỗi Forbidden và Redirect
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    // 2. Tạo Token từ User Info
    // Gọi hàm login để lấy token
    const result = await this.authService.login(req.user);

    // URL Frontend
    const FRONTEND_URL = 'http://localhost:5173';

    // Redirect về Frontend kèm Token
    return res.redirect(
      `${FRONTEND_URL}/login?accessToken=${result.access_token}&user=${encodeURIComponent(JSON.stringify(result.user))}`
    );
  }

  // --- MICROSOFT ---
  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth(@Req() req) {}

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthRedirect(@Req() req, @Res() res) {
    // Microsoft cũng phải login qua AuthService để lấy JWT chuẩn
    const data = await this.authService.login(req.user);

    return res.redirect(
      `http://localhost:5173/login?accessToken=${data.access_token}&user=${encodeURIComponent(JSON.stringify(req.user))}`,
    );
  }
}
