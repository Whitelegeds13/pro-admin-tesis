import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import Client from '@/models/Client';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const clientId = request.headers.get('x-client-id') || new URL(request.url).searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ success: false, message: 'ID de cliente requerido' }, { status: 400 });
    }
    const quotations = await Quotation.find({ client: clientId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, quotations });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al obtener cotizaciones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { clientId, items, currency, notes } = body;
    if (!clientId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Datos inválidos' }, { status: 400 });
    }
    const client = await Client.findById(clientId);
    if (!client) {
      return NextResponse.json({ success: false, message: 'Cliente no encontrado' }, { status: 404 });
    }

    let subtotal = 0;
    const mapped = items.map((it: { product?: string; name: string; price: number; quantity: number }) => {
      const sub = (it.price || 0) * (it.quantity || 1);
      subtotal += sub;
      return { product: it.product, name: it.name, price: it.price, quantity: it.quantity, subtotal: sub };
    });
    const igv = +(subtotal * 0.18).toFixed(2);
    const total = +(subtotal + igv).toFixed(2);
    const code = `QTN-${Date.now()}`;

    const quotation = new Quotation({
      code,
      client: clientId,
      items: mapped,
      currency: currency || 'PEN',
      subtotal,
      igv,
      total,
      status: 'DRAFT',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: notes || ''
    });
    await quotation.save();

    return NextResponse.json({ success: true, quotation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al crear cotización' }, { status: 500 });
  }
}
