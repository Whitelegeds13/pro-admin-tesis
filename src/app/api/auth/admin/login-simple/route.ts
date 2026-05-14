/**
 * RUTA DEPRECADA — login-simple
 *
 * Esta ruta ha sido eliminada por seguridad.
 * Usa /api/auth/admin/login con JWT en su lugar.
 */
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Esta ruta ha sido deprecada por seguridad. Usa /api/auth/admin/login en su lugar.',
    },
    { status: 410 } // 410 Gone
  );
}

export async function GET() {
  return NextResponse.json(
    { message: 'Ruta deprecada' },
    { status: 410 }
  );
}
