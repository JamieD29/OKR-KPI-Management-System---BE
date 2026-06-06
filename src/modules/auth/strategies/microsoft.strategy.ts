// src/modules/auth/strategies/microsoft.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * Passport Microsoft OAuth2 authentication strategy.
 * Handles user sign-in via Microsoft accounts (Microsoft Entra ID / Azure AD).
 * Validates credentials against a specific or common Azure tenant and exchanges
 * authorization codes for access tokens using OAuth 2.0.
 */
@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  /**
   * Configures the Microsoft Strategy options.
   * Sets client credentials, scopes, tenant-specific endpoints, PKCE, and state validation.
   * 
   * @param configService Service to access environment variables
   * @param authService Authentication service to validate and process validated OAuth users
   */
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
      // 👈 Enforce Microsoft URL using the specific Tenant ID to prevent /common tenant errors
      authorizationURL: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      pkce: true, // 👈 Enable PKCE (Proof Key for Code Exchange) flow
      state: true, // 👈 Enable state validation (requires session middleware configured in main.ts)
    });
  }

  /**
   * Validates the user profile retrieved from Microsoft after successful authentication.
   * Resolves the user's primary email, constructs a normalized user object, and
   * delegates to AuthService to find or create the corresponding user in the database.
   * 
   * @param accessToken OAuth2 access token issued by Microsoft
   * @param refreshToken OAuth2 refresh token issued by Microsoft (if requested)
   * @param profile Microsoft user profile details
   * @param done Passport callback function
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const { name, emails, id, _json } = profile;

    // Extract email safely from the profile structure
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
