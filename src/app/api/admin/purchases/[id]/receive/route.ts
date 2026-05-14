/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Purchase from '@/models/Purchase';
import PurchaseItem from '@/models/PurchaseItem';
import Product from '@/models/Product';
import Supplier from '@/models/Supplier';
import Employee from '@/models/Employee';

// POST - Recibir compra
export async function POST(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const body = await request.json();
    const { actualDeliveryDate, notes } = body;

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return NextResponse.json({
        success: false,
        message: 'Compra no encontrada'
      }, { status: 404 });
    }

    // Verificar que la compra esté ordenada
    if (purchase.status !== 'ordered') {
      return NextResponse.json({
        success: false,
        message: 'Solo se pueden recibir compras que estén ordenadas'
      }, { status: 400 });
    }

    // Obtener items de la compra
    const purchaseItems = await PurchaseItem.find({ purchase: id });
    
    // Actualizar stock de productos
    for (const item of purchaseItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    // Marcar compra como recibida
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      id,
      { 
        status: 'received',
        actualDeliveryDate: actualDeliveryDate || new Date(),
        notes: notes || purchase.notes
      },
      { new: true }
    );

    // Obtener supplier y employee por separado
    const supplierData = await Supplier.findById(purchase.supplier);
    const employeeData = await Employee.findById(purchase.employee);

    // Combinar datos manualmente
    const safePurchase = updatedPurchase?.toSafeObject();
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
      message: 'Compra recibida exitosamente',
      purchase: purchaseWithDetails
    });
  } catch (error) {
    console.error('Error receiving purchase:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al recibir la compra',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
