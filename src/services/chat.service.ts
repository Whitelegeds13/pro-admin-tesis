/**
 * Chat Service — Lógica del chatbot inteligente con RAG.
 *
 * Implementa:
 * - Retrieval Augmented Generation (RAG) simplificado
 * - Detección de carrera/profesión
 * - Historial conversacional persistente
 * - Optimización de tokens (envía solo productos relevantes)
 * - Cache de respuestas frecuentes
 * - Sistema de recomendaciones inteligentes
 */
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import ChatHistory, { type IChatMessage } from '@/models/ChatHistory';
import { getProductsForChat } from '@/services/product.service';

// ─── Cache simple en memoria ─────────────────────────────────

interface CacheEntry {
  response: string;
  timestamp: number;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

function getCacheKey(message: string): string {
  // Normalizar el mensaje para mejorar cache hits
  return message.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

function getCachedResponse(message: string): string | null {
  const key = getCacheKey(message);
  const entry = responseCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.response;
  }
  if (entry) responseCache.delete(key);
  return null;
}

function setCachedResponse(message: string, response: string): void {
  const key = getCacheKey(message);
  responseCache.set(key, { response, timestamp: Date.now() });

  // Limpiar cache si es muy grande
  if (responseCache.size > 200) {
    const oldest = Array.from(responseCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 50);
    for (const [k] of oldest) {
      responseCache.delete(k);
    }
  }
}

// ─── Detección de Intención / Carrera ────────────────────────

const CAREER_KEYWORDS: Record<string, string[]> = {
  'Ingeniería de Software': ['software', 'programación', 'desarrollo', 'coding', 'programar', 'developer', 'sistemas'],
  'Ingeniería de Sistemas': ['sistemas', 'redes', 'infraestructura', 'servidores'],
  'Diseño Gráfico': ['diseño', 'gráfico', 'photoshop', 'illustrator', 'adobe', 'creatividad'],
  'Arquitectura': ['arquitectura', 'autocad', 'revit', 'render', '3d', 'planos', 'bim'],
  'Ingeniería Civil': ['civil', 'construcción', 'estructura', 'autocad'],
  'Animación Digital': ['animación', 'maya', 'blender', '3ds max', 'motion graphics'],
  'Medicina': ['medicina', 'médico', 'doctor', 'salud', 'clínica'],
  'Derecho': ['derecho', 'abogado', 'leyes', 'jurídico'],
  'Contabilidad': ['contabilidad', 'contable', 'finanzas', 'excel', 'tributario'],
  'Marketing': ['marketing', 'publicidad', 'redes sociales', 'digital marketing'],
  'Gaming': ['gamer', 'juegos', 'gaming', 'fps', 'streamer', 'esports'],
  'Video/Streaming': ['video', 'edición', 'streaming', 'youtube', 'obs', 'premiere'],
};

/**
 * Detecta la carrera o profesión del usuario basándose en el texto.
 */
function detectCareer(text: string): string | undefined {
  const lower = text.toLowerCase();

  for (const [career, keywords] of Object.entries(CAREER_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return career;
    }
  }
  return undefined;
}

/**
 * Detecta palabras clave de búsqueda para filtrar productos relevantes.
 */
function extractSearchTerms(text: string): string[] {
  const lower = text.toLowerCase();
  const techTerms = [
    'gpu', 'tarjeta gráfica', 'procesador', 'cpu', 'ram', 'memoria',
    'ssd', 'disco', 'monitor', 'pantalla', 'teclado', 'mouse', 'ratón',
    'laptop', 'portátil', 'notebook', 'pc', 'computadora', 'computador',
    'auriculares', 'headset', 'webcam', 'cámara', 'fuente', 'case',
    'gabinete', 'refrigeración', 'cooler', 'placa madre', 'motherboard',
    'nvidia', 'amd', 'intel', 'ryzen', 'geforce', 'rtx', 'rx',
    'gaming', 'gamer', 'barato', 'económico', 'potente', 'profesional',
  ];

  return techTerms.filter((term) => lower.includes(term));
}

// ─── Servicio Principal ──────────────────────────────────────

export interface ChatServiceInput {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId?: string;
  sessionId?: string;
}

export interface ChatServiceResult {
  text: string;
  sessionId: string;
  detectedCareer?: string;
  productsRecommended: string[];
  cached: boolean;
}

/**
 * Procesa un mensaje del chatbot con RAG.
 */
export async function processChat(input: ChatServiceInput): Promise<ChatServiceResult> {
  await connectDB();

  const lastUserMessage = input.messages[input.messages.length - 1]?.content || '';
  const sessionId = input.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // 1. Verificar cache para mensajes simples/frecuentes
  if (input.messages.length === 1) {
    const cached = getCachedResponse(lastUserMessage);
    if (cached) {
      return {
        text: cached,
        sessionId,
        cached: true,
        productsRecommended: [],
      };
    }
  }

  // 2. Detectar carrera/profesión del usuario
  const detectedCareer = detectCareer(lastUserMessage);

  // 3. Extraer términos de búsqueda para filtrar productos relevantes (RAG Retrieve)
  const searchTerms = extractSearchTerms(lastUserMessage);

  // 4. Recuperar productos relevantes (en lugar de TODOS los productos)
  const searchQuery = searchTerms.length > 0 ? searchTerms.join(' ') : undefined;
  const relevantProducts = await getProductsForChat({
    search: searchQuery,
    limit: searchTerms.length > 0 ? 15 : 25, // Menos productos si hay búsqueda específica
  });

  // 5. Construir contexto optimizado (Augment)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productContext = relevantProducts.map((p: any) => {
    const catName = p.category?.name || 'Varios';
    const brandName = p.brand?.name || 'N/A';
    const specs = p.specifications
      ? Object.entries(p.specifications)
          .slice(0, 5)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      : '';
    return `- ${p.name} | S/${p.price} | Marca: ${brandName} | Cat: ${catName}${specs ? ` | Specs: ${specs}` : ''}`;
  }).join('\n');

  // 6. Cargar contexto previo de la conversación si hay historial
  let conversationContext = '';
  if (input.userId) {
    const previousSession = await ChatHistory.findOne({
      client: input.userId,
      isActive: true,
    }).sort({ updatedAt: -1 });

    if (previousSession?.context?.detectedCareer) {
      conversationContext = `\nContexto previo: El usuario estudia/trabaja en ${previousSession.context.detectedCareer}.`;
    }
  }

  // 7. Construir System Prompt optimizado (Generate)
  const systemPrompt = `Eres un experto asistente virtual de ventas para "Palacio Gamer", una tienda de tecnología y gaming en Perú.

CAPACIDADES:
- Recomendar productos según la carrera, profesión o necesidades del usuario
- Asesorar sobre especificaciones técnicas
- Comparar productos del catálogo
- Sugerir configuraciones completas (PC armadas)

CATÁLOGO DISPONIBLE (precios en Soles):
---
${productContext}
---
${conversationContext}
${detectedCareer ? `\n🎓 CARRERA DETECTADA: ${detectedCareer}. Personaliza las recomendaciones para esta carrera.` : ''}

REGLAS ESTRICTAS:
1. Habla en español, sé amable y profesional.
2. Solo recomienda productos del catálogo proporcionado. NUNCA inventes productos.
3. Si detectas la carrera del usuario, recomienda 2-3 productos específicos explicando por qué son ideales para su carrera.
4. Usa formato Markdown: **negritas**, listas, emojis para hacerlo legible.
5. Incluye SIEMPRE el precio en Soles (S/) de cada producto recomendado.
6. Si no tienes un producto que cubra la necesidad, dilo honestamente y sugiere la alternativa más cercana.
7. Sé conciso: máximo 300 palabras por respuesta.
8. No des información sobre stock, disponibilidad ni tiempos de envío.`;

  // 8. Llamar a Gemini
  const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    system: systemPrompt,
    messages: input.messages.slice(-10), // Solo últimos 10 mensajes para eficiencia
  });

  // 9. Guardar en historial si el usuario está autenticado
  if (input.userId) {
    try {
      const chatMessage: IChatMessage = {
        role: 'user',
        content: lastUserMessage,
        timestamp: new Date(),
        metadata: { detectedCareer },
      };

      const assistantMessage: IChatMessage = {
        role: 'assistant',
        content: text,
        timestamp: new Date(),
        metadata: {
          productsRecommended: relevantProducts.slice(0, 5).map((p: any) => p.name),
        },
      };

      await ChatHistory.findOneAndUpdate(
        { sessionId },
        {
          $push: { messages: { $each: [chatMessage, assistantMessage] } },
          $set: {
            client: input.userId,
            isActive: true,
            ...(detectedCareer && { 'context.detectedCareer': detectedCareer }),
          },
          $inc: { totalTokensUsed: text.length }, // Aproximación
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error guardando historial de chat:', error);
      // No fallar la respuesta por error de historial
    }
  }

  // 10. Cachear respuesta para mensajes simples
  if (input.messages.length === 1) {
    setCachedResponse(lastUserMessage, text);
  }

  return {
    text,
    sessionId,
    detectedCareer,
    productsRecommended: relevantProducts.slice(0, 5).map((p: any) => p.name),
    cached: false,
  };
}

/**
 * Obtener historial de conversaciones de un usuario.
 */
export async function getChatHistory(userId: string, page = 1, limit = 20) {
  await connectDB();

  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    ChatHistory.find({ client: userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('sessionId context messages.role messages.content messages.timestamp createdAt updatedAt')
      .lean(),
    ChatHistory.countDocuments({ client: userId }),
  ]);

  return {
    sessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Limpiar historial de chat de un usuario (marcar como inactivo).
 */
export async function clearChatHistory(userId: string): Promise<void> {
  await connectDB();
  await ChatHistory.updateMany({ client: userId }, { $set: { isActive: false } });
}
