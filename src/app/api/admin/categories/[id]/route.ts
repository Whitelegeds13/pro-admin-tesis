/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';

// GET - Obtener categoría por ID
export async function GET(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const category = await Category.findById(id)
      .populate('parentCategory', 'name description image');

    if (!category) {
      return NextResponse.json({
        success: false,
        message: 'Categoría no encontrada'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      category: category.toSafeObject()
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener la categoría',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar categoría
export async function PUT(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const body = await request.json();
    const {
      name,
      description,
      image,
      parentCategory,
      isActive
    } = body;

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({
        success: false,
        message: 'Categoría no encontrada'
      }, { status: 404 });
    }

    // Verificar que la categoría padre existe si se está cambiando
    if (parentCategory && parentCategory !== category.parentCategory?.toString()) {
      if (parentCategory !== '') {
        const parentExists = await Category.findById(parentCategory);
        if (!parentExists) {
          return NextResponse.json({
            success: false,
            message: 'La categoría padre especificada no existe'
          }, { status: 400 });
        }
      }
    }

    // Verificar si el nombre ya existe en otra categoría
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingCategory) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe una categoría con ese nombre'
        }, { status: 400 });
      }
    }

    // Actualizar categoría
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name: name || category.name,
        description: description || category.description,
        image,
        parentCategory: parentCategory || category.parentCategory,
        isActive: isActive !== undefined ? isActive : category.isActive
      },
      { new: true }
    ).populate('parentCategory', 'name description image');

    return NextResponse.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      category: updatedCategory?.toSafeObject()
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar la categoría',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Eliminar categoría (soft delete)
export async function DELETE(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({
        success: false,
        message: 'Categoría no encontrada'
      }, { status: 404 });
    }

    // Verificar si la categoría tiene productos asociados
    if (category.productCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'No se puede eliminar una categoría que tiene productos asociados'
      }, { status: 400 });
    }

    // Verificar si la categoría tiene subcategorías
    const subcategories = await Category.find({ parentCategory: id });
    if (subcategories.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'No se puede eliminar una categoría que tiene subcategorías'
      }, { status: 400 });
    }

    // Soft delete - marcar como inactivo
    await Category.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar la categoría',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}