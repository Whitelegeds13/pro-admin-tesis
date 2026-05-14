/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Supplier from '@/models/Supplier';

// GET - Obtener proveedor por ID
export async function GET(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return NextResponse.json({
        success: false,
        message: 'Proveedor no encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      supplier: supplier.toSafeObject()
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener el proveedor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar proveedor
export async function PUT(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const body = await request.json();
    const {
      name,
      documentType,
      documentNumber,
      phone,
      email,
      address,
      city,
      district,
      contactPerson,
      website,
      logo,
      isActive
    } = body;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return NextResponse.json({
        success: false,
        message: 'Proveedor no encontrado'
      }, { status: 404 });
    }

    // Verificar si el número de documento ya existe en otro proveedor
    if (documentNumber && documentNumber !== supplier.documentNumber) {
      const existingSupplier = await Supplier.findOne({ 
        documentNumber,
        _id: { $ne: id }
      });
      
      if (existingSupplier) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe un proveedor con ese número de documento'
        }, { status: 400 });
      }
    }

    // Verificar si el email ya existe en otro proveedor
    if (email && email !== supplier.email) {
      const existingSupplier = await Supplier.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      
      if (existingSupplier) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe un proveedor con ese email'
        }, { status: 400 });
      }
    }

    // Actualizar proveedor
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      {
        name: name || supplier.name,
        documentType: documentType || supplier.documentType,
        documentNumber: documentNumber || supplier.documentNumber,
        phone: phone || supplier.phone,
        email: email ? email.toLowerCase() : supplier.email,
        address: address || supplier.address,
        city: city || supplier.city,
        district: district || supplier.district,
        contactPerson,
        website,
        logo,
        isActive: isActive !== undefined ? isActive : supplier.isActive
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      supplier: updatedSupplier?.toSafeObject()
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar el proveedor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Eliminar proveedor (soft delete)
export async function DELETE(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return NextResponse.json({
        success: false,
        message: 'Proveedor no encontrado'
      }, { status: 404 });
    }

    // Verificar si el proveedor tiene compras asociadas
    if (supplier.totalPurchases > 0) {
      return NextResponse.json({
        success: false,
        message: 'No se puede eliminar un proveedor que tiene compras asociadas'
      }, { status: 400 });
    }

    // Soft delete - marcar como inactivo
    await Supplier.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar el proveedor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}