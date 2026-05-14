/**
 * DTOs de productos con validación Zod v4.
 */
import { z } from 'zod';

export const ProductCreateDTO = z.object({
  code: z
    .string('El código es requerido')
    .min(1, 'El código es requerido')
    .max(50, 'Código demasiado largo')
    .transform((v) => v.toUpperCase().trim()),
  name: z
    .string('El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'Nombre demasiado largo')
    .trim(),
  description: z.string().max(2000, 'Descripción demasiado larga').trim().optional(),
  brand: z.string('La marca es requerida').min(1),
  category: z.string('La categoría es requerida').min(1),
  price: z
    .number('El precio es requerido')
    .min(0, 'El precio debe ser positivo'),
  costPrice: z.number().min(0, 'El costo debe ser positivo').optional(),
  stock: z
    .number('El stock es requerido')
    .int('El stock debe ser entero')
    .min(0, 'El stock no puede ser negativo'),
  minStock: z
    .number('El stock mínimo es requerido')
    .int()
    .min(0, 'El stock mínimo no puede ser negativo'),
  maxStock: z.number().int().min(0).optional(),
  images: z.array(z.string()).default([]),
  specifications: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  tags: z.array(z.string().max(50)).default([]),
  isActive: z.boolean().default(true),
  isDigital: z.boolean().default(false),
  weight: z.number().min(0).optional(),
  dimensions: z
    .object({
      length: z.number().min(0),
      width: z.number().min(0),
      height: z.number().min(0),
    })
    .optional(),
  sku: z.string().max(50).trim().optional(),
  barcode: z.string().max(50).trim().optional(),
});

export const ProductUpdateDTO = ProductCreateDTO.partial();

export const ProductQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).trim().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  isActive: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'stock']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ProductCreateInput = z.infer<typeof ProductCreateDTO>;
export type ProductUpdateInput = z.infer<typeof ProductUpdateDTO>;
export type ProductQueryInput = z.infer<typeof ProductQueryDTO>;
