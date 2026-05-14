import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import { sendEmail } from '@/lib/email';
import { profileUpdateTemplate } from '@/lib/email-templates';

// GET - Obtener perfil del cliente
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const clientId = request.headers.get('x-client-id');

    if (!clientId) {
      return NextResponse.json({
        success: false,
        message: 'No se proporcionó ID de cliente'
      }, { status: 401 });
    }

    const client = await Client.findById(clientId);

    if (!client) {
      return NextResponse.json({
        success: false,
        message: 'Cliente no encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      client: client.toSafeObject()
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching client profile:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener el perfil',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar perfil del cliente
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const clientId = request.headers.get('x-client-id');

    if (!clientId) {
      return NextResponse.json({
        success: false,
        message: 'No se proporcionó ID de cliente'
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      address,
      city,
      district,
      password
    } = body;

    // Buscar cliente
    const client = await Client.findById(clientId);

    if (!client) {
      return NextResponse.json({
        success: false,
        message: 'Cliente no encontrado'
      }, { status: 404 });
    }

    // Guardar valores anteriores para detectar cambios
    const oldValues = {
      name: client.name,
      phone: client.phone,
      address: client.address,
      city: client.city,
      district: client.district
    };

    // Actualizar campos permitidos
    const updatedFields: string[] = [];
    if (name && name !== oldValues.name) {
      client.name = name;
      updatedFields.push('Nombre');
    }
    if (phone && phone !== oldValues.phone) {
      client.phone = phone;
      updatedFields.push('Teléfono');
    }
    if (address !== undefined && address !== oldValues.address) {
      client.address = address;
      updatedFields.push('Dirección');
    }
    if (city && city !== oldValues.city) {
      client.city = city;
      updatedFields.push('Ciudad');
    }
    if (district && district !== oldValues.district) {
      client.district = district;
      updatedFields.push('Distrito');
    }
    if (password) {
      // Si se proporciona una nueva contraseña, se hasheará automáticamente
      client.password = password;
      updatedFields.push('Contraseña');
    }

    await client.save();

    // Enviar email de confirmación si hubo cambios (no bloquea la respuesta si falla)
    if (updatedFields.length > 0 && client.email) {
      try {
        const emailHtml = profileUpdateTemplate(client.name, updatedFields);
        await sendEmail({
          to: client.email,
          subject: 'Confirmación de Actualización de Perfil - Palacio Gamer',
          html: emailHtml
        });
      } catch (emailError) {
        // No fallar la operación si el email falla, solo loguear
        console.error('Error enviando email de actualización de perfil:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      client: client.toSafeObject()
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating client profile:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar el perfil',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

