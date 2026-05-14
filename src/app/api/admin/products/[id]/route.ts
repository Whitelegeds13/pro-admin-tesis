/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Brand from '@/models/Brand';
import Category from '@/models/Category';

// GET - Obtener producto por ID
export async function GET(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const product = await Product.findById(id)
      .populate('brand', 'name logo website')
      .populate('category', 'name description image');

    if (!product) {
      return NextResponse.json({
        success: false,
        message: 'Producto no encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: product.toSafeObject()
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener el producto',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar producto
export async function PUT(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const body = await request.json();
    const {
      name,
      description,
      brand,
      category,
      price,
      costPrice,
      stock,
      minStock,
      maxStock,
      images,
      specifications,
      tags,
      isActive,
      isDigital,
      weight,
      dimensions,
      sku,
      barcode
    } = body;

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({
        success: false,
        message: 'Producto no encontrado'
      }, { status: 404 });
    }

    // Verificar que la marca existe si se está cambiando
    if (brand && brand !== product.brand.toString()) {
      const brandExists = await Brand.findById(brand);
      if (!brandExists) {
        return NextResponse.json({
          success: false,
          message: 'La marca especificada no existe'
        }, { status: 400 });
      }
    }

    // Verificar que la categoría existe si se está cambiando
    if (category && category !== product.category.toString()) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return NextResponse.json({
          success: false,
          message: 'La categoría especificada no existe'
        }, { status: 400 });
      }
    }

    // Preparar datos de actualización, excluyendo campos vacíos para evitar conflictos de índices únicos
    const updateData: Record<string, unknown> = {
      name,
      description,
      brand: brand || product.brand,
      category: category || product.category,
      price,
      costPrice,
      stock,
      minStock,
      maxStock,
      images,
      specifications,
      tags,
      isActive,
      isDigital,
      weight,
      dimensions
    };

    // Solo incluir sku y barcode si no están vacíos
    if (sku && sku.trim() !== '') {
      updateData.sku = sku;
    } else {
      updateData.$unset = { sku: 1 };
    }

    if (barcode && barcode.trim() !== '') {
      updateData.barcode = barcode;
    } else {
      updateData.$unset = { ...(updateData.$unset || {}), barcode: 1 };
    }

    // Actualizar producto
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('brand', 'name logo').populate('category', 'name description image');

    return NextResponse.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      product: updatedProduct?.toSafeObject()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar el producto',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Eliminar producto (soft delete)
export async function DELETE(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({
        success: false,
        message: 'Producto no encontrado'
      }, { status: 404 });
    }

    // Soft delete - marcar como inactivo
    await Product.findByIdAndUpdate(id, { isActive: false });

    // Actualizar contadores en marca y categoría
    await Brand.findByIdAndUpdate(product.brand, { $inc: { productCount: -1 } });
    await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar el producto',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
