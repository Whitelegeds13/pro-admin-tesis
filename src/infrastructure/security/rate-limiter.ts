/**
 * Rate Limiter — Protección contra abuso de endpoints.
 *
 * Implementación in-memory con sliding window.
 * Para producción con múltiples instancias, usar Redis.
 *
 * Presets:
 * - LOGIN: 5 intentos / 15 min
 * - API: 100 requests / min
 * - CHAT: 20 mensajes / min
 * - UPLOAD: 10 uploads / hora
 * - STRICT: 3 intentos / 15 min (para operaciones sensibles)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number; // timestamp en ms
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Almacenamiento en memoria — se limpia automáticamente
const store = new Map<string, RateLimitEntry>();

// Limpieza periódica para evitar memory leaks (cada 5 minutos)
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// ─── Presets ─────────────────────────────────────────────────

export const RATE_LIMITS = {
  LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 } as RateLimitConfig,     // 5/15min
  API: { maxRequests: 100, windowMs: 60 * 1000 } as RateLimitConfig,           // 100/min
  CHAT: { maxRequests: 20, windowMs: 60 * 1000 } as RateLimitConfig,           // 20/min
  UPLOAD: { maxRequests: 10, windowMs: 60 * 60 * 1000 } as RateLimitConfig,    // 10/hora
  STRICT: { maxRequests: 3, windowMs: 15 * 60 * 1000 } as RateLimitConfig,     // 3/15min
} as const;

// ─── Función Principal ──────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  limit: number;
}

/**
 * Verifica si una petición está dentro del rate limit.
 *
 * @param identifier - IP o userId que identifica al solicitante
 * @param preset - Nombre del preset de rate limit
 * @returns Resultado indicando si la petición está permitida
 *
 * @example
 * const result = checkRateLimit(clientIP, 'LOGIN');
 * if (!result.allowed) {
 *   return new Response('Too Many Requests', { status: 429 });
 * }
 */
export function checkRateLimit(
  identifier: string,
  preset: keyof typeof RATE_LIMITS
): RateLimitResult {
  startCleanup();

  const config = RATE_LIMITS[preset];
  const key = `${preset}:${identifier}`;
  const now = Date.now();

  const existing = store.get(key);

  // Si no hay entrada o la ventana expiró, crear nueva
  if (!existing || now > existing.resetTime) {
    store.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      retryAfterMs: 0,
      limit: config.maxRequests,
    };
  }

  // Incrementar contador
  existing.count++;

  if (existing.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: existing.resetTime - now,
      limit: config.maxRequests,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    retryAfterMs: 0,
    limit: config.maxRequests,
  };
}

/**
 * Obtiene la IP del cliente desde los headers de la request.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}

/**
 * Agrega headers de rate limit a la respuesta.
 */
export function addRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
): void {
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  if (!result.allowed) {
    headers.set('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)));
  }
}
