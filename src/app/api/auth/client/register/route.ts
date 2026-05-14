/**
 * API Route: POST /api/auth/client/register
 *
 * Registro de cliente con JWT, Zod validation y rate limiting.
 */
import { NextRequest, NextResponse } from 'next/server';
import { ClientRegisterDTO } from '@/core/dtos/auth.dto';
import { registerClient } from '@/services/auth.service';
import { formatErrorResponse } from '@/core/errors/app-error';
import { checkRateLimit, getClientIP } from '@/infrastructure/security/rate-limiter';
import { getRefreshTokenCookieOptions } from '@/infrastructure/security/jwt';
import { sendEmail } from '@/lib/email';
import { welcomeEmailTemplate } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, 'STRICT');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Demasiados intentos de registro. Intenta más tarde.',
          code: 'RATE_LIMIT',
        },
        { status: 429 }
      );
    }

    // 2. Validación con Zod
    const body = await request.json();
    const parseResult = ClientRegisterDTO.safeParse(body);

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

    // 3. Registrar a través del servicio
    const result = await registerClient(parseResult.data);

    // 4. Enviar email de bienvenida (no bloquea la respuesta)
    try {
      const emailHtml = welcomeEmailTemplate(parseResult.data.name);
      await sendEmail({
        to: parseResult.data.email,
        subject: '¡Bienvenido a Palacio Gamer!',
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Error enviando email de bienvenida:', emailError);
    }

    // 5. Crear respuesta con tokens
    const response = NextResponse.json(
      {
        success: true,
        message: 'Cliente registrado exitosamente',
        client: result.user,
        accessToken: result.tokens.accessToken,
        accessTokenExpiry: result.tokens.accessTokenExpiry,
      },
      { status: 201 }
    );

    // 6. Cookies de tokens
    const cookieOptions = getRefreshTokenCookieOptions();
    response.cookies.set({
      ...cookieOptions,
      value: result.tokens.refreshToken,
    });

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
