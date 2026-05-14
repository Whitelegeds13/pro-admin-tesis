/**
 * API Route: GET /api/admin/reports/support
 * Reporte de soporte técnico.
 */
import { NextRequest } from 'next/server';
import { getSupportReport } from '@/services/report.service';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    const from = fromStr ? new Date(fromStr) : undefined;
    const to = toStr ? new Date(toStr) : undefined;

    const report = await getSupportReport(from, to);
    return Response.json({ success: true, ...report });
  } catch (error) {
    console.error('Support Report Error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
