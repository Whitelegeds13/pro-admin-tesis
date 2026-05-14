import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';

// GET - Obtener todas las categorías
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive') !== 'false';

    const filters: { isActive?: boolean; name?: { $regex: string; $options: string }; $or?: { name?: { $regex: string; $options: string }; description?: { $regex: string; $options: string } }[] } = {};
    
    if (isActive !== null) {
      filters.isActive = isActive;
    }
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const categories = await Category.find(filters)
      .populate('parentCategory', 'name')
      .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      categories: categories.map(category => category.toSafeObject())
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener las categorías',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST - Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, description, parentCategory } = body;

    // Validar campos requeridos
    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      }, { status: 400 });
    }

    // Verificar si la categoría ya existe
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingCategory) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      }, { status: 400 });
    }

    // Si se especifica una categoría padre, verificar que existe
    if (parentCategory) {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return NextResponse.json({
          success: false,
          message: 'La categoría padre especificada no existe'
        }, { status: 400 });
      }
    }

    // Crear nueva categoría
    const newCategory = new Category({
      name,
      description,
      parentCategory: parentCategory || null
    });

    await newCategory.save();

    // Obtener la categoría con la información de la categoría padre
    const populatedCategory = await Category.findById(newCategory._id)
      .populate('parentCategory', 'name');

    return NextResponse.json({
      success: true,
      message: 'Categoría creada exitosamente',
      category: populatedCategory?.toSafeObject()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear la categoría',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}