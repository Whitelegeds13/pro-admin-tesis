/**
 * DTOs del chatbot con validación Zod v4.
 */
import { z } from 'zod';

const ChatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'El mensaje no puede estar vacío').max(4000, 'Mensaje demasiado largo'),
});

export const ChatRequestDTO = z.object({
  messages: z
    .array(ChatMessageSchema)
    .min(1, 'Se requiere al menos un mensaje')
    .max(50, 'Demasiados mensajes en el historial'),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});

export const ChatHistoryQueryDTO = z.object({
  userId: z.string().min(1, 'UserId requerido'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ChatRequestInput = z.infer<typeof ChatRequestDTO>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type ChatHistoryQueryInput = z.infer<typeof ChatHistoryQueryDTO>;
