/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Sale from '@/models/Sale';

// POST - Completar venta
export async function POST(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { employeeId } = body || {};
    const sale = await Sale.findById(id);
    if (!sale) {
      return NextResponse.json({
        success: false,
        message: 'Venta no encontrada'
      }, { status: 404 });
    }

    // Verificar que la venta esté en un estado que permita completarla
    if (!['SOLICITADO', 'PENDIENTE', 'CONFIRMADO', 'PAGADO'].includes(sale.status)) {
      return NextResponse.json({
        success: false,
        message: 'Estado inválido para completar venta'
      }, { status: 400 });
    }

    // Si ya está pagada, retornar éxito idempotente
    if (sale.status === 'PAGADO') {
      const alreadyProcessed = !!sale.processedAt;
      if (!alreadyProcessed) {
        await Sale.findByIdAndUpdate(
          id,
          {
            processedAt: new Date(),
            ...(employeeId ? { processedBy: employeeId } : {})
          },
          { new: true }
        );
      }
      return NextResponse.json({
        success: true,
        message: alreadyProcessed ? 'La venta ya estaba pagada y procesada' : 'La venta ya estaba pagada; marcada como procesada'
      }, { status: 200 });
    }

    // Marcar venta como completada (PAGADO)
    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      { 
        status: 'PAGADO',
        processedAt: new Date(),
        ...(employeeId ? { processedBy: employeeId } : {}),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('client', 'name documentNumber email')
     .populate('employee', 'name employeeId email');

    return NextResponse.json({
      success: true,
      message: 'Venta completada exitosamente',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sale: updatedSale ? (updatedSale as any).toSafeObject() : null
    });
  } catch (error) {
    console.error('Error completing sale:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al completar la venta',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
