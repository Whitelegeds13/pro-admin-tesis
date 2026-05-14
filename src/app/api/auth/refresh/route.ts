/**
 * API Route: POST /api/auth/refresh
 *
 * Renueva el access token usando el refresh token de la cookie.
 */
import { NextRequest, NextResponse } from 'next/server';
import { refreshTokens } from '@/services/auth.service';
import { formatErrorResponse, AuthenticationError } from '@/core/errors/app-error';
import { getRefreshTokenCookieOptions } from '@/infrastructure/security/jwt';
import { checkRateLimit, getClientIP } from '@/infrastructure/security/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, 'API');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Demasiadas solicitudes', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }

    // Obtener refresh token de cookie o body
    const refreshToken = request.cookies.get('pg_refresh_token')?.value;

    if (!refreshToken) {
      throw new AuthenticationError('No se encontró refresh token');
    }

    const tokens = await refreshTokens(refreshToken);

    const response = NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      accessTokenExpiry: tokens.accessTokenExpiry,
    });

    // Actualizar cookies
    const cookieOptions = getRefreshTokenCookieOptions();
    response.cookies.set({
      ...cookieOptions,
      value: tokens.refreshToken,
    });

    response.cookies.set({
      name: 'pg_access_token',
      value: tokens.accessToken,
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
