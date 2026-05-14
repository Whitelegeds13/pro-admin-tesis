/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';

export async function PUT(request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;
    const body = await request.json();
    const { clientId, subject, description, priority } = body;
    const ticket = await SupportTicket.findById(id);
    if (!ticket || ticket.client.toString() !== clientId) {
      return NextResponse.json({ success: false, message: 'No autorizado o ticket no encontrado' }, { status: 403 });
    }
    if (subject) ticket.subject = subject;
    if (description) ticket.description = description;
    if (priority) ticket.priority = priority;
    await ticket.save();
    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al actualizar ticket' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const ticket = await SupportTicket.findById(id);
    if (!ticket || !clientId || ticket.client.toString() !== clientId) {
      return NextResponse.json({ success: false, message: 'No autorizado o ticket no encontrado' }, { status: 403 });
    }
    ticket.isActive = false;
    await ticket.save();
    return NextResponse.json({ success: true, message: 'Ticket eliminado' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al eliminar ticket' }, { status: 500 });
  }
}
