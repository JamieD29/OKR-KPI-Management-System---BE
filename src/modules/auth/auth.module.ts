import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

// Import các Entity để thao tác với Database
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { AllowedDomain } from '../../database/entities/allowed-domain.entity';

@Module({
  imports: [
    // 1. Đăng ký Passport
    PassportModule,

    // 2. Đăng ký các Entity sẽ dùng trong AuthService
    TypeOrmModule.forFeature([User, Role, AllowedDomain]),

    // 3. Cấu hình JWT (Json Web Token)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' }, // Token hết hạn sau 1 ngày
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, MicrosoftStrategy, JwtStrategy],
  exports: [AuthService], // Export để module khác dùng được (VD: AuthGuard)
})
export class AuthModule {}
