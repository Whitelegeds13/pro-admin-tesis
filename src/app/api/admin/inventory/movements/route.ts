import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import StockMovement from '@/models/StockMovement';
import Product from '@/models/Product';
import Employee from '@/models/Employee';

// GET - Obtener movimientos de stock
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const productId = searchParams.get('productId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const employeeId = searchParams.get('employeeId') || '';
    const isActive = searchParams.get('isActive') !== 'false';

    // Construir filtros
    const filters: { product?: string; type?: string; dateFrom?: Date; dateTo?: Date; isActive?: boolean; employee?: string; createdAt?: { $gte?: Date; $lte?: Date }; $or?: { reason?: { $regex: string; $options: string }; notes?: { $regex: string; $options: string } }[] } = {};
    
    if (isActive !== null) {
      filters.isActive = isActive;
    }
    
    if (type) {
      filters.type = type;
    }
    
    if (productId) {
      filters.product = productId;
    }
    
    if (employeeId) {
      filters.employee = employeeId;
    }
    
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      filters.$or = [
        { reason: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Obtener movimientos sin populate
    const movements = await StockMovement.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Contar total para paginación
    const total = await StockMovement.countDocuments(filters);

    // Obtener products y employees por separado
    const productIds = [...new Set(movements.map(m => m.product.toString()))];
    const employeeIds = [...new Set(movements.map(m => m.employee.toString()))];

    const products = await Product.find({ _id: { $in: productIds } });
    const employees = await Employee.find({ _id: { $in: employeeIds } });

    // Crear mapas para búsqueda rápida
    const productMap = new Map(products.map(product => [product._id.toString(), product]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeeMap = new Map(employees.map((employee: any) => [employee._id.toString(), employee]));

    // Combinar datos manualmente
    const movementsWithDetails = movements.map(movement => {
      const safeMovement = movement.toSafeObject();
      const product = productMap.get(safeMovement.product?.toString() || '');
      const employee = employeeMap.get(safeMovement.employee?.toString() || '');

      return {
        ...safeMovement,
        product: product ? {
          _id: product._id,
          name: product.name,
          code: product.code,
          price: product.price,
          stock: product.stock
        } : null,
        employee: employee ? {
          _id: employee._id,
          name: employee.name,
          employeeId: employee.employeeId,
          email: employee.email
        } : null
      };
    });

    // Obtener estadísticas de movimientos
    const stats = await StockMovement.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalMovements: { $sum: 1 },
          totalIn: {
            $sum: {
              $cond: [{ $gt: ['$quantity', 0] }, '$quantity', 0]
            }
          },
          totalOut: {
            $sum: {
              $cond: [{ $lt: ['$quantity', 0] }, { $abs: '$quantity' }, 0]
            }
          }
        }
      }
    ]);

    // Obtener movimientos por tipo
    const movementsByType = await StockMovement.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return NextResponse.json({
      success: true,
      movements: movementsWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || {
        totalMovements: 0,
        totalIn: 0,
        totalOut: 0
      },
      movementsByType
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener los movimientos de stock',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST - Crear movimiento de stock
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      product,
      type,
      quantity,
      reason,
      reference,
      referenceType,
      employee,
      notes
    } = body;

    // Validar campos requeridos
    if (!product || !type || !quantity || !reason || !employee) {
      return NextResponse.json({
        success: false,
        message: 'Todos los campos requeridos deben ser proporcionados'
      }, { status: 400 });
    }

    // Verificar que el producto existe
    const productExists = await Product.findById(product);
    if (!productExists) {
      return NextResponse.json({
        success: false,
        message: 'El producto especificado no existe'
      }, { status: 400 });
    }

    // Verificar que el empleado existe
    const employeeExists = await Employee.findById(employee);
    if (!employeeExists) {
      return NextResponse.json({
        success: false,
        message: 'El empleado especificado no existe'
      }, { status: 400 });
    }

    // Verificar que no se vaya a quedar con stock negativo
    const newStock = productExists.stock + quantity;
    if (newStock < 0) {
      return NextResponse.json({
        success: false,
        message: `No se puede realizar el movimiento. Stock actual: ${productExists.stock}, Cantidad: ${quantity}`
      }, { status: 400 });
    }

    // Crear movimiento de stock
    const newMovement = new StockMovement({
      product,
      type,
      quantity,
      previousStock: productExists.stock,
      newStock,
      reason,
      reference,
      referenceType,
      employee,
      notes
    });

    await newMovement.save();

    // Actualizar stock del producto
    await Product.findByIdAndUpdate(product, {
      stock: newStock
    });

    // Obtener el movimiento sin populate
    const savedMovement = await StockMovement.findById(newMovement._id);

    // Obtener producto y empleado por separado
    const productData = await Product.findById(product);
    const employeeData = await Employee.findById(employee);

    // Combinar datos manualmente
    const safeMovement = savedMovement?.toSafeObject();
    const movementWithDetails = {
      ...safeMovement,
      product: productData ? {
        _id: productData._id,
        name: productData.name,
        code: productData.code,
        price: productData.price,
        stock: productData.stock
      } : null,
      employee: employeeData ? {
        _id: employeeData._id,
        name: employeeData.name,
        employeeId: employeeData.employeeId,
        email: employeeData.email
      } : null
    };

    return NextResponse.json({
      success: true,
      message: 'Movimiento de stock creado exitosamente',
      movement: movementWithDetails
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating stock movement:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear el movimiento de stock',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
