/**
 * DTOs de autenticación con validación Zod v4.
 * Garantizan que los datos de entrada cumplen el formato esperado.
 */
import { z } from 'zod';

// ─── Client Auth ─────────────────────────────────────────────

export const ClientLoginDTO = z.object({
  email: z
    .string('El email es requerido')
    .email('Email inválido')
    .max(255, 'Email demasiado largo')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string('La contraseña es requerida')
    .min(1, 'La contraseña es requerida')
    .max(128, 'Contraseña demasiado larga'),
});

export const ClientRegisterDTO = z.object({
  name: z
    .string('El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo')
    .trim(),
  documentType: z.enum(['DNI', 'RUC', 'CE', 'PASSPORT'], 'Tipo de documento inválido'),
  documentNumber: z
    .string('El número de documento es requerido')
    .min(6, 'Número de documento inválido')
    .max(20, 'Número de documento demasiado largo')
    .trim(),
  phone: z
    .string('El teléfono es requerido')
    .min(6, 'Teléfono inválido')
    .max(20, 'Teléfono demasiado largo')
    .trim(),
  email: z
    .string('El email es requerido')
    .email('Email inválido')
    .max(255, 'Email demasiado largo')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string('La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'Contraseña demasiado larga')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    ),
  address: z.string().max(255).trim().optional(),
  city: z.string().max(100).trim().optional(),
  district: z.string().max(100).trim().optional(),
});

export const PasswordResetRequestDTO = z.object({
  email: z
    .string('El email es requerido')
    .email('Email inválido')
    .transform((v) => v.toLowerCase().trim()),
});

export const PasswordResetDTO = z.object({
  email: z
    .string('El email es requerido')
    .email('Email inválido')
    .transform((v) => v.toLowerCase().trim()),
  token: z
    .string('El token es requerido')
    .min(1, 'Token inválido'),
  newPassword: z
    .string('La nueva contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'Contraseña demasiado larga'),
});

export const ProfileUpdateDTO = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z.string().min(6).max(20).trim().optional(),
  address: z.string().max(255).trim().optional(),
  city: z.string().max(100).trim().optional(),
  district: z.string().max(100).trim().optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128)
    .optional(),
});

// ─── Admin/Employee Auth ─────────────────────────────────────

export const AdminLoginDTO = z.object({
  employeeId: z
    .string('El ID de empleado es requerido')
    .min(1, 'El ID de empleado es requerido')
    .max(50, 'ID demasiado largo')
    .transform((v) => v.toUpperCase().trim()),
  password: z
    .string('La contraseña es requerida')
    .min(1, 'La contraseña es requerida')
    .max(128, 'Contraseña demasiado larga'),
});

// ─── Token Refresh ───────────────────────────────────────────

export const RefreshTokenDTO = z.object({
  refreshToken: z
    .string('El refresh token es requerido')
    .min(1, 'Token inválido'),
});

// ─── Inferred Types ──────────────────────────────────────────

export type ClientLoginInput = z.infer<typeof ClientLoginDTO>;
export type ClientRegisterInput = z.infer<typeof ClientRegisterDTO>;
export type AdminLoginInput = z.infer<typeof AdminLoginDTO>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestDTO>;
export type PasswordResetInput = z.infer<typeof PasswordResetDTO>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateDTO>;
