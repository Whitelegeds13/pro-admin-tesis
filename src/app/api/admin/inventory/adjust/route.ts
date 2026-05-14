import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import StockMovement from '@/models/StockMovement';
import Employee from '@/models/Employee';

// POST - Ajustar stock de producto
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      product,
      newStock,
      reason,
      employee,
      notes
    } = body;

    // Validar campos requeridos
    if (!product || newStock === undefined || !reason || !employee) {
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

    // Verificar que el nuevo stock no sea negativo
    if (newStock < 0) {
      return NextResponse.json({
        success: false,
        message: 'El stock no puede ser negativo'
      }, { status: 400 });
    }

    const previousStock = productExists.stock;
    const quantity = newStock - previousStock;

    // Crear movimiento de ajuste
    const adjustmentMovement = new StockMovement({
      product,
      type: 'adjustment',
      quantity,
      previousStock,
      newStock,
      reason,
      employee,
      notes
    });

    await adjustmentMovement.save();

    // Actualizar stock del producto
    await Product.findByIdAndUpdate(product, {
      stock: newStock
    });

    // Obtener el movimiento sin populate
    const savedMovement = await StockMovement.findById(adjustmentMovement._id);

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
      message: 'Stock ajustado exitosamente',
      movement: movementWithDetails,
      product: {
        ...productExists.toSafeObject(),
        stock: newStock
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al ajustar el stock',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
