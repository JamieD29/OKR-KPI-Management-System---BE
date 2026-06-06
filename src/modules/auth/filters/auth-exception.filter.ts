// src/auth/filters/auth-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Exception filter that intercepts all ForbiddenException instances.
 * If the forbidden access is due to a disallowed email domain during authentication,
 * it redirects the user back to the frontend login page with an error query parameter.
 * Otherwise, it returns a standard JSON error response.
 */
@Catch(ForbiddenException)
export class AuthExceptionFilter implements ExceptionFilter {
  /**
   * Intercepts and handles the ForbiddenException.
   * 
   * @param exception The caught ForbiddenException
   * @param host The execution context hosting arguments
   */
  catch(exception: ForbiddenException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    // Frontend URL (retrieved from environment variables, defaulting to localhost for local development)
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Check if this exception is specifically thrown by AuthService when the user's email domain is not allowed
    if (exceptionResponse.message === 'DOMAIN_NOT_ALLOWED') {
      // 🔥 Redirect to frontend login page with the specific error query parameter
      return response.redirect(`${FRONTEND_URL}/login?error=domain_not_allowed`);
    }

    // For any other Forbidden errors, return a standard JSON error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      message: exceptionResponse.message || 'Forbidden',
    });
  }
}
