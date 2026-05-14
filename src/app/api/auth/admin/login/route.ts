/**
 * API Route: POST /api/auth/admin/login
 *
 * Login de administrador/empleado con JWT, rate limiting y validación Zod.
 */
import { NextRequest, NextResponse } from 'next/server';
import { AdminLoginDTO } from '@/core/dtos/auth.dto';
import { loginAdmin } from '@/services/auth.service';
import { formatErrorResponse } from '@/core/errors/app-error';
import { checkRateLimit, getClientIP, addRateLimitHeaders } from '@/infrastructure/security/rate-limiter';
import { getRefreshTokenCookieOptions } from '@/infrastructure/security/jwt';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting (más estricto para admin)
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, 'LOGIN');

    if (!rateLimit.allowed) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimit);
      return NextResponse.json(
        {
          success: false,
          message: `Demasiados intentos de login. Intenta de nuevo en ${Math.ceil(rateLimit.retryAfterMs / 1000)} segundos.`,
          code: 'RATE_LIMIT',
        },
        { status: 429, headers }
      );
    }

    // 2. Validación con Zod
    const body = await request.json();
    const parseResult = AdminLoginDTO.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          success: false,
          message: 'Datos de entrada inválidos',
          errors,
        },
        { status: 400 }
      );
    }

    // 3. Login a través del servicio
    const result = await loginAdmin(parseResult.data);

    // 4. Crear respuesta con tokens
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login exitoso',
        employee: result.user,
        accessToken: result.tokens.accessToken,
        accessTokenExpiry: result.tokens.accessTokenExpiry,
      },
      { status: 200 }
    );

    // 5. Establecer refresh token como HttpOnly cookie
    const cookieOptions = getRefreshTokenCookieOptions();
    response.cookies.set({
      ...cookieOptions,
      value: result.tokens.refreshToken,
    });

    // Access token cookie para middleware
    response.cookies.set({
      name: 'pg_access_token',
      value: result.tokens.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    return response;
  } catch (error) {
    const { body, status } = formatErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { message: 'Método no permitido' },
    { status: 405 }
  );
}