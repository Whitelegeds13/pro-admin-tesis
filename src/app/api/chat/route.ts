/**
 * API Route: POST /api/chat
 *
 * Endpoint del chatbot inteligente con RAG, rate limiting y validación.
 * Accesible solo para usuarios autenticados.
 */
import { NextRequest } from 'next/server';
import { ChatRequestDTO } from '@/core/dtos/chat.dto';
import { processChat } from '@/services/chat.service';
import { formatErrorResponse } from '@/core/errors/app-error';
import { checkRateLimit, getClientIP, addRateLimitHeaders } from '@/infrastructure/security/rate-limiter';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting para chat (20/min)
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP, 'CHAT');

    if (!rateLimit.allowed) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimit);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Demasiados mensajes. Intenta de nuevo en ${Math.ceil(rateLimit.retryAfterMs / 1000)} segundos.`,
          code: 'RATE_LIMIT',
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parsear y validar entrada con Zod
    const body = await req.json();
    const parseResult = ChatRequestDTO.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        {
          success: false,
          message: 'Datos de entrada inválidos',
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 3. Procesar con el servicio de chat (RAG)
    const result = await processChat({
      messages: parseResult.data.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      userId: parseResult.data.userId,
      sessionId: parseResult.data.sessionId,
    });

    // 4. Retornar respuesta
    return Response.json({
      text: result.text,
      sessionId: result.sessionId,
      detectedCareer: result.detectedCareer,
      cached: result.cached,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    const { body, status } = formatErrorResponse(error);
    return Response.json(body, { status });
  }
}
