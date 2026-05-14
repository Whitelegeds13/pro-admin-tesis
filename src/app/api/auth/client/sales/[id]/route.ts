/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Sale from '@/models/Sale';
import SaleItem from '@/models/SaleItem';

export async function GET(request: NextRequest, context: any) {
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

    const saleItems = await SaleItem.find({ sale: id })
      .populate('product', 'name code price images brand category')
      .populate('product.brand', 'name')
      .populate('product.category', 'name');

    return NextResponse.json({
      success: true,
      sale: (sale as any).toSafeObject(),
      items: saleItems.map(item => (item as any).toSafeObject())
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al obtener la venta' }, { status: 500 });
  }
}
