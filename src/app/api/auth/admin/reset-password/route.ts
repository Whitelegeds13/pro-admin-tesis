/**
 * API Route: POST /api/auth/admin/reset-password
 * Restablece la contraseña de un empleado con token.
 */
import { NextRequest } from 'next/server';
import { resetAdminPassword } from '@/services/admin-password-reset.service';
import { checkRateLimit, getClientIP } from '@/infrastructure/security/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP, 'STRICT');

    if (!rateLimit.allowed) {
      return Response.json(
        { success: false, message: 'Demasiados intentos. Espera unos minutos.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { token, newPassword, confirmPassword } = body;

    if (!token || typeof token !== 'string') {
      return Response.json({ success: false, message: 'Token inválido.' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return Response.json(
        { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return Response.json(
        { success: false, message: 'Las contraseñas no coinciden.' },
        { status: 400 }
      );
    }

    const result = await resetAdminPassword(token, newPassword);
    return Response.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Admin Reset Password Error:', error);
    return Response.json(
      { success: false, message: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
