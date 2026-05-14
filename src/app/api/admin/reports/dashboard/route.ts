/**
 * API Route: GET /api/admin/reports/dashboard
 * Dashboard KPIs ejecutivo con datos en tiempo real.
 */
import { NextRequest } from 'next/server';
import { getReportsDashboard } from '@/services/report.service';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const periodParam = searchParams.get('period');
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    const now = new Date();

    const getRangeFromPeriod = (period: string) => {
      if (period === 'day') {
        const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { from, to: now };
      }
      if (period === 'week') {
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1;
        const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
        from.setHours(0, 0, 0, 0);
        return { from, to: now };
      }
      if (period === 'year') {
        const from = new Date(now.getFullYear(), 0, 1);
        return { from, to: now };
      }
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: now };
    };

    const resolved =
      fromStr && toStr
        ? { from: new Date(fromStr), to: new Date(toStr), period: 'custom' }
        : { ...getRangeFromPeriod(periodParam || 'month'), period: periodParam || 'month' };

    const durationMs = Math.max(resolved.to.getTime() - resolved.from.getTime(), 0);
    const prevTo = resolved.from;
    const prevFrom = new Date(resolved.from.getTime() - durationMs);

    const dashboard = await getReportsDashboard({
      period: resolved.period,
      from: resolved.from,
      to: resolved.to,
      prevFrom,
      prevTo,
    });

    return Response.json({ success: true, ...dashboard });
  } catch (error) {
    console.error('Dashboard KPIs Error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
