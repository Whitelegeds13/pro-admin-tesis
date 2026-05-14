/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';

// GET - Obtener un cliente por ID
export async function GET(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const client = await Client.findById(id);
    
    if (!client) {
      return NextResponse.json({
        success: false,
        message: 'Cliente no encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      client: client.toSafeObject()
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener el cliente',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar un cliente
export async function PUT(request: NextRequest, context: any) {
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
      district,
      isActive
    } = body;

    // Verificar que el cliente existe
    const { id } = await context.params;
    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json({
        success: false,
        message: 'Cliente no encontrado'
      }, { status: 404 });
    }

    // Verificar si el documento o email ya existe en otro cliente
    if (documentNumber || email) {
      const existingClient = await Client.findOne({
        _id: { $ne: id },
        $or: [
          ...(documentNumber ? [{ documentNumber }] : []),
          ...(email ? [{ email: email.toLowerCase() }] : [])
        ]
      });
      
      if (existingClient) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe otro cliente con ese documento o email'
        }, { status: 400 });
      }
    }

    // Actualizar campos
    if (name) client.name = name;
    if (documentType) client.documentType = documentType;
    if (documentNumber) client.documentNumber = documentNumber;
    if (phone) client.phone = phone;
    if (email) client.email = email.toLowerCase();
    if (address !== undefined) client.address = address;
    if (city !== undefined) client.city = city;
    if (district !== undefined) client.district = district;
    if (isActive !== undefined) client.isActive = isActive;

    await client.save();

    return NextResponse.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      client: client.toSafeObject()
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar el cliente',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Eliminar/Desactivar un cliente
export async function DELETE(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const client = await Client.findById(id);
    
    if (!client) {
      return NextResponse.json({
        success: false,
        message: 'Cliente no encontrado'
      }, { status: 404 });
    }

    // En lugar de eliminar, desactivamos el cliente
    client.isActive = false;
    await client.save();

    return NextResponse.json({
      success: true,
      message: 'Cliente desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al desactivar el cliente',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

