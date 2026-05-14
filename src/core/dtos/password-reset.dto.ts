/**
 * DTOs de recuperación de contraseña con Zod v4.
 */
import { z } from 'zod';

export const ForgotPasswordDTO = z.object({
  email: z
    .string('El email es requerido')
    .email('Email inválido')
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
});

export const ResetPasswordDTO = z.object({
  token: z
    .string('El token es requerido')
    .min(1, 'Token inválido'),
  newPassword: z
    .string('La nueva contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'Contraseña demasiado larga')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    ),
  confirmPassword: z
    .string('La confirmación es requerida')
    .min(1, 'Confirma tu contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordDTO>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordDTO>;
