// src/auth/filters/auth-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(ForbiddenException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: ForbiddenException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    // URL của Frontend (Lấy từ biến môi trường hoặc mặc định localhost)
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Kiểm tra nếu đúng là lỗi do mình throw ra bên AuthService
    if (exceptionResponse.message === 'DOMAIN_NOT_ALLOWED') {
      // 🔥 CHUYỂN HƯỚNG VỀ FRONTEND KÈM LỖI
      return response.redirect(`${FRONTEND_URL}/login?error=domain_not_allowed`);
    }

    // Các lỗi Forbidden khác thì trả về JSON bình thường
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      message: exceptionResponse.message || 'Forbidden',
    });
  }
}
