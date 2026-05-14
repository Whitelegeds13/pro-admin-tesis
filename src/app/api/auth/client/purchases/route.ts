import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Sale from '@/models/Sale';
import SaleItem from '@/models/SaleItem';

// GET - Obtener compras del cliente autenticado
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Obtener clientId del header o query params
    const clientId = request.headers.get('x-client-id') || 
                     new URL(request.url).searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({
        success: false,
        message: 'ID de cliente requerido'
      }, { status: 400 });
    }

    // Obtener todas las ventas del cliente (excluyendo canceladas)
    const sales = await Sale.find({
      client: clientId,
      status: { $ne: 'CANCELADO' }
    })
      .sort({ createdAt: -1 })
      .limit(100);

    // Obtener los items de cada venta
    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const saleObj = (sale as any).toSafeObject();
          const items = await SaleItem.find({ sale: sale._id })
            .populate('product', 'name code images price');
          
          return {
            ...saleObj,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            items: items.map((item: any) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const product = item.product as any;
              return {
                product: product && typeof product === 'object' ? {
                  name: product.name || 'Producto eliminado',
                  code: product.code || '',
                  images: product.images || [],
                  price: product.price || 0
                } : { name: 'Producto eliminado', images: [], code: '', price: 0 },
                quantity: item.quantity || 0,
                unitPrice: item.unitPrice || 0,
                subtotal: item.subtotal || 0
              };
            })
          };
        } catch (error) {
          console.error(`Error processing sale ${sale._id}:`, error);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const saleObj = (sale as any).toSafeObject();
          return {
            ...saleObj,
            items: []
          };
        }
      })
    );

    // Formatear las ventas para el cliente
    const formattedSales = salesWithItems.map(sale => {
      // Convertir fechas a strings ISO si son objetos Date
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatDate = (date: any) => {
        if (!date) return new Date().toISOString();
        if (date instanceof Date) return date.toISOString();
        if (typeof date === 'string') return date;
        return new Date(date).toISOString();
      };

      return {
        _id: sale._id?.toString() || '',
        saleNumber: sale.saleNumber || '',
        receiptNumber: sale.receiptNumber || '',
        receiptType: sale.receiptType || 'BOLETA',
        series: sale.series || '',
        total: sale.total || 0,
        subtotal: sale.subtotal || 0,
        igv: sale.igv || 0,
        status: sale.status || 'PAGADO',
        issueDate: formatDate(sale.issueDate),
        paymentMethod: sale.paymentMethod || 'EFECTIVO',
        paymentProofImage: sale.paymentProofImage || undefined,
        notes: sale.notes || undefined,
        items: sale.items || [],
        createdAt: formatDate(sale.createdAt)
      };
    });

    return NextResponse.json({
      success: true,
      sales: formattedSales,
      total: formattedSales.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching client purchases:', error);
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: 'Error desconocido' };
    
    console.error('Error details:', JSON.stringify(errorDetails, null, 2));
    
    return NextResponse.json({
      success: false,
      message: 'Error al obtener las compras',
      error: error instanceof Error ? error.message : 'Error desconocido',
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 });
  }
}

