/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { connectDB } from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import SupportChatMessage from '@/models/SupportChatMessage';

// GET - Listar mensajes del chat de un ticket (admin)
export async function GET(request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;
    const ticket = await SupportTicket.findById(id).select('_id');
    if (!ticket) return NextResponse.json({ success: false, message: 'Ticket no encontrado' }, { status: 404 });
    const messages = await SupportChatMessage.find({ ticket: id }).sort({ createdAt: 1 });
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al obtener mensajes' }, { status: 500 });
  }
}

// POST - Enviar mensaje del admin
export async function POST(request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;
    const contentType = request.headers.get('content-type') || '';
    let textMessage: string | undefined;
    let imageUrls: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      textMessage = (form.get('message') as string) || undefined;
      const filesRaw = form.getAll('images');
      const single = form.get('image');
      const files: File[] = [
        ...(filesRaw.filter(f => f instanceof File) as File[]),
        ...(single && single instanceof File ? [single] : [])
      ].slice(0, 10);
      if (files.length > 0) {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'support-chat', id.toString());
        fs.mkdirSync(uploadsDir, { recursive: true });
        for (const file of files) {
          if (!file || file.size <= 0) continue;
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const filePath = path.join(uploadsDir, safeName);
          fs.writeFileSync(filePath, buffer);
          imageUrls.push(`/uploads/support-chat/${id}/${safeName}`);
        }
      }
    } else {
      const body = await request.json();
      textMessage = body?.message;
    }

    if ((!textMessage || !textMessage.trim()) && imageUrls.length === 0) {
      return NextResponse.json({ success: false, message: 'Mensaje o imagen requerido' }, { status: 400 });
    }

    const ticket = await SupportTicket.findById(id).select('_id');
    if (!ticket) return NextResponse.json({ success: false, message: 'Ticket no encontrado' }, { status: 404 });

    const msg = await SupportChatMessage.create({
      ticket: id,
      senderType: 'admin',
      sender: null,
      message: textMessage?.trim(),
      imageUrls,
      imageUrl: imageUrls.length === 1 ? imageUrls[0] : undefined
    });
    return NextResponse.json({ success: true, message: msg });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al enviar mensaje' }, { status: 500 });
  }
}
