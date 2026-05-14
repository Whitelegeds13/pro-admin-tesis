import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import Client from '@/models/Client';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query: { isActive: boolean; status?: string } = { isActive: true };
    if (status) query.status = status;
    const tickets = await SupportTicket.find(query).sort({ createdAt: -1 }).limit(200);
    const clients = await Client.find({ _id: { $in: tickets.map(t => t.client) } }).select('name email');
    const clientMap = new Map(clients.map(c => [c._id.toString(), { _id: c._id.toString(), name: c.name, email: c.email }]));
    const result = tickets.map(t => ({
      _id: t._id,
      code: t.code,
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
      client: clientMap.get(t.client.toString()) || null
    }));
    return NextResponse.json({ success: true, tickets: result });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al listar tickets' }, { status: 500 });
  }
}
