/**
 * API Route: POST /api/admin/quotations/[id]/convert
 * Convierte una cotización aprobada en una venta.
 */
import { NextRequest } from 'next/server';
import { convertToSale } from '@/services/quotation.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const employeeId = body.employeeId || 'system';
    const paymentMethod = body.paymentMethod || 'EFECTIVO';

    const result = await convertToSale(id, employeeId, paymentMethod);
    return Response.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
