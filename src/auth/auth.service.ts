import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(private jwtService: JwtService) {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID ||
        '454552409584-9tiufajnvspp5fh3orh58nvou320gs6b.apps.googleusercontent.com',
    );
  }

  async verifyGoogleToken(token: string) {
    try {
      // Try to verify as ID token first
      try {
        const ticket = await this.googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        // Verify the hosted domain
        if (payload.hd !== 'itec.hcmus.edu.vn') {
          throw new UnauthorizedException(
            'Only @itec.hcmus.edu.vn email addresses are allowed',
          );
        }

        // Verify email domain (double check)
        if (!payload.email.endsWith('@itec.hcmus.edu.vn')) {
          throw new UnauthorizedException('Invalid email domain');
        }

        return {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          sub: payload.sub, // Google user ID
        };
      } catch (idTokenError) {
        // If ID token verification fails, try as access token
        // Verify with Google's tokeninfo endpoint
        const response = await fetch(
          `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`,
        );

        if (!response.ok) {
          throw new UnauthorizedException('Invalid access token');
        }

        const tokenInfo = await response.json();

        // Get user info
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!userInfoResponse.ok) {
          throw new UnauthorizedException('Failed to get user info');
        }

        const userInfo = await userInfoResponse.json();

        // Verify email domain
        if (!userInfo.email.endsWith('@itec.hcmus.edu.vn')) {
          throw new UnauthorizedException(
            'Only @itec.hcmus.edu.vn email addresses are allowed',
          );
        }

        return {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          sub: userInfo.sub,
        };
      }
    } catch (error) {
      console.error('Token verification error:', error);
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      name: user.name,
      sub: user.sub,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    };
  }

  async validateUser(payload: any) {
    // Here you can add additional checks, like checking if user exists in database
    return {
      email: payload.email,
      name: payload.name,
      userId: payload.sub,
    };
  }
}
