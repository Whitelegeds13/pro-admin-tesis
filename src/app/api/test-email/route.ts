import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, verifyEmailConnection } from '@/lib/email';
import { welcomeEmailTemplate } from '@/lib/email-templates';

// GET - Probar conexión SMTP
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email');

    // Verificar variables de entorno
    const envCheck = {
      SMTP_HOST: process.env.SMTP_HOST || 'NO CONFIGURADO',
      SMTP_PORT: process.env.SMTP_PORT || 'NO CONFIGURADO',
      SMTP_USER: process.env.SMTP_USER ? '✅ Configurado' : '❌ NO CONFIGURADO',
      SMTP_PASS: process.env.SMTP_PASS ? '✅ Configurado' : '❌ NO CONFIGURADO',
      SMTP_FROM: process.env.SMTP_FROM || 'NO CONFIGURADO',
      SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'NO CONFIGURADO',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ Configurado' : '❌ NO CONFIGURADO',
      RESEND_FROM: process.env.RESEND_FROM || 'NO CONFIGURADO',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NO CONFIGURADO'
    };

    // Si se proporciona un email, enviar email de prueba
    if (testEmail) {
      console.log(`📧 Enviando email de prueba a: ${testEmail}`);
      const emailResult = await sendEmail({
        to: testEmail,
        subject: 'Email de Prueba - Palacio Gamer',
        html: welcomeEmailTemplate('Usuario de Prueba')
      });

      return NextResponse.json({
        success: emailResult.success,
        message: emailResult.success 
          ? `Email de prueba enviado exitosamente a ${testEmail}` 
          : `Error al enviar email: ${emailResult.error}`,
        envCheck,
        emailResult
      });
    }

    // Verificar conexión SMTP
    console.log('🔍 Verificando conexión SMTP...');
    const verifyResult = await verifyEmailConnection();

    if (!verifyResult.ok) {
      return NextResponse.json({
        success: false,
        message: 'No se pudo conectar al servidor SMTP',
        envCheck,
        error: verifyResult.error || 'Verifica tus credenciales SMTP en .env.local'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Conexión SMTP verificada correctamente',
      envCheck,
      hint: 'Agrega ?email=tu-email@ejemplo.com para enviar un email de prueba'
    });

  } catch (error) {
    console.error('Error en test-email:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al probar el sistema de email',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

