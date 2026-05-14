import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Department from '@/models/Department';

// GET - Obtener todos los departamentos
export async function GET() {
  try {
    await connectDB();
    
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    
    return NextResponse.json({
      success: true,
      departments: departments.map(dept => dept.toSafeObject())
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener los departamentos'
    }, { status: 500 });
  }
}

// POST - Crear nuevo departamento
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, description, manager, budget, location } = body;

    // Validar campos requeridos
    if (!name || !description || !location) {
      return NextResponse.json({
        success: false,
        message: 'Nombre, descripción y ubicación son requeridos'
      }, { status: 400 });
    }

    // Verificar si el departamento ya existe
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe un departamento con ese nombre'
      }, { status: 400 });
    }

    // Crear nuevo departamento
    const newDepartment = new Department({
      name,
      description,
      manager: manager || undefined,
      budget: budget || undefined,
      location
    });

    await newDepartment.save();

    return NextResponse.json({
      success: true,
      message: 'Departamento creado exitosamente',
      department: newDepartment.toSafeObject()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear el departamento'
    }, { status: 500 });
  }
}