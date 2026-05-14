/**
 * API Route: GET /api/admin/reports/sales
 * Reporte de ventas con filtros de fecha y agrupación.
 */
import { NextRequest } from 'next/server';
import { getSalesReport } from '@/services/report.service';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    const groupBy = (searchParams.get('groupBy') as 'day' | 'week' | 'month') || 'day';

    const now = new Date();
    const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), 1);
    const to = toStr ? new Date(toStr) : now;

    const report = await getSalesReport(from, to, groupBy);
    return Response.json({ success: true, ...report });
  } catch (error) {
    console.error('Sales Report Error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
