import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import Sale from '@/models/Sale';
import SaleItem from '@/models/SaleItem';
import Product from '@/models/Product';
import Client from '@/models/Client';
import Employee from '@/models/Employee';

// GET - Obtener pedidos del ecommerce (ventas con estado SOLICITADO o PENDIENTE)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Asegurar que los modelos estén registrados en Mongoose
    // Esto es necesario en Next.js debido al hot reload
    if (!mongoose.models.Employee) {
      // Si el modelo no está registrado, forzar su importación
      await import('@/models/Employee');
    }
    if (!mongoose.models.Client) {
      await import('@/models/Client');
    }
    if (!mongoose.models.Product) {
      await import('@/models/Product');
    }
    if (!mongoose.models.SaleItem) {
      await import('@/models/SaleItem');
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Construir query - Incluir PAGADO para ver pedidos confirmados
    interface QueryFilter {
      status: string | { $in: string[] };
      $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
    }
    
    const query: QueryFilter = {
      status: { $in: ['SOLICITADO', 'PENDIENTE', 'CONFIRMADO', 'PAGADO'] }
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const extraFilter: Record<string, unknown> = {};
    if ((status || 'all') === 'PAGADO') {
      // En Ventas Online mostrar solo pagados no procesados
      extraFilter.processedAt = { $exists: false };
    }

    if (search) {
      query.$or = [
        { saleNumber: { $regex: search, $options: 'i' } },
        { receiptNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Obtener ventas con información del cliente y empleado
    const sales = await Sale.find({ ...query, ...extraFilter })
      .populate('client', 'name documentNumber email phone')
      .populate('employee', 'name employeeId email')
      .populate('confirmedBy', 'name employeeId email')
      .populate({
        path: 'items',
        populate: {
          path: 'product',
          select: 'name code price'
        }
      })
      .sort({ createdAt: -1 })
      .limit(100);

    // Calcular estadísticas
    const stats = {
      total: await Sale.countDocuments({ status: { $in: ['SOLICITADO', 'PENDIENTE', 'CONFIRMADO', 'PAGADO'] } }),
      solicitados: await Sale.countDocuments({ status: 'SOLICITADO' }),
      pendientes: await Sale.countDocuments({ status: 'PENDIENTE' }),
      confirmados: await Sale.countDocuments({ status: 'CONFIRMADO' }),
      pagados: await Sale.countDocuments({ status: 'PAGADO' })
    };

    return NextResponse.json({
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orders: sales.map(sale => (sale as any).toSafeObject()),
      stats
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener los pedidos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
