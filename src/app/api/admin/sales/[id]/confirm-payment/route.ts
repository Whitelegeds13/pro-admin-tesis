/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Sale from '@/models/Sale';
import SaleItem from '@/models/SaleItem';
import Product from '@/models/Product';
import Client from '@/models/Client';
import { sendEmail } from '@/lib/email';
import { orderStatusUpdateTemplate } from '@/lib/email-templates';
import QRCode from 'qrcode';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// PUT - Confirmar pago de una venta
export async function PUT(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const saleId = id;
    const body = await request.json();
    const { action, employeeId } = body; // 'confirm' o 'reject', y el ID del empleado que confirma

    // Buscar la venta
    const sale = await Sale.findById(saleId).populate('items');
    
    if (!sale) {
      return NextResponse.json({
        success: false,
        message: 'Venta no encontrada'
      }, { status: 404 });
    }

    // Validar que la venta esté en estado que permita confirmación
    if (!['SOLICITADO', 'PENDIENTE'].includes(sale.status)) {
      return NextResponse.json({
        success: false,
        message: `No se puede confirmar una venta con estado ${sale.status}`
      }, { status: 400 });
    }

    if (action === 'confirm') {
      // Validar que se proporcione el ID del empleado
      if (!employeeId) {
        return NextResponse.json({
          success: false,
          message: 'ID del empleado es requerido para confirmar el pago'
        }, { status: 400 });
      }

      // Cambiar estado a CONFIRMADO y guardar quién confirmó
      sale.status = 'CONFIRMADO';
      sale.confirmedBy = employeeId;
      sale.confirmedAt = new Date();
      await sale.save();

      // Actualizar stock de productos
      const saleItemsStock = await SaleItem.find({ sale: saleId });
      
      for (const item of saleItemsStock) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } }
        );
      }

      // Cambiar a PAGADO después de actualizar stock
      sale.status = 'PAGADO';
      await sale.save();

      // Obtener datos del cliente y items para el email
      const populatedSale = await Sale.findById(saleId)
        .populate('client', 'name email')
        .populate('items');
      
      const saleItemsPopulated = await SaleItem.find({ sale: saleId })
        .populate('product', 'name');

      // Enviar email de actualización de estado (no bloquea la respuesta si falla)
      if (populatedSale && (populatedSale as any).client?.email) {
        try {
          const client = (populatedSale as any).client;
          const emailItems = saleItemsPopulated.map((item: any) => ({
            productName: item.product?.name || 'Producto',
            quantity: item.quantity,
            price: item.unitPrice,
            subtotal: item.subtotal
          }));

          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const receiptLink = `${baseUrl}/comprobante/${sale._id}?clientId=${sale.client.toString()}`;
          const qrDataUrl = await QRCode.toDataURL(receiptLink);

          const emailHtml = orderStatusUpdateTemplate({
            orderNumber: sale.saleNumber,
            clientName: client.name,
            clientEmail: client.email,
            orderDate: sale.issueDate.toLocaleDateString('es-PE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            items: emailItems,
            subtotal: sale.subtotal,
            igv: sale.igv,
            total: sale.total,
            paymentMethod: sale.paymentMethod,
            status: 'PAGADO',
            receiptNumber: sale.receiptNumber,
            receiptType: sale.receiptType,
            receiptLink,
            qrCodeDataUrl: qrDataUrl
          });

          const pdfBytes = await generateReceiptPdf({
            storeName: 'Palacio Gamer',
            saleNumber: sale.saleNumber,
            receiptType: sale.receiptType,
            series: sale.series,
            receiptNumber: sale.receiptNumber,
            issueDate: sale.issueDate,
            paymentMethod: sale.paymentMethod,
            client: { name: client.name, documentNumber: (await Client.findById(sale.client))?.documentNumber, email: client.email },
            totals: { subtotal: sale.subtotal, igv: sale.igv, total: sale.total },
            items: emailItems.map(it => ({
              name: it.productName,
              quantity: it.quantity,
              unitPrice: it.price,
              subtotal: it.subtotal
            }))
          });

          await sendEmail({
            to: client.email,
            subject: `¡Tu pedido #${sale.saleNumber} ha sido confirmado! - Palacio Gamer`,
            html: emailHtml,
            attachments: [{ filename: `comprobante-${sale.series ? sale.series + '-' : ''}${sale.receiptNumber}.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' }]
          });
        } catch (emailError) {
          // No fallar la operación si el email falla, solo loguear
          console.error('Error enviando email de confirmación de pago:', emailError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Pago confirmado exitosamente. Stock actualizado.',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sale: (sale as any).toSafeObject()
      }, { status: 200 });

    } else if (action === 'reject') {
      // Rechazar el pago
      sale.status = 'CANCELADO';
      await sale.save();

      // Obtener datos del cliente para el email
      const populatedSale = await Sale.findById(saleId)
        .populate('client', 'name email');
      
      const saleItems = await SaleItem.find({ sale: saleId })
        .populate('product', 'name');

      // Enviar email de cancelación (no bloquea la respuesta si falla)
      if (populatedSale && (populatedSale as any).client?.email) {
        try {
          const client = (populatedSale as any).client;
          const emailItems = saleItems.map((item: any) => ({
            productName: item.product?.name || 'Producto',
            quantity: item.quantity,
            price: item.unitPrice,
            subtotal: item.subtotal
          }));

          const emailHtml = orderStatusUpdateTemplate({
            orderNumber: sale.saleNumber,
            clientName: client.name,
            clientEmail: client.email,
            orderDate: sale.issueDate.toLocaleDateString('es-PE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            items: emailItems,
            subtotal: sale.subtotal,
            igv: sale.igv,
            total: sale.total,
            paymentMethod: sale.paymentMethod,
            status: 'CANCELADO',
            receiptNumber: sale.receiptNumber,
            receiptType: sale.receiptType
          });

          await sendEmail({
            to: client.email,
            subject: `Pedido #${sale.saleNumber} cancelado - Palacio Gamer`,
            html: emailHtml
          });
        } catch (emailError) {
          // No fallar la operación si el email falla, solo loguear
          console.error('Error enviando email de cancelación:', emailError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Pago rechazado',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sale: (sale as any).toSafeObject()
      }, { status: 200 });

    } else {
      return NextResponse.json({
        success: false,
        message: 'Acción inválida. Use "confirm" o "reject"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al confirmar el pago',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
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
  client: { name: string; documentNumber?: string; email?: string } | null;
  totals: { subtotal: number; igv: number; total: number };
  items: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number }>;
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
  draw(`Nombre: ${data.client?.name || ''}`, 50, y);
  y -= 14;
  if (data.client?.documentNumber) { draw(`Documento: ${data.client.documentNumber}`, 50, y); y -= 14; }
  if (data.client?.email) { draw(`Email: ${data.client.email}`, 50, y); y -= 14; }

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
    const name = it.name;
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
