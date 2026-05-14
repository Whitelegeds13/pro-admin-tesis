/**
 * API Route: GET /api/admin/reports/inventory
 * Reporte de inventario con análisis de stock.
 */
import { getInventoryReport } from '@/services/report.service';

export async function GET() {
  try {
    const report = await getInventoryReport();
    return Response.json({ success: true, ...report });
  } catch (error) {
    console.error('Inventory Report Error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
