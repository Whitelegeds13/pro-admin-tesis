import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Brand from '@/models/Brand';

// GET - Obtener todas las marcas
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

    // Obtener marcas sin populate para evitar errores de schema
    const brands = await Brand.find(filters)
      .sort({ name: 1 });

    // Procesar marcas sin populate de supplier por ahora
    const brandsData = brands.map(brand => {
      const brandObj = brand.toSafeObject();
      // Mantener solo el ID del supplier sin populate
      if (brand.supplier) {
        brandObj.supplier = brand.supplier.toString();
      }
      return brandObj;
    });

    return NextResponse.json({
      success: true,
      brands: brandsData
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener las marcas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST - Crear nueva marca
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, description, logo, website, supplier } = body;

    // Validar campos requeridos
    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'El nombre de la marca es requerido'
      }, { status: 400 });
    }

    // Verificar si la marca ya existe
    const existingBrand = await Brand.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingBrand) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe una marca con ese nombre'
      }, { status: 400 });
    }

    // Crear nueva marca
    const newBrand = new Brand({
      name,
      description,
      logo,
      website,
      supplier
    });

    await newBrand.save();

    return NextResponse.json({
      success: true,
      message: 'Marca creada exitosamente',
      brand: newBrand.toSafeObject()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear la marca',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
