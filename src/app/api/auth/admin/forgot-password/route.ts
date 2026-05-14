/**
 * API Route: POST /api/auth/admin/forgot-password
 * Solicita recuperación de contraseña para empleados.
 */
import { NextRequest } from 'next/server';
import { requestAdminPasswordReset } from '@/services/admin-password-reset.service';
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
    const { employeeId } = body;

    if (!employeeId || typeof employeeId !== 'string' || employeeId.trim().length === 0) {
      return Response.json(
        { success: false, message: 'El ID de empleado es requerido.' },
        { status: 400 }
      );
    }

    const result = await requestAdminPasswordReset(employeeId.trim(), req.nextUrl.origin);

    // Siempre retornar 200 (anti-enumeración)
    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error('Admin Forgot Password Error:', error);
    return Response.json(
      { success: true, message: 'Si el ID de empleado existe, se enviará un enlace de recuperación.' },
      { status: 200 }
    );
  }
}
