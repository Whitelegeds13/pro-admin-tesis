import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { passwordResetTemplate } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email requerido' }, { status: 400 });
    }

    const client = await Client.findOne({ email: email.toLowerCase(), isActive: true });
    if (!client) {
      return NextResponse.json({ success: true, message: 'Si el email existe, se enviará un enlace' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    client.resetPasswordToken = tokenHash;
    client.resetPasswordExpires = expires as unknown as Date;
    await client.save();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(client.email)}`;

    try {
      await sendEmail({
        to: client.email,
        subject: 'Restablecer contraseña - Palacio Gamer',
        html: passwordResetTemplate(client.name, resetLink)
      });
    } catch {}

    return NextResponse.json({ success: true, message: 'Se envió el enlace si el email existe' });

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al solicitar reset' }, { status: 500 });
  }
}
