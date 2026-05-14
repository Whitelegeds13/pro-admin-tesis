/**
 * API Route: POST /api/auth/logout
 *
 * Cierra la sesión eliminando las cookies de tokens.
 */
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Sesión cerrada exitosamente',
  });

  // Eliminar cookies de tokens
  response.cookies.set({
    name: 'pg_refresh_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expirar inmediatamente
  });

  response.cookies.set({
    name: 'pg_access_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
