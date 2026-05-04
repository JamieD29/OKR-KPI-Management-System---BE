// src/modules/auth/strategies/microsoft.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const tenant = configService.get<string>('MICROSOFT_TENANT_ID') || 'common';
    super({
      clientID: configService.get<string>('MICROSOFT_CLIENT_ID') || '',
      clientSecret: configService.get<string>('MICROSOFT_CLIENT_SECRET') || '',
      callbackURL:
        configService.get<string>('MICROSOFT_CALLBACK_URL') ||
        'http://localhost:3001/auth/microsoft/callback',
      scope: ['user.read', 'email', 'profile', 'openid'],
      // 👈 Cưỡng bức sử dụng URL theo Tenant ID để tránh lỗi /common
      authorizationURL: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      pkce: true, // 👈 BẬT PKCE
      state: true, // 👈 BẬT STATE (Yêu cầu phải có session ở main.ts)
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const { name, emails, id, _json } = profile;

    // Trích xuất email an toàn
    const email =
      (emails && emails.length > 0 && emails[0].value) ||
      _json?.mail ||
      _json?.userPrincipalName;

    if (!email) {
      return done(new Error('Cannot retrieve email from Microsoft account'), false);
    }

    const user = {
      email: email,
      name: name ? `${name.givenName} ${name.familyName}` : _json?.displayName || 'Unknown',
      avatar: null,
      providerId: id,
      provider: 'microsoft' as const,
    };

    try {
      const data = await this.authService.validateOAuthLogin(user);
      done(null, data);
    } catch (error) {
      done(error, false);
    }
  }
}
