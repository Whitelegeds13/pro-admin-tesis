/**
 * API Route: /api/admin/quotations/[id]
 * Obtener, actualizar cotización individual.
 */
import { NextRequest } from 'next/server';
import { UpdateQuotationDTO } from '@/core/dtos/quotation.dto';
import { getQuotationById, updateQuotation } from '@/services/quotation.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quotation = await getQuotationById(id);
    return Response.json({ success: true, quotation });
  } catch (error) {
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Error' },
      { status: error instanceof Error && error.message.includes('no encontrada') ? 404 : 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parseResult = UpdateQuotationDTO.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        { success: false, message: 'Datos inválidos', errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const quotation = await updateQuotation(id, parseResult.data);
    return Response.json({ success: true, quotation });
  } catch (error) {
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
