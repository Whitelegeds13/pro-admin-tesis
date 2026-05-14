/**
 * API Route: POST /api/auth/client/reset-password
 * Restablece la contraseña con un token válido.
 */
import { NextRequest } from 'next/server';
import { ResetPasswordDTO } from '@/core/dtos/password-reset.dto';
import { resetPassword } from '@/services/password-reset.service';
import { checkRateLimit, getClientIP } from '@/infrastructure/security/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
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
    const parseResult = ResetPasswordDTO.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        { success: false, message: 'Datos inválidos', errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // 3. Resetear contraseña
    const result = await resetPassword(parseResult.data.token, parseResult.data.newPassword);

    return Response.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return Response.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
