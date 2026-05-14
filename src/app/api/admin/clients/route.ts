import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';

// GET - Obtener todos los clientes
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const documentType = searchParams.get('documentType') || '';
    const isActive = searchParams.get('isActive') !== 'false';

    // Construir filtros
    const filters: { isActive?: boolean; name?: { $regex: string; $options: string }; documentType?: string; $or?: { name?: { $regex: string; $options: string }; documentNumber?: { $regex: string; $options: string }; email?: { $regex: string; $options: string }; phone?: { $regex: string; $options: string } }[] } = {};
    
    if (isActive !== null) {
      filters.isActive = isActive;
    }
    
    if (documentType) {
      filters.documentType = documentType;
    }
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { documentNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Obtener clientes
    const clients = await Client.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Contar total para paginación
    const total = await Client.countDocuments(filters);

    return NextResponse.json({
      success: true,
      clients: clients.map(client => client.toSafeObject()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener los clientes',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      name,
      documentType,
      documentNumber,
      phone,
      email,
      address,
      city,
      district
    } = body;

    // Validar campos requeridos
    if (!name || !documentType || !documentNumber || !phone || !email) {
      return NextResponse.json({
        success: false,
        message: 'Todos los campos requeridos deben ser proporcionados'
      }, { status: 400 });
    }

    // Verificar si el cliente ya existe
    const existingClient = await Client.findOne({
      $or: [
        { documentNumber },
        { email: email.toLowerCase() }
      ]
    });
    
    if (existingClient) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe un cliente con ese documento o email'
      }, { status: 400 });
    }

    // Crear nuevo cliente con password temporal
    // Si no se proporciona password, se genera uno temporal (el cliente deberá cambiarlo)
    const tempPassword = body.password || `Temp${documentNumber.slice(-4)}${Math.random().toString(36).slice(-4)}`;
    
    const newClient = new Client({
      name,
      documentType,
      documentNumber,
      phone,
      email: email.toLowerCase(),
      password: tempPassword, // Se hasheará automáticamente en el pre-save hook
      address,
      city,
      district
    });

    await newClient.save();

    return NextResponse.json({
      success: true,
      message: 'Cliente creado exitosamente',
      client: newClient.toSafeObject()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear el cliente',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
