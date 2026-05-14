/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Brand from '@/models/Brand';
import Supplier from '@/models/Supplier';

// GET - Obtener marca por ID
export async function GET(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const brand = await Brand.findById(id)
      .populate('supplier', 'name email logo');

    if (!brand) {
      return NextResponse.json({
        success: false,
        message: 'Marca no encontrada'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      brand: brand.toSafeObject()
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener la marca',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar marca
export async function PUT(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const body = await request.json();
    const {
      name,
      description,
      logo,
      website,
      supplier,
      isActive
    } = body;

    const brand = await Brand.findById(id);
    if (!brand) {
      return NextResponse.json({
        success: false,
        message: 'Marca no encontrada'
      }, { status: 404 });
    }

    // Verificar que el proveedor existe si se está cambiando
    if (supplier && supplier !== brand.supplier?.toString()) {
      const supplierExists = await Supplier.findById(supplier);
      if (!supplierExists) {
        return NextResponse.json({
          success: false,
          message: 'El proveedor especificado no existe'
        }, { status: 400 });
      }
    }

    // Verificar si el nombre ya existe en otra marca
    if (name && name !== brand.name) {
      const existingBrand = await Brand.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingBrand) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe una marca con ese nombre'
        }, { status: 400 });
      }
    }

    // Actualizar marca
    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      {
        name: name || brand.name,
        description,
        logo,
        website,
        supplier: supplier || brand.supplier,
        isActive: isActive !== undefined ? isActive : brand.isActive
      },
      { new: true }
    ).populate('supplier', 'name email logo');

    return NextResponse.json({
      success: true,
      message: 'Marca actualizada exitosamente',
      brand: updatedBrand?.toSafeObject()
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar la marca',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Eliminar marca (soft delete)
export async function DELETE(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const brand = await Brand.findById(id);
    if (!brand) {
      return NextResponse.json({
        success: false,
        message: 'Marca no encontrada'
      }, { status: 404 });
    }

    // Verificar si la marca tiene productos asociados
    if (brand.productCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'No se puede eliminar una marca que tiene productos asociados'
      }, { status: 400 });
    }

    // Soft delete - marcar como inactivo
    await Brand.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json({
      success: true,
      message: 'Marca eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar la marca',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}