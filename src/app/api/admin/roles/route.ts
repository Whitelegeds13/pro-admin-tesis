import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Role from '@/models/Role';

// GET - Obtener todos los roles
export async function GET() {
  try {
    await connectDB();
    
    const roles = await Role.find({ isActive: true }).sort({ name: 1 });
    
    return NextResponse.json({
      success: true,
      roles: roles.map(role => role.toSafeObject())
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener los roles'
    }, { status: 500 });
  }
}

// POST - Crear nuevo rol
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, description, permissions } = body;

    // Validar campos requeridos
    if (!name || !description) {
      return NextResponse.json({
        success: false,
        message: 'Nombre y descripción son requeridos'
      }, { status: 400 });
    }

    // Verificar si el rol ya existe
    const existingRole = await Role.findOne({ name: name.toLowerCase() });
    if (existingRole) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe un rol con ese nombre'
      }, { status: 400 });
    }

    // Crear nuevo rol
    const newRole = new Role({
      name: name.toLowerCase(),
      description,
      permissions: permissions || []
    });

    await newRole.save();

    return NextResponse.json({
      success: true,
      message: 'Rol creado exitosamente',
      role: newRole.toSafeObject()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear el rol'
    }, { status: 500 });
  }
}