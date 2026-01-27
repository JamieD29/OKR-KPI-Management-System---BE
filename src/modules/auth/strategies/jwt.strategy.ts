import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      // Lấy token từ Header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Token hết hạn là chặn luôn
      // Lấy secret key từ file .env (phải trùng với lúc mày tạo token khi login)
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret-mac-dinh-neu-quen-set-env',
    });
  }

  // Hàm này chạy khi token hợp lệ
  async validate(payload: any) {
    // Trả về object này, nó sẽ được gán vào req.user
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
