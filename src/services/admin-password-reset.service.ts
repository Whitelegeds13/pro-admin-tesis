/**
 * Admin Password Reset Service — Recuperación de contraseña para empleados.
 *
 * Flujo:
 * 1. Empleado ingresa su ID de empleado
 * 2. Se busca el empleado y se genera un token SHA-256 seguro
 * 3. Se envía email al correo registrado del empleado
 * 4. Al resetear, se valida el token y se actualiza la contraseña
 */
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { sendEmail } from '@/lib/email';

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hora

// Almacenamiento temporal de tokens de reset para empleados
// En producción, esto debería estar en Redis o en un campo del modelo
const adminResetTokens = new Map<string, { employeeId: string; expires: Date }>();

function generateResetToken(): { plainToken: string; hashedToken: string; expires: Date } {
  const plainToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
  return { plainToken, hashedToken, expires };
}

/**
 * Solicitar recuperación de contraseña para empleado.
 */
export async function requestAdminPasswordReset(
  employeeId: string,
  appUrl?: string
): Promise<{ success: boolean; message: string }> {
  await connectDB();

  const employee = await Employee.findOne({ employeeId: employeeId.toUpperCase(), isActive: true });

  if (!employee) {
    // Anti-enumeración
    return {
      success: true,
      message: 'Si el ID de empleado existe, se enviará un enlace de recuperación al correo registrado.',
    };
  }

  const { plainToken, hashedToken, expires } = generateResetToken();

  // Guardar token hasheado en memoria (mapa)
  adminResetTokens.set(hashedToken, { employeeId: employee.employeeId, expires });

  // Limpiar tokens expirados
  for (const [key, value] of adminResetTokens.entries()) {
    if (value.expires < new Date()) adminResetTokens.delete(key);
  }

  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetLink = `${baseUrl}/admin/reset-password?token=${plainToken}&eid=${encodeURIComponent(employee.employeeId)}`;

  // Enviar email
  try {
    const result = await sendEmail({
      to: employee.email,
      subject: 'Restablece tu contraseña — Panel Admin Palacio Gamer',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <div style="background: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e5e7eb;">
            <div style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px;">
              <h1 style="color: #2563eb; font-size: 24px; margin: 0;">🎮 Palacio Gamer</h1>
              <p style="color: #6b7280; margin: 5px 0 0;">Panel Administrativo</p>
            </div>
            <h2 style="color: #1f2937; margin-top: 0;">Restablecer Contraseña</h2>
            <p>Hola <strong>${employee.name}</strong>,</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta administrativa <strong>${employee.employeeId}</strong>.</p>
            <p>Haz clic en el botón para crear una nueva contraseña:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Restablecer Contraseña
              </a>
            </div>
            <p style="color: #6b7280; font-size: 13px;">Este enlace expira en <strong>1 hora</strong>.</p>
            <p style="color: #6b7280; font-size: 13px;">Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Palacio Gamer. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      `,
    });
    if (!result.success) {
      console.error('Error enviando email de reset admin:', result.error);
    }
  } catch (error) {
    console.error('Error enviando email de reset admin:', error);
  }

  return {
    success: true,
    message: 'Si el ID de empleado existe, se enviará un enlace de recuperación al correo registrado.',
  };
}

/**
 * Resetear contraseña de empleado.
 */
export async function resetAdminPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  await connectDB();

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const tokenData = adminResetTokens.get(hashedToken);

  if (!tokenData || tokenData.expires < new Date()) {
    adminResetTokens.delete(hashedToken);
    return {
      success: false,
      message: 'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.',
    };
  }

  const employee = await Employee.findOne({
    employeeId: tokenData.employeeId,
    isActive: true,
  }).select('+password');

  if (!employee) {
    return { success: false, message: 'Empleado no encontrado.' };
  }

  // Actualizar contraseña (el pre-save hook hasheará con bcrypt)
  employee.password = newPassword;
  await employee.save();

  // Invalidar el token
  adminResetTokens.delete(hashedToken);

  // Email de confirmación
  try {
    const result = await sendEmail({
      to: employee.email,
      subject: 'Contraseña actualizada — Panel Admin Palacio Gamer',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">🔒 Contraseña Actualizada</h2>
          <p>Hola ${employee.name},</p>
          <p>La contraseña de tu cuenta administrativa <strong>${employee.employeeId}</strong> ha sido restablecida exitosamente.</p>
          <p>Si no realizaste este cambio, contacta inmediatamente al equipo de seguridad.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">© ${new Date().getFullYear()} Palacio Gamer</p>
        </div>
      `,
    });
    if (!result.success) {
      console.error('Error enviando confirmación de reset admin:', result.error);
    }
  } catch (error) {
    console.error('Error enviando confirmación de reset admin:', error);
  }

  return { success: true, message: 'Tu contraseña ha sido actualizada exitosamente.' };
}
