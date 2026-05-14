import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Obtener el ID del cliente desde los headers (será enviado desde el frontend)
    const clientId = request.headers.get('x-client-id');

    if (!clientId) {
      return NextResponse.json({
        success: false,
        message: 'No se proporcionó ID de cliente'
      }, { status: 401 });
    }

    // Buscar cliente
    const client = await Client.findById(clientId);

    if (!client) {
      return NextResponse.json({
        success: false,
        message: 'Cliente no encontrado'
      }, { status: 404 });
    }

    // Retornar cliente sin password
    const clientData = client.toSafeObject();

    return NextResponse.json({
      success: true,
      client: clientData
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener información del cliente',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

