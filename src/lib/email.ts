// Importación compatible con Next.js 15 y Turbopack
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as nodemailerModule from 'nodemailer';

// Configuración del transporter de email
const createTransporter = async () => {
  // El método correcto es createTransport
  // Manejar diferentes formas de importación (CommonJS, ESM, Turbopack)
  const nodemailer = (nodemailerModule as any).default || nodemailerModule;
  const createTransportFn = nodemailer.createTransport;

  if (!createTransportFn || typeof createTransportFn !== 'function') {
    console.error('❌ Nodemailer debug:', {
      hasNodemailer: !!nodemailer,
      hasDefault: !!(nodemailerModule as any).default,
      hasCreateTransport: !!nodemailer?.createTransport,
      type: typeof nodemailer?.createTransport,
      keys: Object.keys(nodemailer || {})
    });
    throw new Error('No se pudo encontrar el método createTransport de nodemailer');
  }

  // En desarrollo, usar Ethereal Email (email de prueba) si no hay configuración
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    let user = process.env.ETHEREAL_USER;
    let pass = process.env.ETHEREAL_PASS;

    if (!user || !pass) {
      const testAccount = await nodemailer.createTestAccount();
      user = testAccount.user;
      pass = testAccount.pass;
    }

    return createTransportFn({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user,
        pass,
      }
    });
  }

  // Configuración para producción con SMTP
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s/g, '') : undefined;

  return createTransportFn({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false // Solo para desarrollo, en producción debería ser true
    }
  });
};

const createEtherealTransporter = async () => {
  const nodemailer = (nodemailerModule as any).default || nodemailerModule;
  const createTransportFn = nodemailer.createTransport;

  let user = process.env.ETHEREAL_USER;
  let pass = process.env.ETHEREAL_PASS;

  if (!user || !pass) {
    const testAccount = await nodemailer.createTestAccount();
    user = testAccount.user;
    pass = testAccount.pass;
  }

  return createTransportFn({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user,
      pass,
    }
  });
};

const sendWithResend = async (input: {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}) => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false as const, error: 'RESEND_API_KEY no configurado' };
  }

  const to = Array.isArray(input.to)
    ? input.to
    : input.to.split(',').map((t) => t.trim()).filter(Boolean);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: input.from,
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === 'string'
        ? body
        : (body?.message as string) || (body?.error as string) || 'Error enviando email con Resend';
    return { ok: false as const, error: message };
  }

  const messageId = typeof body === 'string' ? undefined : (body?.id as string | undefined);
  return { ok: true as const, messageId };
};

// Interfaz para datos de email
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
}

// Función para enviar email
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string; previewUrl?: string }> {
  try {
    // Verificar que las variables de entorno estén configuradas
    const isDevEthereal = process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s/g, '') : undefined;
    if (!isDevEthereal && (!smtpUser || !smtpPass)) {
      const errorMsg = 'Variables de entorno SMTP no configuradas. Verifica SMTP_USER y SMTP_PASS en .env.local';
      console.error('❌ EMAIL ERROR:', errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }

    const fromEmail =
      (options.from || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@palaciogamer.com').trim();
    const fromName = process.env.SMTP_FROM_NAME || 'Palacio Gamer';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      attachments: options.attachments
    };

    if (options.attachments?.length) {
      console.error('❌ EMAIL ERROR: attachments no soportados en esta configuración de envío');
      return {
        success: false,
        error: 'Adjuntos no soportados en el envío de email actual.',
      };
    }

    if (process.env.RESEND_API_KEY) {
      const resendResult = await sendWithResend({
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text,
      });

      if (resendResult.ok) {
        console.log('✅ Email enviado con Resend. MessageId:', resendResult.messageId);
        return { success: true, messageId: resendResult.messageId };
      }

      console.error('❌ ERROR ENVIANDO EMAIL (Resend):', resendResult.error);
      return { success: false, error: resendResult.error };
    }

    const transporter = await createTransporter();

    let info: any;
    try {
      console.log('📧 Verificando conexión SMTP...');
      await transporter.verify();
      console.log('✅ Conexión SMTP verificada correctamente');

      console.log(`📧 Enviando email a: ${mailOptions.to}`);
      console.log(`📧 Desde: ${mailOptions.from}`);
      console.log(`📧 Asunto: ${mailOptions.subject}`);

      info = await transporter.sendMail(mailOptions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar email';
      console.error('❌ ERROR ENVIANDO EMAIL:', errorMessage);

      if (process.env.NODE_ENV === 'development') {
        try {
          const etherealTransporter = await createEtherealTransporter();
          await etherealTransporter.verify();
          info = await etherealTransporter.sendMail({
            ...mailOptions,
            from: `"${fromName}" <${fromEmail}>`,
          });

          const nodemailer = (nodemailerModule as any).default || nodemailerModule;
          const previewUrl =
            typeof nodemailer?.getTestMessageUrl === 'function' ? nodemailer.getTestMessageUrl(info) : null;
          if (previewUrl) {
            console.log('🔗 Preview:', previewUrl);
            return {
              success: true,
              messageId: info.messageId,
              previewUrl,
            };
          }

          return {
            success: true,
            messageId: info.messageId,
          };
        } catch (etherealError) {
          const etherealMessage =
            etherealError instanceof Error ? etherealError.message : 'Error desconocido enviando con Ethereal';
          return {
            success: false,
            error: `SMTP falló: ${errorMessage}. Ethereal falló: ${etherealMessage}`,
          };
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
    
    console.log('✅ Email enviado exitosamente. MessageId:', info.messageId);

    if (isDevEthereal) {
      const nodemailer = (nodemailerModule as any).default || nodemailerModule;
      const previewUrl =
        typeof nodemailer?.getTestMessageUrl === 'function' ? nodemailer.getTestMessageUrl(info) : null;
      if (previewUrl) {
        console.log('🔗 Preview:', previewUrl);
      }
    }
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar email';
    console.error('❌ ERROR ENVIANDO EMAIL:', errorMessage);
    if (error instanceof Error) {
      console.error('❌ Stack trace:', error.stack);
    }
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Verificar conexión del transporter (útil para testing)
export async function verifyEmailConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (process.env.RESEND_API_KEY) {
      return { ok: true };
    }
    const transporter = await createTransporter();
    await transporter.verify();
    return { ok: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido verificando conexión SMTP';
    console.error('Error verifying email connection:', error);
    console.error('SMTP verify error:', errorMessage);
    return { ok: false, error: errorMessage };
  }
}
