/**
 * DTOs de Cotizaciones con Zod v4.
 */
import { z } from 'zod';

const QuotationItemSchema = z.object({
  product: z.string().optional(),
  name: z.string('Nombre del producto requerido').min(1).max(200).trim(),
  price: z.number('Precio requerido').min(0),
  quantity: z.number('Cantidad requerida').int().min(1),
});

export const CreateQuotationDTO = z.object({
  clientId: z.string('El cliente es requerido').min(1),
  items: z.array(QuotationItemSchema).min(1, 'Debe incluir al menos un producto'),
  currency: z.enum(['PEN', 'USD', 'EUR']).default('PEN'),
  includeIgv: z.boolean().default(true),
  discount: z.number().min(0).max(100).default(0), // Porcentaje
  validDays: z.number().int().min(1).max(90).default(15),
  notes: z.string().max(1000).trim().optional(),
});

export const UpdateQuotationDTO = z.object({
  status: z.enum(['DRAFT', 'SENT', 'APPROVED', 'EXPIRED', 'CONVERTED']).optional(),
  items: z.array(QuotationItemSchema).min(1).optional(),
  discount: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).trim().optional(),
  validDays: z.number().int().min(1).max(90).optional(),
});

export const QuotationQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().optional(),
  clientId: z.string().optional(),
  search: z.string().max(200).trim().optional(),
});

export type CreateQuotationInput = z.infer<typeof CreateQuotationDTO>;
export type UpdateQuotationInput = z.infer<typeof UpdateQuotationDTO>;
export type QuotationQueryInput = z.infer<typeof QuotationQueryDTO>;
