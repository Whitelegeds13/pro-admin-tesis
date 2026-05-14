/**
 * API Route: POST /api/auth/client/forgot-password
 * Solicita un enlace de recuperación de contraseña.
 */
import { NextRequest } from 'next/server';
import { ForgotPasswordDTO } from '@/core/dtos/password-reset.dto';
import { requestPasswordReset } from '@/services/password-reset.service';
import { checkRateLimit, getClientIP } from '@/infrastructure/security/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting estricto (3 intentos / 15 min)
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP, 'STRICT');

    if (!rateLimit.allowed) {
      return Response.json(
        { success: false, message: 'Demasiados intentos. Espera unos minutos.' },
        { status: 429 }
      );
    }

    // 2. Validar input
    const body = await req.json();
    const parseResult = ForgotPasswordDTO.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        { success: false, message: 'Email inválido', errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // 3. Procesar solicitud
    const result = await requestPasswordReset(parseResult.data.email, req.nextUrl.origin);

    // Siempre retornar 200 (anti-enumeración)
    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return Response.json(
      { success: true, message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.' },
      { status: 200 }
    );
  }
}
