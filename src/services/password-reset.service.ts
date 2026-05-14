/**
 * Password Reset Service — Recuperación segura de contraseña.
 *
 * Flujo:
 * 1. Usuario solicita reset → se genera token crypto seguro
 * 2. Token se hashea con SHA-256 y se guarda en BD con expiración (1h)
 * 3. Se envía email con link que contiene el token plano
 * 4. Al resetear, se hashea el token recibido y se compara con BD
 * 5. Se actualiza la contraseña y se invalida el token
 *
 * Seguridad:
 * - Token de 32 bytes (256 bits de entropía)
 * - Se almacena hasheado (no reversible si la BD se compromete)
 * - Expiración de 1 hora
 * - Rate limiting en el endpoint
 * - No revela si el email existe o no (anti-enumeración)
 */
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import { sendEmail } from '@/lib/email';
import { passwordResetTemplate } from '@/lib/email-templates';

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hora

/**
 * Genera un token seguro y lo hashea para almacenamiento.
 */
function generateResetToken(): { plainToken: string; hashedToken: string; expires: Date } {
  const plainToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  return { plainToken, hashedToken, expires };
}

/**
 * Hashea un token plano para comparación con el almacenado.
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Solicitar recuperación de contraseña.
 * Siempre retorna éxito para no revelar si el email existe.
 */
export async function requestPasswordReset(
  email: string,
  appUrl?: string
): Promise<{ success: boolean; message: string }> {
  await connectDB();

  // Buscar cliente (incluir password para verificar que existe)
  const client = await Client.findOne({ email: email.toLowerCase(), isActive: true });

  if (!client) {
    // No revelar que el email no existe (anti-enumeración)
    return {
      success: true,
      message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.',
    };
  }

  // Generar token seguro
  const { plainToken, hashedToken, expires } = generateResetToken();

  // Guardar token hasheado en la BD
  client.resetPasswordToken = hashedToken;
  client.resetPasswordExpires = expires;
  await client.save();

  // Construir enlace de reset
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetLink = `${baseUrl}/reset-password?token=${plainToken}&email=${encodeURIComponent(email)}`;

  // Enviar email
  try {
    const html = passwordResetTemplate(client.name, resetLink);
    const result = await sendEmail({
      to: client.email,
      subject: 'Restablece tu contraseña — Palacio Gamer',
      html,
    });
    if (!result.success) {
      console.error('Error enviando email de reset:', result.error);
    }
  } catch (error) {
    console.error('Error enviando email de reset:', error);
    // No fallar la operación — el token queda guardado
  }

  return {
    success: true,
    message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.',
  };
}

/**
 * Resetear la contraseña usando el token.
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  await connectDB();

  // Hashear el token recibido para comparar con el almacenado
  const hashedToken = hashToken(token);

  // Buscar cliente con token válido y no expirado
  const client = await Client.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
    isActive: true,
  }).select('+password');

  if (!client) {
    return {
      success: false,
      message: 'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.',
    };
  }

  // Actualizar contraseña (el pre-save hook la hasheará con bcrypt)
  client.password = newPassword;
  client.resetPasswordToken = undefined;
  client.resetPasswordExpires = undefined;
  await client.save();

  // Enviar email de confirmación
  try {
    const result = await sendEmail({
      to: client.email,
      subject: 'Tu contraseña ha sido actualizada — Palacio Gamer',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">🔒 Contraseña Actualizada</h2>
          <p>Hola ${client.name},</p>
          <p>Tu contraseña ha sido restablecida exitosamente.</p>
          <p>Si no realizaste este cambio, contacta inmediatamente a nuestro equipo de soporte.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            © ${new Date().getFullYear()} Palacio Gamer
          </p>
        </div>
      `,
    });
    if (!result.success) {
      console.error('Error enviando confirmación de reset:', result.error);
    }
  } catch (error) {
    console.error('Error enviando confirmación de reset:', error);
  }

  return {
    success: true,
    message: 'Tu contraseña ha sido actualizada exitosamente.',
  };
}
