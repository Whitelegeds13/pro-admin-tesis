/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Sale from '@/models/Sale';
import SaleItem from '@/models/SaleItem';
import { sendEmail } from '@/lib/email';
import QRCode from 'qrcode';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function POST(request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || request.headers.get('x-client-id');
    if (!clientId) {
      return NextResponse.json({ success: false, message: 'ID de cliente requerido' }, { status: 400 });
    }

    const saleAuth = await Sale.findById(id).select('client');
    if (!saleAuth) {
      return NextResponse.json({ success: false, message: 'Venta no encontrada' }, { status: 404 });
    }
    if (saleAuth.client.toString() !== clientId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 403 });
    }

    const sale = await Sale.findById(id)
      .populate('client', 'name documentNumber email')
      .populate('employee', 'name employeeId email');
    if (!sale) {
      return NextResponse.json({ success: false, message: 'Venta no encontrada' }, { status: 404 });
    }

    const items = await SaleItem.find({ sale: id })
      .populate('product', 'name code price');

    const pdfBytes = await generateReceiptPdf({
      storeName: 'Palacio Gamer',
      saleNumber: sale.saleNumber,
      receiptType: sale.receiptType,
      series: sale.series,
      receiptNumber: sale.receiptNumber,
      issueDate: sale.issueDate,
      paymentMethod: sale.paymentMethod,
      client: (sale as any).client,
      totals: { subtotal: sale.subtotal, igv: sale.igv, total: sale.total },
      items: items.map((it: any) => ({
        name: it.product?.name || 'Producto',
        code: it.product?.code || '',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal
      }))
    });

    const clientEmail = (sale as any).client?.email;
    if (!clientEmail) {
      return NextResponse.json({ success: false, message: 'El cliente no tiene email registrado' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const receiptLink = `${baseUrl}/comprobante/${sale._id}?clientId=${clientId}`;
    const qrDataUrl = await QRCode.toDataURL(receiptLink);

    const filename = `comprobante-${sale.series ? sale.series + '-' : ''}${sale.receiptNumber}.pdf`;
    const sendResult = await sendEmail({
      to: clientEmail,
      subject: 'Tu comprobante de pago',
      html: `<div style="font-family: Arial, sans-serif;">
               <p>Hola ${(sale as any).client?.name || 'cliente'},</p>
               <p>Adjuntamos tu comprobante de pago.</p>
               <p><strong>Número de pedido:</strong> ${sale.saleNumber}</p>
               <p><strong>Comprobante:</strong> ${sale.receiptType} ${sale.series ? sale.series + '-' : ''}${sale.receiptNumber}</p>
               <p style="text-align:center; margin-top:16px;"><a href="${receiptLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Ver Comprobante</a></p>
               <div style="text-align:center; margin-top:12px;">
                 <p style="color:#6b7280; font-size:14px;">Escanea el QR para ver tu comprobante</p>
                 <img src="${qrDataUrl}" alt="QR Comprobante" style="width:160px;height:160px;border:1px solid #e5e7eb;border-radius:8px;" />
               </div>
             </div>`,
      attachments: [{ filename, content: Buffer.from(pdfBytes), contentType: 'application/pdf' }]
    });

    if (!sendResult.success) {
      return NextResponse.json({ success: false, message: sendResult.error || 'No se pudo enviar el email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Comprobante enviado al correo' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al enviar comprobante' }, { status: 500 });
  }
}

async function generateReceiptPdf(data: {
  storeName: string;
  saleNumber: string;
  receiptType: string;
  series?: string;
  receiptNumber: string;
  issueDate: Date;
  paymentMethod: string;
  client: { name: string; documentNumber?: string; email?: string };
  totals: { subtotal: number; igv: number; total: number };
  items: Array<{ name: string; code?: string; quantity: number; unitPrice: number; subtotal: number }>;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const draw = (text: string, x: number, y: number, size = 12, useBold = false) => {
    page.drawText(text, { x, y, size, font: useBold ? boldFont : font, color: rgb(0, 0, 0) });
  };

  let y = height - 50;
  draw(data.storeName, 50, y, 18, true);
  y -= 22;
  draw('Comprobante de pago', 50, y, 14);

  y -= 30;
  draw('Cliente', 50, y, 12, true);
  y -= 16;
  draw(`Nombre: ${data.client.name}`, 50, y);
  y -= 14;
  if (data.client.documentNumber) { draw(`Documento: ${data.client.documentNumber}`, 50, y); y -= 14; }
  if (data.client.email) { draw(`Email: ${data.client.email}`, 50, y); y -= 14; }

  y = height - 102;
  draw('Comprobante', width / 2 + 10, y, 12, true);
  y -= 16;
  draw(`Pedido: ${data.saleNumber}`, width / 2 + 10, y);
  y -= 14;
  draw(`Comprobante: ${data.receiptType} ${data.series ? data.series + '-' : ''}${data.receiptNumber}`, width / 2 + 10, y);
  y -= 14;
  draw(`Fecha: ${new Date(data.issueDate).toLocaleDateString('es-PE')}`, width / 2 + 10, y);
  y -= 14;
  draw(`Pago: ${data.paymentMethod}`, width / 2 + 10, y);

  y -= 30;
  draw('Productos', 50, y, 12, true);
  y -= 18;
  draw('Producto', 50, y);
  draw('Cant.', width / 2, y);
  draw('Precio', width / 2 + 80, y);
  draw('Subtotal', width - 110, y);
  y -= 14;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
  y -= 10;

  for (const it of data.items) {
    if (y < 120) {
      // Nueva página si no hay espacio
      y = 70;
      draw('Continuación...', 50, y);
      const newPage = doc.addPage([595.28, 841.89]);
      page.drawText(''); // mantener referencia
    }
    const name = it.name + (it.code ? ` (${it.code})` : '');
    draw(name, 50, y);
    draw(String(it.quantity), width / 2, y);
    draw(`S/ ${it.unitPrice.toFixed(2)}`, width / 2 + 80, y);
    draw(`S/ ${it.subtotal.toFixed(2)}`, width - 110, y);
    y -= 16;
  }

  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
  y -= 20;

  draw('Totales', 50, y, 12, true);
  y -= 16;
  draw(`Subtotal: S/ ${data.totals.subtotal.toFixed(2)}`, 50, y);
  y -= 14;
  draw(`IGV (18%): S/ ${data.totals.igv.toFixed(2)}`, 50, y);
  y -= 14;
  draw(`Total: S/ ${data.totals.total.toFixed(2)}`, 50, y, 12, true);

  return await doc.save();
}
