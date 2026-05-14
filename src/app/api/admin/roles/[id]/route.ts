/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Role from '@/models/Role';

// GET - Obtener rol específico
export async function GET(_request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;

    const role = await Role.findById(id);
    
    if (!role) {
      return NextResponse.json({
        success: false,
        message: 'Rol no encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      role: role.toSafeObject()
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener el rol'
    }, { status: 500 });
  }
}

// PUT - Actualizar rol
export async function PUT(request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;

    const body = await request.json();
    const { name, description, permissions, isActive } = body;

    // Buscar el rol
  const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({
        success: false,
        message: 'Rol no encontrado'
      }, { status: 404 });
    }

    // Verificar si el nuevo nombre ya existe (si se está cambiando)
    if (name && name.toLowerCase() !== role.name) {
      const existingRole = await Role.findOne({ name: name.toLowerCase() });
      if (existingRole) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe un rol con ese nombre'
        }, { status: 400 });
      }
    }

    // Actualizar campos
    if (name) role.name = name.toLowerCase();
    if (description) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;
    if (isActive !== undefined) role.isActive = isActive;

    await role.save();

    return NextResponse.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      role: role.toSafeObject()
    });

  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar el rol'
    }, { status: 500 });
  }
}

// DELETE - Eliminar rol (soft delete)
export async function DELETE(_request: NextRequest, context: any) {
  try {
    await connectDB();
    const { id } = await context.params;

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({
        success: false,
        message: 'Rol no encontrado'
      }, { status: 404 });
    }

    // Soft delete - marcar como inactivo
    role.isActive = false;
    await role.save();

    return NextResponse.json({
      success: true,
      message: 'Rol eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar el rol'
    }, { status: 500 });
  }
}