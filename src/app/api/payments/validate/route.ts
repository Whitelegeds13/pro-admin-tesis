import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Client from '@/models/Client';
import { sendEmail } from '@/lib/email';
import { orderStatusUpdateTemplate } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { saleId, transactionId, status } = body;
    if (!saleId || !transactionId || !status) {
      return NextResponse.json({ success: false, message: 'Datos inválidos' }, { status: 400 });
    }

    const sale = await Sale.findById(saleId);
    if (!sale) {
      return NextResponse.json({ success: false, message: 'Venta no encontrada' }, { status: 404 });
    }

    let newStatus: 'CONFIRMADO' | 'PAGADO' | 'CANCELADO' | 'PENDIENTE' = 'PENDIENTE';
    if (status === 'approved' || status === 'paid' || status === 'success') newStatus = 'PAGADO';
    else if (status === 'confirmed') newStatus = 'CONFIRMADO';
    else if (status === 'rejected' || status === 'failed') newStatus = 'CANCELADO';

    sale.status = newStatus;
    await sale.save();

    const client = await Client.findById(sale.client);
    if (client) {
      try {
        const emailHtml = orderStatusUpdateTemplate({
          orderNumber: sale.saleNumber,
          clientName: client.name,
          clientEmail: client.email,
          orderDate: new Date(sale.issueDate).toLocaleDateString(),
          items: [],
          subtotal: sale.subtotal,
          igv: sale.igv,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          status: newStatus
        });
        await sendEmail({ to: client.email, subject: `Estado de tu pedido ${sale.saleNumber}`, html: emailHtml });
      } catch {}
    }

    return NextResponse.json({ success: true, sale });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al validar transacción' }, { status: 500 });
  }
}
