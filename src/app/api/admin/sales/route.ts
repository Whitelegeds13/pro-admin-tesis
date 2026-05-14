import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Sale from '@/models/Sale';
import SaleItem from '@/models/SaleItem';
import Product from '@/models/Product';
import Client from '@/models/Client';
import Employee from '@/models/Employee';

// GET - Obtener todas las ventas
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const clientId = searchParams.get('clientId') || '';
    const workerId = searchParams.get('workerId') || '';
    const isActiveParam = searchParams.get('isActive');

    // Construir filtros
    const filters: { isActive?: boolean; client?: string; status?: string; dateFrom?: Date; dateTo?: Date; employee?: string; issueDate?: { $gte?: Date; $lte?: Date }; $or?: { receiptNumber?: { $regex: string; $options: string }; series?: { $regex: string; $options: string } }[] } = {};
    
    if (isActiveParam === 'true') {
      filters.isActive = true;
    } else if (isActiveParam === 'false') {
      filters.isActive = false;
    } // si no se especifica, no filtrar por isActive para incluir documentos sin ese campo
    
    if (status) {
      filters.status = status;
    }
    
    if (clientId) {
      filters.client = clientId;
    }
    
    if (workerId) {
      filters.employee = workerId;
    }
    
    if (startDate || endDate) {
      filters.issueDate = {};
      if (startDate) filters.issueDate.$gte = new Date(startDate);
      if (endDate) filters.issueDate.$lte = new Date(endDate);
    }
    
    if (search) {
      filters.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { series: { $regex: search, $options: 'i' } }
      ];
    }

    // Obtener ventas con populate
    const sales = await Sale.find(filters)
      .populate('client', 'name documentNumber email')
      .populate('employee', 'name employeeId email')
      .sort({ issueDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Contar total para paginación
    const total = await Sale.countDocuments(filters);

    // Obtener estadísticas básicas
    const totalSalesCalc = sales.length;
    const totalRevenueCalc = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const avgSaleCalc = totalSalesCalc > 0 ? totalRevenueCalc / totalSalesCalc : 0;

    return NextResponse.json({
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sales: sales.map(sale => (sale as any).toSafeObject()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: { totalSales: totalSalesCalc, totalRevenue: totalRevenueCalc, avgSale: avgSaleCalc }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener las ventas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST - Crear nueva venta
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      client,
      worker,
      receiptType,
      receiptNumber,
      series,
      currency,
      exchangeRate,
      paymentMethod,
      issueDate,
      dueDate,
      items,
      // igv,
      total
    } = body;

    // Validar campos requeridos
    if (!client || !worker || !receiptType || !receiptNumber || !series || !paymentMethod || !items || !total) {
      return NextResponse.json({
        success: false,
        message: 'Todos los campos requeridos deben ser proporcionados'
      }, { status: 400 });
    }

    // Verificar que el cliente existe
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return NextResponse.json({
        success: false,
        message: 'El cliente especificado no existe'
      }, { status: 400 });
    }

    // Verificar que el empleado existe
    const workerExists = await Employee.findById(worker);
    if (!workerExists) {
      return NextResponse.json({
        success: false,
        message: 'El empleado especificado no existe'
      }, { status: 400 });
    }

    // Verificar que el número de comprobante no existe
    const existingSale = await Sale.findOne({ receiptNumber });
    if (existingSale) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe una venta con ese número de comprobante'
      }, { status: 400 });
    }

    // Verificar stock de productos y calcular totales
    let calculatedTotal = 0;
    let calculatedIgv = 0;
    
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return NextResponse.json({
          success: false,
          message: `El producto ${item.product} no existe`
        }, { status: 400 });
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({
          success: false,
          message: `Stock insuficiente para el producto ${product.name}. Disponible: ${product.stock}`
        }, { status: 400 });
      }

      const subtotal = item.quantity * item.priceAtSale;
      calculatedTotal += subtotal;
    }

    calculatedIgv = calculatedTotal * 0.18; // 18% IGV
    const finalTotal = calculatedTotal + calculatedIgv;

    // Crear nueva venta
    const newSale = new Sale({
      client,
      employee: worker,
      receiptType,
      receiptNumber,
      series,
      currency: currency || 'PEN',
      exchangeRate: exchangeRate || 1,
      paymentMethod,
      issueDate: issueDate || new Date(),
      dueDate,
      status: 'PENDIENTE',
      igv: calculatedIgv,
      total: finalTotal
    });

    await newSale.save();

    // Crear items de venta y actualizar stock
    const saleItems = [];
    for (const item of items) {
      const saleItem = new SaleItem({
        sale: newSale._id,
        product: item.product,
        quantity: item.quantity,
        priceAtSale: item.priceAtSale,
        subtotal: item.quantity * item.priceAtSale
      });

      await saleItem.save();
      saleItems.push(saleItem);

      // Actualizar stock del producto
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Obtener la venta con las referencias pobladas
    const populatedSale = await Sale.findById(newSale._id)
      .populate('client', 'name documentNumber email')
      .populate('employee', 'name employeeId email');

    return NextResponse.json({
      success: true,
      message: 'Venta creada exitosamente',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sale: populatedSale ? (populatedSale as any).toSafeObject() : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: saleItems.map(item => (item as any).toSafeObject())
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear la venta',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
