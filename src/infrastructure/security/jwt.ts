/**
 * JWT Service — Manejo seguro de tokens con la librería `jose`.
 *
 * - Access Token: corta duración (15 min), se envía en header Authorization.
 * - Refresh Token: larga duración (7 días), se almacena en HttpOnly cookie.
 *
 * Usa `jose` en lugar de `jsonwebtoken` para compatibilidad con Edge Runtime (middleware Next.js).
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { RoleType } from '@/core/constants/roles';

// ─── Configuración ───────────────────────────────────────────

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'palacio-gamer-access-secret-change-in-production-2026'
);
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'palacio-gamer-refresh-secret-change-in-production-2026'
);

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const ISSUER = 'palacio-gamer';
const AUDIENCE = 'palacio-gamer-app';

// ─── Tipos ───────────────────────────────────────────────────

export interface TokenPayload extends JWTPayload {
  sub: string;        // ID del usuario
  email: string;
  name: string;
  role: RoleType;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number; // timestamp en ms
}

// ─── Generar Tokens ──────────────────────────────────────────

/**
 * Genera un par de tokens (access + refresh) para un usuario autenticado.
 */
export async function generateTokenPair(payload: {
  sub: string;
  email: string;
  name: string;
  role: RoleType;
}): Promise<TokenPair> {
  const now = Math.floor(Date.now() / 1000);
  const accessExpiry = now + 15 * 60; // 15 minutos

  const accessToken = await new SignJWT({
    ...payload,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(ACCESS_TOKEN_SECRET);

  const refreshToken = await new SignJWT({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_TOKEN_SECRET);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry: accessExpiry * 1000,
  };
}

// ─── Verificar Tokens ────────────────────────────────────────

/**
 * Verifica y decodifica un Access Token.
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if ((payload as TokenPayload).type !== 'access') {
      throw new Error('Token type inválido');
    }

    return payload as TokenPayload;
  } catch (error) {
    throw new Error(`Access token inválido: ${error instanceof Error ? error.message : 'unknown'}`);
  }
}

/**
 * Verifica y decodifica un Refresh Token.
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if ((payload as TokenPayload).type !== 'refresh') {
      throw new Error('Token type inválido');
    }

    return payload as TokenPayload;
  } catch (error) {
    throw new Error(`Refresh token inválido: ${error instanceof Error ? error.message : 'unknown'}`);
  }
}

// ─── Utilidades ──────────────────────────────────────────────

/**
 * Extrae el token Bearer del header Authorization.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

/**
 * Crea las opciones de la cookie HttpOnly para el refresh token.
 */
export function getRefreshTokenCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    name: 'pg_refresh_token',
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
  };
}
