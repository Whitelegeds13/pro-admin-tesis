/**
 * API Route: /api/admin/quotations
 * CRUD de cotizaciones con validación y seguridad.
 */
import { NextRequest } from 'next/server';
import { CreateQuotationDTO, QuotationQueryDTO } from '@/core/dtos/quotation.dto';
import { createQuotation, getQuotations } from '@/services/quotation.service';

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = QuotationQueryDTO.parse(params);
    const result = await getQuotations(query);
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('Quotations GET Error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = CreateQuotationDTO.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        { success: false, message: 'Datos inválidos', errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // TODO: obtener employeeId real del token JWT
    const employeeId = body.employeeId || 'system';
    const quotation = await createQuotation(employeeId, parseResult.data);

    return Response.json({ success: true, quotation }, { status: 201 });
  } catch (error) {
    console.error('Quotations POST Error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
