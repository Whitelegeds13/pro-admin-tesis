/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Department from '@/models/Department';

// GET - Obtener departamento específico
export async function GET(_request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;
    
    const department = await Department.findById(id);
    
    if (!department) {
      return NextResponse.json({
        success: false,
        message: 'Departamento no encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      department: department.toSafeObject()
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener el departamento'
    }, { status: 500 });
  }
}

// PUT - Actualizar departamento
export async function PUT(request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;

    const body = await request.json();
    const { name, description, manager, budget, location, isActive } = body;

    // Buscar el departamento
  const department = await Department.findById(id);
    if (!department) {
      return NextResponse.json({
        success: false,
        message: 'Departamento no encontrado'
      }, { status: 404 });
    }

    // Verificar si el nuevo nombre ya existe (si se está cambiando)
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({ name });
      if (existingDepartment) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe un departamento con ese nombre'
        }, { status: 400 });
      }
    }

    // Actualizar campos
    if (name) department.name = name;
    if (description) department.description = description;
    if (manager !== undefined) department.manager = manager;
    if (budget !== undefined) department.budget = budget;
    if (location) department.location = location;
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();

    return NextResponse.json({
      success: true,
      message: 'Departamento actualizado exitosamente',
      department: department.toSafeObject()
    });

  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar el departamento'
    }, { status: 500 });
  }
}

// DELETE - Eliminar departamento (soft delete)
export async function DELETE(_request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;

    const department = await Department.findById(id);
    if (!department) {
      return NextResponse.json({
        success: false,
        message: 'Departamento no encontrado'
      }, { status: 404 });
    }

    // Soft delete - marcar como inactivo
    department.isActive = false;
    await department.save();

    return NextResponse.json({
      success: true,
      message: 'Departamento eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar el departamento'
    }, { status: 500 });
  }
}