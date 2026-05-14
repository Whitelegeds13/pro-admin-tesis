import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Supplier from '@/models/Supplier';

// GET - Obtener todos los proveedores
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive') !== 'false';

    const filters: { isActive?: boolean; name?: { $regex: string; $options: string }; $or?: { name?: { $regex: string; $options: string }; email?: { $regex: string; $options: string }; documentNumber?: { $regex: string; $options: string } }[] } = {};
    
    if (isActive !== null) {
      filters.isActive = isActive;
    }
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { documentNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(filters)
      .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      suppliers: suppliers.map(supplier => supplier.toSafeObject())
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener los proveedores',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST - Crear nuevo proveedor
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, documentType, documentNumber, phone, email, address, city, district, contactPerson, website, logo, isActive } = body;

    // Validar campos requeridos
    if (!name || !documentType || !documentNumber || !phone || !email || !address || !city || !district) {
      return NextResponse.json({
        success: false,
        message: 'Todos los campos requeridos deben ser proporcionados'
      }, { status: 400 });
    }

    // Verificar si el proveedor ya existe
    const existingSupplier = await Supplier.findOne({
      $or: [
        { documentNumber },
        { email: email.toLowerCase() }
      ]
    });
    
    if (existingSupplier) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe un proveedor con ese documento o email'
      }, { status: 400 });
    }

    // Crear nuevo proveedor
    const newSupplier = new Supplier({
      name,
      documentType,
      documentNumber,
      phone,
      email: email.toLowerCase(),
      address,
      city,
      district,
      contactPerson,
      website,
      logo,
      isActive: isActive !== undefined ? isActive : true
    });

    await newSupplier.save();

    return NextResponse.json({
      success: true,
      message: 'Proveedor creado exitosamente',
      supplier: newSupplier.toSafeObject()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear el proveedor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}