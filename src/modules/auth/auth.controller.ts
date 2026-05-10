import { Controller, Get, Post, UseGuards, Req, Res, UseFilters } from '@nestjs/common';
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
      'Public, không cần JWT. Trả về các domain trong bảng `allowed_domains` — mỗi phần tử chỉ có field `domain` (theo `getPublicDomains()`). Frontend dùng để hiển thị hoặc kiểm tra trước khi đăng nhập SSO.',
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
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Khởi động đăng nhập Google OAuth 2.0',
    description:
      'Public. Handler rỗng — `AuthGuard(\'google\')` redirect **302** tới Google consent (`https://accounts.google.com/o/oauth2/v2/auth?...`). Passport tự gắn `client_id`, `redirect_uri`, `scope`, `response_type=code`. Sau khi user đồng ý, Google gọi `GET /auth/google/callback`. **Không trả JSON.**',
  })
  @ApiResponse({
    status: 302,
    description:
      'Redirect tới trang đăng nhập / consent của Google. Header `Location` chứa URL đầy đủ với query OAuth.',
    headers: {
      Location: {
        description: 'Google OAuth authorize URL (Passport GoogleStrategy tự build).',
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
      'Ví dụ `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` chưa cấu hình hoặc lỗi khởi tạo `GoogleStrategy`.',
  })
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseFilters(new AuthExceptionFilter())
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth 2.0 callback',
    description:
      '**Không gọi trực tiếp từ FE như REST thông thường.** Google redirect trình duyệt tới đây sau khi user đồng ý. Passport đổi `code` lấy profile, `AuthService` xác thực domain + tạo/cập nhật user, `login()` sinh JWT. Server trả **302** tới `${FRONTEND_URL}/login?accessToken=<JWT>&user=<encodeURIComponent(JSON.stringify(user))>`. `FRONTEND_URL` = `process.env.FRONTEND_URL` hoặc `http://localhost:5173`.\n\n' +
      'Query `user` sau khi decode: `id`, `email`, `name`, `avatar` (từ DB `avatarUrl`), `roles` (mảng slug), `jobTitle`, `profileCompleted`, `department` (`{ id, name }` hoặc null), `managementPosition` (`{ id, name, slug, permissionLevel }` hoặc null).\n\n' +
      '**Lỗi domain:** `DOMAIN_NOT_ALLOWED` → `AuthExceptionFilter` redirect `${FRONTEND_URL}/login?error=domain_not_allowed` (302).',
  })
  @ApiHeader({
    name: 'Cookie',
    required: false,
    description:
      'Session cookie do Express Session gắn; Passport dùng để verify `state` trong luồng OAuth.',
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
      'Nếu user từ chối hoặc Google báo lỗi (vd `access_denied`); khi có thì thường không có `code`.',
    example: 'access_denied',
  })
  @ApiResponse({
    status: 302,
    description:
      '**Redirect — không có body JSON.**\n\n' +
      '- **Thành công:** `Location` = `{FRONTEND_URL}/login?accessToken=<JWT>&user=<URL-encoded JSON>`.\n' +
      '- **Domain không được phép:** `Location` = `{FRONTEND_URL}/login?error=domain_not_allowed`.',
    headers: {
      Location: {
        description:
          'URL frontend. Thành công: có `accessToken` và `user`. Lỗi domain: có `error=domain_not_allowed`.',
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
      'Passport `AuthGuard(\'google\')` từ chối: `code` sai/hết hạn, mismatch `state`, OAuth bị từ chối, v.v.',
  })
  @ApiInternalServerErrorResponse({
    description:
      'Ví dụ profile Google không có email (`Email not found from provider`), hoặc lỗi DB khi lưu user.',
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
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({
    summary: 'Khởi động đăng nhập Microsoft (Azure AD / Microsoft Identity)',
    description:
      'Public. Handler rỗng — `AuthGuard(\'microsoft\')` redirect **302** tới Microsoft authorize (`https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?...`). Tenant từ env `MICROSOFT_TENANT_ID` (thường `common`). Passport bật `state` + PKCE — cần **session cookie** (Express Session). **Không trả JSON.**',
  })
  @ApiHeader({
    name: 'Cookie',
    required: false,
    description: 'Session cookie lưu state / PKCE verifier cho luồng Microsoft.',
  })
  @ApiResponse({
    status: 302,
    description:
      'Redirect tới Microsoft Identity Platform. Header `Location` chứa `client_id`, `scope`, `state`, `code_challenge`, v.v.',
    headers: {
      Location: {
        description: 'Microsoft OAuth authorize URL (Passport MicrosoftStrategy tự build).',
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
      'Ví dụ `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` chưa cấu hình, hoặc thiếu session middleware (cần cho state/PKCE).',
  })
  async microsoftAuth(@Req() req) {}

  @Get('microsoft/callback')
  @UseFilters(new AuthExceptionFilter()) // 👈 Thêm filter bắt lỗi cho Microsoft luôn
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({
    summary: 'Microsoft OAuth 2.0 callback',
    description:
      '**Không gọi trực tiếp từ FE.** Microsoft redirect browser tới đây sau khi user đăng nhập. Passport đổi `code` (kèm `code_verifier` trong session) lấy profile, `validateOAuthLogin` + `login()` sinh JWT, server trả **302** tới `${FRONTEND_URL}/login?accessToken=<JWT>&user=<encodeURIComponent(JSON)>`. Cấu trúc `user` giống Google callback; với Microsoft thường `avatar: null`.\n\n' +
      '**Lỗi domain:** `DOMAIN_NOT_ALLOWED` → redirect `${FRONTEND_URL}/login?error=domain_not_allowed`.\n\n' +
      'Lỗi profile không có email có thể trả 500 từ strategy/service (vd `Cannot retrieve email from Microsoft account`).',
  })
  @ApiHeader({
    name: 'Cookie',
    required: true,
    description:
      'Session bắt buộc để Passport đối chiếu `state` và `code_verifier` (PKCE).',
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
    description: 'Ví dụ `access_denied`, `consent_required` nếu user từ chối hoặc IdP lỗi.',
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
      '- **Thành công:** `Location` = `{FRONTEND_URL}/login?accessToken=<JWT>&user=<URL-encoded JSON>`.\n' +
      '- **Domain không được phép:** `Location` = `{FRONTEND_URL}/login?error=domain_not_allowed`.',
    headers: {
      Location: {
        description:
          'URL frontend. Thành công: `accessToken` + `user`. Lỗi domain: `error=domain_not_allowed`.',
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
      'Passport `AuthGuard(\'microsoft\')` từ chối: `state` không khớp, PKCE mismatch, code hết hạn, thiếu session, v.v.',
  })
  @ApiInternalServerErrorResponse({
    description:
      'Profile Microsoft không có email, `Email not found from provider`, hoặc lỗi DB khi lưu user.',
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
      'Yêu cầu JWT hợp lệ. Ghi `system_logs` (`action=LOGOUT`, `resource=AUTH`). Trả `{ message: \'Đăng xuất thành công\' }`. **Không revoke JWT** — client tự xóa token; token vẫn hợp lệ tới khi hết hạn.',
  })
  @ApiOkResponse({
    description: 'Đăng xuất thành công',
    type: AuthLogoutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Thiếu `Authorization: Bearer <token>` hoặc token không hợp lệ / hết hạn.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Lỗi khi ghi system log (hiếm).',
  })
  async logout(@Req() req) {
    return this.authService.logout(req.user);
  }
}
