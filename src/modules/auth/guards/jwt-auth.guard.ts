import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// Kế thừa từ AuthGuard của passport với strategy tên là 'jwt'
export class JwtAuthGuard extends AuthGuard('jwt') {}
