import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import Client from '@/models/Client';
import { sendEmail } from '@/lib/email';
import { supportTicketCreatedTemplate } from '@/lib/email-templates';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const clientId = request.headers.get('x-client-id') || new URL(request.url).searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ success: false, message: 'ID de cliente requerido' }, { status: 400 });
    }
    const tickets = await SupportTicket.find({ client: clientId, isActive: true }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al obtener tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { clientId, subject, description, priority } = body;
    if (!clientId || !subject || !description) {
      return NextResponse.json({ success: false, message: 'Datos incompletos' }, { status: 400 });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return NextResponse.json({ success: false, message: 'Cliente no encontrado' }, { status: 404 });
    }

    const code = `TCK-${Date.now()}`;
    const ticket = new SupportTicket({ code, client: clientId, subject, description, priority: priority || 'MEDIUM' });
    await ticket.save();

    try {
      await sendEmail({ to: client.email, subject: `Ticket ${code} creado`, html: supportTicketCreatedTemplate(client.name, code, subject) });
    } catch {}

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al crear ticket' }, { status: 500 });
  }
}
