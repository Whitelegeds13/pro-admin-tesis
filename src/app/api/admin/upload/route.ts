import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'product', 'brand', 'category', 'supplier'
    
    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({
        success: false,
        message: 'Tipo de imagen no especificado'
      }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: 'Tipo de archivo no permitido. Solo se permiten: JPG, PNG, WEBP'
      }, { status: 400 });
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 5MB'
      }, { status: 400 });
    }

    // Crear directorio si no existe
    const uploadDir = join(process.cwd(), 'public', 'uploads', type);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Guardar archivo
    await writeFile(filePath, buffer);

    // URL pública del archivo
    const fileUrl = `/uploads/${type}/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: {
        fileName,
        fileUrl,
        fileSize: file.size,
        fileType: file.type
      }
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al subir la imagen',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// GET - Obtener información de imágenes existentes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (!type) {
      return NextResponse.json({
        success: false,
        message: 'Tipo de imagen no especificado'
      }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', type);
    
    if (!existsSync(uploadDir)) {
      return NextResponse.json({
        success: true,
        images: []
      });
    }

    const { readdir } = await import('fs/promises');
    const files = await readdir(uploadDir);
    
    const images = files
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .map(file => ({
        fileName: file,
        fileUrl: `/uploads/${type}/${file}`,
        uploadDate: new Date().toISOString()
      }));

    return NextResponse.json({
      success: true,
      images
    });

  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener las imágenes',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
