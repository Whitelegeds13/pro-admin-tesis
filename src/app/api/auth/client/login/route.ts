/**
 * API Route: POST /api/auth/client/login
 *
 * Login de cliente con JWT, rate limiting y validación Zod.
 */
import { NextRequest, NextResponse } from 'next/server';
import { ClientLoginDTO } from '@/core/dtos/auth.dto';
import { loginClient } from '@/services/auth.service';
import { formatErrorResponse } from '@/core/errors/app-error';
import { checkRateLimit, getClientIP, addRateLimitHeaders } from '@/infrastructure/security/rate-limiter';
import { getRefreshTokenCookieOptions } from '@/infrastructure/security/jwt';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
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
    const parseResult = ClientLoginDTO.safeParse(body);

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
    const result = await loginClient(parseResult.data);

    // 4. Crear respuesta con tokens
    const response = NextResponse.json(
      {
        success: true,
        message: 'Inicio de sesión exitoso',
        client: result.user,
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

    // Tambien enviar access token como cookie para el middleware
    response.cookies.set({
      name: 'pg_access_token',
      value: result.tokens.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutos
    });

    // Rate limit headers
    const headers = new Headers(response.headers);
    addRateLimitHeaders(headers, rateLimit);

    return response;
  } catch (error) {
    const { body, status } = formatErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
