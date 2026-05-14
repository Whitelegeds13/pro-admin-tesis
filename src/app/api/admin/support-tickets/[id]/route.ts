/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import Client from '@/models/Client';
import { sendEmail } from '@/lib/email';
import { supportTicketUpdatedTemplate } from '@/lib/email-templates';

export async function GET(_request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al obtener ticket' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;
    const body = await request.json();
    const { status, subject, description, priority } = body;
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket no encontrado' }, { status: 404 });
    }
    if (status) ticket.status = status;
    if (subject) ticket.subject = subject;
    if (description) ticket.description = description;
    if (priority) ticket.priority = priority;
    await ticket.save();

    const client = await Client.findById(ticket.client);
    if (client) {
      try {
        await sendEmail({ to: client.email, subject: `Ticket ${ticket.code} actualizado`, html: supportTicketUpdatedTemplate(client.name, ticket.code, ticket.status) });
      } catch {}
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al actualizar ticket' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket no encontrado' }, { status: 404 });
    }
    ticket.isActive = false;
    await ticket.save();
    return NextResponse.json({ success: true, message: 'Ticket eliminado' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al eliminar ticket' }, { status: 500 });
  }
}
