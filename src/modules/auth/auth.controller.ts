import { Controller, Get, Post, UseGuards, Req, Res, UseFilters, Body, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthExceptionFilter } from './filters/auth-exception.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // 👈 QUAN TRỌNG: Nhớ import JwtAuthGuard
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { MicrosoftAuthGuard } from './guards/microsoft-auth.guard';
import { AllowedDomainsResponseDto } from './dto/allowed-domains-response.dto';
import { AuthLogoutResponseDto } from './dto/auth-logout-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('allowed-domains')
  @ApiOperation({
    summary: 'Lấy danh sách tên miền email được phép',
    description:
      'Public, không cần JWT. Trả về các domain trong bảng **allowed_domains** — mỗi phần tử chỉ có trường **domain** (logic **getPublicDomains** trong service). Frontend dùng để hiển thị hoặc kiểm tra trước khi đăng nhập SSO.',
  })
  @ApiOkResponse({
    description: 'Danh sách domain được phép',
    type: AllowedDomainsResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Lỗi truy vấn database hoặc lỗi server không xác định',
  })
  async getDomains() {
    return this.authService.getPublicDomains();
  }

  // ==================== GOOGLE ====================
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Bắt đầu đăng nhập Google',
    description:
      '**Mục đích:** Cho user *mở* hoặc *chuyển hướng trình duyệt* tới đây để đăng nhập bằng Google (**/auth/google**).\n\n' +
      '**Đặc điểm:** *Công khai* — không cần JWT. Server *không* trả body JSON; chỉ **chuyển** trình duyệt sang Google.\n\n' +
      '**Phản hồi:** **302** — trình duyệt được đưa sang trang của Google để đăng nhập và đồng ý chia sẻ thông tin. *Không* trả body JSON.\n\n' +
      '**Tiếp theo:** Sau khi user đồng ý, trình duyệt được chuyển tới **/auth/google/callback** để nhận token và dữ liệu user.',
  })
  @ApiResponse({
    status: 302,
    description:
      '**302** — header **Location** trỏ tới trang đăng nhập / cấp quyền của Google (URL đầy đủ có sẵn các tham số OAuth). *Không* có body JSON.',
    headers: {
      Location: {
        description: 'URL authorize của Google được build sẵn cho ứng dụng.',
        schema: {
          type: 'string',
          example:
            'https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=...&redirect_uri=...&scope=email%20profile&...',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description:
      'Thường do cấu hình đăng nhập Google trên server chưa đầy đủ, hoặc lỗi khi khởi động luồng OAuth.',
  })
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseFilters(new AuthExceptionFilter())
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth 2.0 callback',
    description:
      '**Luồng:** User bắt đầu từ **/auth/google**; sau khi đồng ý với Google, trình duyệt được chuyển tới đây — *không* phải kiểu gọi API thông thường từ giao diện. Server đổi **code** lấy thông tin tài khoản, kiểm tra domain, tạo hoặc cập nhật user, phát hành JWT.\n\n' +
      '**Kết quả:** **302** về trang đăng nhập frontend: **FRONTEND_URL**/login với query **accessToken** (JWT) và **user** (chuỗi JSON đã mã hoá URL). **FRONTEND_URL** là biến môi trường hoặc mặc định *http://localhost:5173*.\n\n' +
      '**Một số trường quan trọng trong user (giải mã JSON):**\n\n' +
      '- *Nhận diện & quyền:* **id**, **email**, **roles**\n' +
      '- *Hồ sơ:* **name**, **avatar** (từ **avatarUrl** trong DB), **jobTitle**, **profileCompleted**\n' +
      '- *Tổ chức:* **department** (id, name hoặc null), **managementPosition** (id, name, slug, permissionLevel hoặc null)\n\n' +
      '**Lỗi domain không được phép:** **302** về **FRONTEND_URL**/login với query **error** = *domain_not_allowed*.',
  })
  @ApiHeader({
    name: 'Cookie',
    required: false,
    description:
      'Session cookie do Express Session gắn; Passport dùng để kiểm **state** trong luồng OAuth.',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'Authorization code do Google trả về; Passport đổi lấy access token.',
    example: '4/0AVMBsJhxxxxxxxx',
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Tham số CSRF do Passport gắn lúc bắt đầu flow; Google echo lại.',
  })
  @ApiQuery({
    name: 'scope',
    required: false,
    description: 'Các scope user đã đồng ý (Google echo lại).',
    example: 'email profile openid',
  })
  @ApiQuery({
    name: 'error',
    required: false,
    description:
      'Nếu user từ chối hoặc Google báo lỗi (ví dụ *access_denied*); khi có thì thường không có tham số **code**.',
    example: 'access_denied',
  })
  @ApiResponse({
    status: 302,
    description:
      '**Redirect — không có body JSON.**\n\n' +
      '- **Thành công:** header **Location** trỏ tới **FRONTEND_URL**/login với query **accessToken** (JWT) và **user** (JSON đã mã hoá URL).\n' +
      '- **Domain không được phép:** header **Location** trỏ tới **FRONTEND_URL**/login với query **error** = *domain_not_allowed*.',
    headers: {
      Location: {
        description:
          'URL frontend. Thành công: **accessToken** và **user**. Lỗi domain: **error** = *domain_not_allowed*.',
        schema: {
          type: 'string',
          example:
            'http://localhost:5173/login?accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&user=%7B%22id%22%3A%22uuid%22%2C%22email%22%3A%22a%40b.com%22%7D',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Guard OAuth Google từ chối: **code** sai hoặc hết hạn, **state** không khớp, user từ chối OAuth, v.v.',
  })
  @ApiInternalServerErrorResponse({
    description:
      'Ví dụ profile Google không có email (*Email not found from provider*), hoặc lỗi DB khi lưu user.',
  })
  async googleAuthRedirect(@Req() req, @Res() res) {
    const result = await this.authService.login(req.user);
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    return res.redirect(
      `${FRONTEND_URL}/login?accessToken=${result.access_token}&user=${encodeURIComponent(JSON.stringify(result.user))}`,
    );
  }

  // ==================== MICROSOFT ====================
  @Get('microsoft')
  @UseGuards(MicrosoftAuthGuard)
  @ApiOperation({
    summary: 'Bắt đầu đăng nhập Microsoft',
    description:
      '**Mục đích:** Cho user *mở* hoặc *chuyển hướng trình duyệt* tới đây để đăng nhập bằng tài khoản Microsoft (**/auth/microsoft**).\n\n' +
      '**Đặc điểm:** *Công khai* — không cần JWT. Trình duyệt thường nhận **cookie phiên** dùng ở bước callback để *khớp state* và bảo vệ đăng nhập (PKCE).\n\n' +
      '**Phản hồi:** **302** — trình duyệt được đưa sang trang đăng nhập Microsoft / Azure AD. *Không* trả body JSON.\n\n' +
      '**Tiếp theo:** Sau khi user đăng nhập và đồng ý, trình duyệt được chuyển tới **/auth/microsoft/callback**.\n\n' +
      '**Tenant:** thường lấy từ biến môi trường (ví dụ *common* để cho nhiều loại tài khoản).',
  })
  @ApiHeader({
    name: 'Cookie',
    required: false,
    description:
      'Sau redirect, có thể có cookie phiên dùng ở bước **/auth/microsoft/callback** (state và PKCE).',
  })
  @ApiResponse({
    status: 302,
    description:
      '**302** — header **Location** trỏ tới trang đăng nhập Microsoft. *Không* có body JSON.',
    headers: {
      Location: {
        description: 'URL authorize của Microsoft được build sẵn cho ứng dụng.',
        schema: {
          type: 'string',
          example:
            'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?response_type=code&client_id=...&redirect_uri=...&scope=user.read%20email%20profile%20openid&state=...&code_challenge=...&code_challenge_method=S256',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description:
      'Thường do cấu hình Microsoft trên server chưa đầy đủ, hoặc thiếu phần session cần cho state và PKCE.',
  })
  async microsoftAuth(@Req() req) {}

  @Get('microsoft/callback')
  @UseFilters(new AuthExceptionFilter()) // 👈 Thêm filter bắt lỗi cho Microsoft luôn
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({
    summary: 'Microsoft OAuth 2.0 callback',
    description:
      '**Luồng:** User bắt đầu từ **/auth/microsoft**; sau khi đăng nhập với Microsoft, trình duyệt được chuyển tới đây — *không* phải kiểu gọi API thông thường từ giao diện. *Cùng phiên trình duyệt* cần cookie **session** (từ bước trước) để đối chiếu **state** và PKCE khi đổi **code**. Server đổi **code** lấy thông tin tài khoản, kiểm tra domain, tạo hoặc cập nhật user, phát hành JWT.\n\n' +
      '**Kết quả:** **302** về trang đăng nhập frontend: **FRONTEND_URL**/login với query **accessToken** (JWT) và **user** (chuỗi JSON đã mã hoá URL). **FRONTEND_URL** là biến môi trường hoặc mặc định *http://localhost:5173*.\n\n' +
      '**Một số trường quan trọng trong user (giải mã JSON):**\n\n' +
      '- *Nhận diện & quyền:* **id**, **email**, **roles**\n' +
      '- *Hồ sơ:* **name**, **avatar** (từ **avatarUrl** trong DB; *với Microsoft thường null*), **jobTitle**, **profileCompleted**\n' +
      '- *Tổ chức:* **department** (id, name hoặc null), **managementPosition** (id, name, slug, permissionLevel hoặc null)\n\n' +
      '**Lỗi domain không được phép:** **302** về **FRONTEND_URL**/login với query **error** = *domain_not_allowed*.\n\n' +
      '**Lưu ý:** nếu Microsoft không cung cấp email cho ứng dụng, có thể nhận lỗi **500**.',
  })
  @ApiHeader({
    name: 'Cookie',
    required: true,
    description:
      'Session bắt buộc để Passport đối chiếu **state** và **code_verifier** (PKCE).',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'Authorization code do Microsoft trả về.',
    example: 'M.R3_BAY.xxxxx',
  })
  @ApiQuery({
    name: 'state',
    required: true,
    description: 'CSRF token Passport tạo khi redirect đi; Microsoft echo lại.',
  })
  @ApiQuery({
    name: 'session_state',
    required: false,
    description: 'Tham số bổ sung Microsoft để theo dõi session.',
  })
  @ApiQuery({
    name: 'error',
    required: false,
    description: 'Ví dụ *access_denied*, *consent_required* nếu user từ chối hoặc IdP lỗi.',
  })
  @ApiQuery({
    name: 'error_description',
    required: false,
    description: 'Mô tả lỗi từ Microsoft (debug).',
  })
  @ApiResponse({
    status: 302,
    description:
      '**Redirect — không có body JSON.**\n\n' +
      '- **Thành công:** header **Location** trỏ tới **FRONTEND_URL**/login với query **accessToken** (JWT) và **user** (JSON đã mã hoá URL).\n' +
      '- **Domain không được phép:** header **Location** trỏ tới **FRONTEND_URL**/login với query **error** = *domain_not_allowed*.',
    headers: {
      Location: {
        description:
          'URL frontend. Thành công: **accessToken** và **user**. Lỗi domain: **error** = *domain_not_allowed*.',
        schema: {
          type: 'string',
          example:
            'http://localhost:5173/login?accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&user=%7B%22id%22%3A%22uuid%22%2C%22email%22%3A%22a%40b.com%22%2C%22avatar%22%3Anull%7D',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Guard OAuth Microsoft từ chối: **state** không khớp, lỗi PKCE, **code** hết hạn, thiếu session, v.v.',
  })
  @ApiInternalServerErrorResponse({
    description:
      'Profile Microsoft không có email (*Email not found from provider*), hoặc lỗi DB khi lưu user.',
  })
  async microsoftAuthRedirect(@Req() req, @Res() res) {
    const data = await this.authService.login(req.user);
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    return res.redirect(
      // 👈 Sửa lại JSON.stringify(data.user) để Frontend nhận đúng format
      `${FRONTEND_URL}/login?accessToken=${data.access_token}&user=${encodeURIComponent(JSON.stringify(data.user))}`,
    );
  }

  // ==================== LOGOUT ====================
  // 👈 THÊM API LOGOUT ĐỂ GHI LOG
  @Post('logout')
  @UseGuards(JwtAuthGuard) // Chỉ cho phép user đang đăng nhập mới gọi được
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Đăng xuất',
    description:
      'Yêu cầu JWT hợp lệ. Ghi vào nhật ký **system_logs** (hành động **LOGOUT**, tài nguyên **AUTH**). Trả JSON có trường **message** là *Đăng xuất thành công*. **Không thu hồi JWT** — client tự xóa token; token vẫn hợp lệ tới khi hết hạn.',
  })
  @ApiOkResponse({
    description: 'Đăng xuất thành công',
    type: AuthLogoutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Thiếu header **Authorization** dạng **Bearer** kèm token, hoặc token không hợp lệ / hết hạn.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Lỗi khi ghi system log (hiếm).',
  })
  async logout(@Req() req, @Res({ passthrough: true }) res) {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
      });
    }
    res.clearCookie('connect.sid');
    return this.authService.logout(req.user);
  }

  // 🧪 ENDPOINT MỚI: BYPASS LOGIN CHO AUTOMATION TEST
  @Post('bypass')
  @ApiOperation({
    summary: 'Bypass login cho automation testing (không cần SSO Google/Microsoft)',
    description:
      'Chỉ chạy ở môi trường development/test (hoặc khi ALLOW_BYPASS_IN_PROD=true). Nhận email, role (VD: ADMIN/USER), name, managementPositionSlug (VD: DEAN/VICE_DEAN), departmentName.',
  })
  async bypassLogin(@Body() body: any) {
    // Bảo mật: Không chạy trên Production trừ khi cấu hình rõ ràng
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ALLOW_BYPASS_IN_PROD !== 'true'
    ) {
      throw new ForbiddenException('Bypass login is disabled in production.');
    }

    const { email, role, name, managementPositionSlug, departmentName } = body;
    return this.authService.bypassLogin(
      email,
      role,
      name,
      managementPositionSlug,
      departmentName,
    );
  }
}
