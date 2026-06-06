import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Passport JWT authentication strategy.
 * Extracts the JSON Web Token from the request authorization header,
 * validates its signature and expiration, and binds the payload user data to the request context.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  /**
   * Configures the JWT Strategy options.
   * 
   * @param configService Service to access environment variables
   */
  constructor(configService: ConfigService) {
    super({
      // Extract JWT from the "Authorization: Bearer <token>" HTTP header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Do not accept expired tokens (block them immediately)
      // Load secret key from environment variables (must match the key used to sign the token upon login)
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret-mac-dinh-neu-quen-set-env',
    });
  }

  /**
   * Hook method triggered automatically by Passport after successful signature verification.
   * Maps the decoded token payload to the standard request user object (`req.user`).
   * 
   * @param payload Decoded JWT token payload
   * @returns An object representing the authenticated user injected into the request
   */
  async validate(payload: any) {
    // The returned object will be injected by Passport into NestJS request context as request.user
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
