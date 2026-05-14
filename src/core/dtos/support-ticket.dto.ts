/**
 * DTOs de Soporte Técnico con Zod v4.
 */
import { z } from 'zod';

export const CreateTicketDTO = z.object({
  subject: z.string('El asunto es requerido').min(3).max(200).trim(),
  description: z.string('La descripción es requerida').min(10).max(5000).trim(),
  category: z.enum(['HARDWARE', 'SOFTWARE', 'NETWORK', 'PERIPHERAL', 'WARRANTY', 'OTHER']).default('OTHER'),
  priority: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
  deviceInfo: z.object({
    type: z.string().max(50).trim(),
    brand: z.string().max(50).trim(),
    model: z.string().max(100).trim(),
    serialNumber: z.string().max(50).trim().optional(),
  }).optional(),
  attachments: z.array(z.string()).max(5).default([]),
});

export const UpdateTicketStatusDTO = z.object({
  status: z.enum(['RECIBIDO', 'DIAGNOSTICO', 'REPARACION', 'ESPERANDO_REPUESTO', 'FINALIZADO', 'ENTREGADO', 'CANCELADO']),
  reason: z.string().max(500).trim().optional(),
  estimatedCost: z.number().min(0).optional(),
  finalCost: z.number().min(0).optional(),
  estimatedDate: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const AddTicketCommentDTO = z.object({
  content: z.string('El contenido es requerido').min(1).max(2000).trim(),
  isInternal: z.boolean().default(false),
  attachments: z.array(z.string()).max(3).default([]),
});

export const TicketQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  clientId: z.string().optional(),
  assignedTo: z.string().optional(),
  search: z.string().max(200).trim().optional(),
});

export type CreateTicketInput = z.infer<typeof CreateTicketDTO>;
export type UpdateTicketStatusInput = z.infer<typeof UpdateTicketStatusDTO>;
export type AddTicketCommentInput = z.infer<typeof AddTicketCommentDTO>;
export type TicketQueryInput = z.infer<typeof TicketQueryDTO>;
