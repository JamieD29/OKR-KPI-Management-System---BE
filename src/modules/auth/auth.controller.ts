import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

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
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    // 2. Tạo Token từ User Info
    const data = await this.authService.login(req.user);

    // 3. Redirect về Frontend
    // - Sửa 'access_token' thành 'data.access_token'
    // - Sửa đường dẫn về '/login' để khớp với Login.tsx
    // - Thêm encodeURIComponent để không bị lỗi URL
    return res.redirect(
      `http://localhost:5173/login?accessToken=${data.access_token}&user=${encodeURIComponent(JSON.stringify(data.user))}`,
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
