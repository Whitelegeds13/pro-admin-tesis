/**
 * Next.js Middleware — Protección centralizada de rutas.
 *
 * Se ejecuta en Edge Runtime antes de cada request.
 * Verifica JWT para rutas protegidas y aplica rate limiting básico.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'palacio-gamer-access-secret-change-in-production-2026'
);

// Rutas que requieren autenticación de admin (JWT)
const PROTECTED_ADMIN_API_ROUTES = [
  '/api/admin/',
];

// Rutas públicas que NO requieren autenticación
const PUBLIC_ROUTES = [
  '/api/auth/',
  '/api/chat',
  '/api/payments/',
  '/api/test-email',
];

/**
 * Verifica si la ruta está protegida.
 */
function isProtectedAdminRoute(pathname: string): boolean {
  return PROTECTED_ADMIN_API_ROUTES.some((route) => pathname.startsWith(route));
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Proteger API routes de admin ──────────────────────────
  if (isProtectedAdminRoute(pathname) && !isPublicRoute(pathname)) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // También verificar cookie para compatibilidad con el panel admin
    const cookieToken = request.cookies.get('pg_access_token')?.value;
    const finalToken = token || cookieToken;

    if (!finalToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'No autenticado. Se requiere token de acceso.',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(finalToken, ACCESS_TOKEN_SECRET, {
        issuer: 'palacio-gamer',
        audience: 'palacio-gamer-app',
      });

      // Inyectar datos del usuario en los headers para que las API routes los lean
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', String(payload.sub));
      requestHeaders.set('x-user-email', String(payload.email));
      requestHeaders.set('x-user-role', String(payload.role));
      requestHeaders.set('x-user-name', String(payload.name));

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Token inválido o expirado.',
          code: 'INVALID_TOKEN',
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    // Proteger todas las API routes de admin
    '/api/admin/:path*',
  ],
};
