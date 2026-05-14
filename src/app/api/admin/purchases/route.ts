import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Purchase from '@/models/Purchase';
import PurchaseItem from '@/models/PurchaseItem';
import Product from '@/models/Product';
import Supplier from '@/models/Supplier';
import Employee from '@/models/Employee';

// GET - Obtener todas las compras
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
    const supplierId = searchParams.get('supplierId') || '';
    const isActive = searchParams.get('isActive') !== 'false';

    // Construir filtros
    const filters: { isActive?: boolean; supplier?: string; status?: string; dateFrom?: Date; dateTo?: Date; orderDate?: { $gte?: Date; $lte?: Date }; $or?: { orderNumber?: { $regex: string; $options: string }; invoiceNumber?: { $regex: string; $options: string } }[] } = {};
    
    if (isActive !== null) {
      filters.isActive = isActive;
    }
    
    if (status) {
      filters.status = status;
    }
    
    if (supplierId) {
      filters.supplier = supplierId;
    }
    
    if (startDate || endDate) {
      filters.orderDate = {};
      if (startDate) filters.orderDate.$gte = new Date(startDate);
      if (endDate) filters.orderDate.$lte = new Date(endDate);
    }
    
    if (search) {
      filters.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Obtener compras sin populate
    const purchases = await Purchase.find(filters)
      .sort({ orderDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Contar total para paginación
    const total = await Purchase.countDocuments(filters);

    // Obtener suppliers y employees por separado
    const supplierIds = [...new Set(purchases.map(p => p.supplier.toString()))];
    const employeeIds = [...new Set(purchases.map(p => p.employee.toString()))];

    const suppliers = await Supplier.find({ _id: { $in: supplierIds } });
    const employees = await Employee.find({ _id: { $in: employeeIds } });

    // Crear mapas para búsqueda rápida
    const supplierMap = new Map(suppliers.map(supplier => [supplier._id.toString(), supplier]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeeMap = new Map(employees.map((employee: any) => [employee._id.toString(), employee]));

    // Combinar datos manualmente
    const purchasesWithDetails = purchases.map(purchase => {
      const safePurchase = purchase.toSafeObject();
      const supplier = supplierMap.get(safePurchase.supplier?.toString() || '');
      const employee = employeeMap.get(safePurchase.employee?.toString() || '');

      return {
        ...safePurchase,
        supplier: supplier ? {
          _id: supplier._id,
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone
        } : null,
        employee: employee ? {
          _id: employee._id,
          name: employee.name,
          employeeId: employee.employeeId,
          email: employee.email
        } : null
      };
    });

    // Obtener estadísticas básicas
    const stats = await Purchase.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          avgPurchase: { $avg: '$total' }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      purchases: purchasesWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || { totalPurchases: 0, totalAmount: 0, avgPurchase: 0 }
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener las compras',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST - Crear nueva compra
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      supplier,
      employee,
      orderNumber,
      invoiceNumber,
      invoiceDate,
      orderDate,
      expectedDeliveryDate,
      originalListVoucher,
      items,
      notes,
      total
    } = body;

    // Validar campos requeridos
    if (!supplier || !employee || !orderNumber || !items || !total) {
      return NextResponse.json({
        success: false,
        message: 'Todos los campos requeridos deben ser proporcionados'
      }, { status: 400 });
    }

    // Verificar que el proveedor existe
    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return NextResponse.json({
        success: false,
        message: 'El proveedor especificado no existe'
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

    // Verificar que el número de orden no existe
    const existingPurchase = await Purchase.findOne({ orderNumber });
    if (existingPurchase) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe una compra con ese número de orden'
      }, { status: 400 });
    }

    // Verificar que los productos existen
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return NextResponse.json({
          success: false,
          message: `El producto ${item.product} no existe`
        }, { status: 400 });
      }
    }

    // Crear nueva compra
    const newPurchase = new Purchase({
      supplier,
      employee,
      orderNumber,
      invoiceNumber,
      invoiceDate: invoiceDate || new Date(),
      orderDate: orderDate || new Date(),
      expectedDeliveryDate,
      originalListVoucher,
      status: 'pending',
      notes,
      total
    });

    await newPurchase.save();

    // Crear items de compra
    const purchaseItems = [];
    for (const item of items) {
      const purchaseItem = new PurchaseItem({
        purchase: newPurchase._id,
        product: item.product,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: item.quantity * item.unitCost
      });

      await purchaseItem.save();
      purchaseItems.push(purchaseItem);
    }

    // Obtener la compra sin populate
    const savedPurchase = await Purchase.findById(newPurchase._id);

    // Obtener supplier y employee por separado
    const supplierData = await Supplier.findById(supplier);
    const employeeData = await Employee.findById(employee);

    // Combinar datos manualmente
    const safePurchase = savedPurchase?.toSafeObject();
    const purchaseWithDetails = {
      ...safePurchase,
      supplier: supplierData ? {
        _id: supplierData._id,
        name: supplierData.name,
        email: supplierData.email,
        phone: supplierData.phone
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
      message: 'Compra creada exitosamente',
      purchase: purchaseWithDetails,
      items: purchaseItems.map(item => item.toSafeObject())
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear la compra',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
