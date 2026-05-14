/**
 * API Route: GET /api/admin/quotations/[id]/pdf
 * Genera datos JSON para PDF de cotización.
 */
import { NextRequest } from 'next/server';
import { getQuotationPdfData } from '@/services/quotation.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pdfData = await getQuotationPdfData(id);
    return Response.json({ success: true, ...pdfData });
  } catch (error) {
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
