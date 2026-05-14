/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Sale from '@/models/Sale';
import SaleItem from '@/models/SaleItem';
import Product from '@/models/Product';

// GET - Obtener venta por ID con items
export async function GET(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const sale = await Sale.findById(id)
      .populate('client', 'name documentNumber email phone address')
      .populate('employee', 'name employeeId email');

    if (!sale) {
      return NextResponse.json({
        success: false,
        message: 'Venta no encontrada'
      }, { status: 404 });
    }

    // Obtener items de la venta
    const saleItems = await SaleItem.find({ sale: id })
      .populate('product', 'name code price brand category')
      .populate('product.brand', 'name')
      .populate('product.category', 'name');

    return NextResponse.json({
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sale: (sale as any).toSafeObject(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: saleItems.map(item => (item as any).toSafeObject())
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener la venta',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar venta
export async function PUT(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const body = await request.json();
    const {
      status,
      paymentMethod,
      dueDate,
      notes
    } = body;

    const sale = await Sale.findById(id);
    if (!sale) {
      return NextResponse.json({
        success: false,
        message: 'Venta no encontrada'
      }, { status: 404 });
    }

    // Solo permitir ciertos cambios según el estado
    if (sale.status === 'PAGADO' && status !== 'PAGADO') {
      return NextResponse.json({
        success: false,
        message: 'No se puede modificar una venta pagada'
      }, { status: 400 });
    }

    // Actualizar venta
    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      {
        status: status || sale.status,
        paymentMethod: paymentMethod || sale.paymentMethod,
        dueDate: dueDate || sale.dueDate,
        notes: notes || sale.notes
      },
      { new: true }
    ).populate('client', 'name documentNumber email')
     .populate('employee', 'name employeeId email');

    return NextResponse.json({
      success: true,
      message: 'Venta actualizada exitosamente',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sale: updatedSale ? (updatedSale as any).toSafeObject() : null
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar la venta',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Cancelar venta (soft delete)
export async function DELETE(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const sale = await Sale.findById(id);
    if (!sale) {
      return NextResponse.json({
        success: false,
        message: 'Venta no encontrada'
      }, { status: 404 });
    }

    // Solo permitir cancelar ventas que no estén pagadas
    if (sale.status === 'PAGADO') {
      return NextResponse.json({
        success: false,
        message: 'No se puede cancelar una venta pagada'
      }, { status: 400 });
    }

    // Obtener items de la venta para restaurar stock
    const saleItems = await SaleItem.find({ sale: id });
    
    // Restaurar stock de productos
    for (const item of saleItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    // Marcar venta como cancelada
    await Sale.findByIdAndUpdate(id, { 
      status: 'CANCELADO'
    });

    return NextResponse.json({
      success: true,
      message: 'Venta cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error cancelling sale:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al cancelar la venta',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
