/**
 * Report Service — Métricas KPI y reportes empresariales.
 *
 * Implementa:
 * - Dashboard ejecutivo con KPIs
 * - Reportes de ventas por período
 * - Reportes de inventario
 * - Reportes de soporte técnico
 * - Agregaciones MongoDB optimizadas
 */
import { connectDB } from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import Client from '@/models/Client';
import Employee from '@/models/Employee';
import Purchase from '@/models/Purchase';
import StockMovement from '@/models/StockMovement';
import SupportTicket from '@/models/SupportTicket';
import Quotation from '@/models/Quotation';

/**
 * Dashboard ejecutivo con KPIs principales.
 */
export async function getDashboardKPIs(dateRange?: { from: Date; to: Date }) {
  await connectDB();

  const dateFilter = dateRange
    ? { createdAt: { $gte: dateRange.from, $lte: dateRange.to } }
    : {};

  const [
    salesMetrics,
    totalProducts,
    lowStockProducts,
    totalClients,
    newClientsThisMonth,
    openTickets,
    quotationMetrics,
  ] = await Promise.all([
    // Métricas de ventas
    Sale.aggregate([
      { $match: { status: { $in: ['CONFIRMADO', 'PAGADO'] }, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalSales: { $sum: 1 },
          avgTicket: { $avg: '$total' },
        },
      },
    ]),

    // Total de productos activos
    Product.countDocuments({ isActive: true }),

    // Productos con stock bajo
    Product.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stock', '$minStock'] },
    }),

    // Total de clientes
    Client.countDocuments({ isActive: true }),

    // Clientes nuevos este mes
    Client.countDocuments({
      isActive: true,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    }),

    // Tickets abiertos
    SupportTicket.countDocuments({
      isActive: true,
      status: { $nin: ['FINALIZADO', 'ENTREGADO', 'CANCELADO'] },
    }),

    // Métricas de cotizaciones
    Quotation.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
        },
      },
    ]),
  ]);

  const sales = salesMetrics[0] || { totalRevenue: 0, totalSales: 0, avgTicket: 0 };

  return {
    revenue: {
      total: Math.round(sales.totalRevenue * 100) / 100,
      salesCount: sales.totalSales,
      avgTicket: Math.round(sales.avgTicket * 100) / 100,
    },
    inventory: {
      totalProducts,
      lowStockProducts,
      lowStockPercentage: totalProducts > 0 ? Math.round((lowStockProducts / totalProducts) * 100) : 0,
    },
    clients: {
      total: totalClients,
      newThisMonth: newClientsThisMonth,
    },
    support: {
      openTickets,
    },
    quotations: Object.fromEntries(
      quotationMetrics.map((q) => [q._id, { count: q.count, amount: Math.round(q.totalAmount * 100) / 100 }])
    ),
  };
}

/**
 * Reporte de ventas por período con desglose.
 */
export async function getSalesReport(from: Date, to: Date, groupBy: 'day' | 'week' | 'month' = 'day') {
  await connectDB();

  const dateFormat = {
    day: { $dateToString: { format: '%Y-%m-%d', date: '$issueDate' } },
    week: { $dateToString: { format: '%Y-W%V', date: '$issueDate' } },
    month: { $dateToString: { format: '%Y-%m', date: '$issueDate' } },
  };

  const [timeline, byPaymentMethod, byReceiptType, topProducts] = await Promise.all([
    // Timeline de ventas
    Sale.aggregate([
      {
        $match: {
          status: { $in: ['CONFIRMADO', 'PAGADO'] },
          issueDate: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: dateFormat[groupBy],
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
          avgTicket: { $avg: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Por método de pago
    Sale.aggregate([
      {
        $match: {
          status: { $in: ['CONFIRMADO', 'PAGADO'] },
          issueDate: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
      { $sort: { total: -1 } },
    ]),

    // Por tipo de comprobante
    Sale.aggregate([
      {
        $match: {
          status: { $in: ['CONFIRMADO', 'PAGADO'] },
          issueDate: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: '$receiptType',
          count: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
    ]),

    // Top productos vendidos
    Sale.aggregate([
      {
        $match: {
          status: { $in: ['CONFIRMADO', 'PAGADO'] },
          issueDate: { $gte: from, $lte: to },
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'saleitems',
          localField: 'items',
          foreignField: '_id',
          as: 'itemDetail',
        },
      },
      { $unwind: '$itemDetail' },
      {
        $group: {
          _id: '$itemDetail.productName',
          totalSold: { $sum: '$itemDetail.quantity' },
          totalRevenue: { $sum: '$itemDetail.subtotal' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    timeline,
    byPaymentMethod,
    byReceiptType,
    topProducts,
    period: { from: from.toISOString(), to: to.toISOString(), groupBy },
  };
}

/**
 * Reporte de inventario.
 */
export async function getInventoryReport() {
  await connectDB();

  const [byCategory, lowStock, topValued, stockSummary] = await Promise.all([
    // Productos por categoría
    Product.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' },
      },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$cat.name',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
        },
      },
      { $sort: { totalValue: -1 } },
    ]),

    // Productos con stock bajo (alerta)
    Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$minStock'] },
    })
      .populate('category', 'name')
      .populate('brand', 'name')
      .select('name code stock minStock price category brand')
      .sort({ stock: 1 })
      .limit(20)
      .lean(),

    // Productos con mayor valor en stock
    Product.aggregate([
      { $match: { isActive: true } },
      { $addFields: { stockValue: { $multiply: ['$price', '$stock'] } } },
      { $sort: { stockValue: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1, code: 1, stock: 1, price: 1, stockValue: 1,
        },
      },
    ]),

    // Resumen general
    Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalUnits: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
          avgPrice: { $avg: '$price' },
        },
      },
    ]),
  ]);

  return {
    byCategory,
    lowStock,
    topValued,
    summary: stockSummary[0] || { totalProducts: 0, totalUnits: 0, totalValue: 0, avgPrice: 0 },
  };
}

/**
 * Reporte de soporte técnico.
 */
export async function getSupportReport(from?: Date, to?: Date) {
  await connectDB();

  const dateFilter = from && to ? { createdAt: { $gte: from, $lte: to } } : {};

  const [byStatus, byCategory, byPriority, avgResolution, timeline] = await Promise.all([
    SupportTicket.aggregate([
      { $match: { isActive: true, ...dateFilter } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    SupportTicket.aggregate([
      { $match: { isActive: true, ...dateFilter } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),

    SupportTicket.aggregate([
      { $match: { isActive: true, status: { $nin: ['FINALIZADO', 'ENTREGADO', 'CANCELADO'] }, ...dateFilter } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),

    SupportTicket.aggregate([
      { $match: { completedDate: { $exists: true }, ...dateFilter } },
      {
        $project: {
          resolutionMs: { $subtract: ['$completedDate', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: null,
          avgHours: { $avg: { $divide: ['$resolutionMs', 3600000] } },
          minHours: { $min: { $divide: ['$resolutionMs', 3600000] } },
          maxHours: { $max: { $divide: ['$resolutionMs', 3600000] } },
          count: { $sum: 1 },
        },
      },
    ]),

    SupportTicket.aggregate([
      { $match: { ...dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          created: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]),
  ]);

  return {
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    byCategory: Object.fromEntries(byCategory.map((c) => [c._id, c.count])),
    byPriority: Object.fromEntries(byPriority.map((p) => [p._id, p.count])),
    resolution: avgResolution[0] || { avgHours: 0, minHours: 0, maxHours: 0, count: 0 },
    timeline,
  };
}

export async function getReportsDashboard(params: {
  period: string;
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
}) {
  await connectDB();

  const saleStatusCompleted = ['CONFIRMADO', 'PAGADO'];
  const saleStatusPending = ['SOLICITADO', 'PENDIENTE'];

  const currentSalesMatch = {
    status: { $in: saleStatusCompleted },
    issueDate: { $gte: params.from, $lte: params.to },
  };

  const prevSalesMatch = {
    status: { $in: saleStatusCompleted },
    issueDate: { $gte: params.prevFrom, $lte: params.prevTo },
  };

  const [
    currentSalesAgg,
    prevSalesAgg,
    completedSales,
    pendingSales,
    salesByDay,
    topProducts,
    inventoryTotals,
    lowStockProducts,
    outOfStockProducts,
    recentMovements,
    purchaseAgg,
    receivedPurchases,
    pendingPurchases,
    totalClients,
    newClients,
    totalEmployees,
    alertProducts,
  ] = await Promise.all([
    Sale.aggregate([
      { $match: currentSalesMatch },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgSale: { $avg: '$total' },
        },
      },
    ]),

    Sale.aggregate([
      { $match: prevSalesMatch },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
        },
      },
    ]),

    Sale.countDocuments(currentSalesMatch),

    Sale.countDocuments({
      status: { $in: saleStatusPending },
      issueDate: { $gte: params.from, $lte: params.to },
    }),

    Sale.aggregate([
      { $match: currentSalesMatch },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$issueDate' } },
          count: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 31 },
    ]),

    Sale.aggregate([
      { $match: currentSalesMatch },
      { $unwind: '$items' },
      { $lookup: { from: 'saleitems', localField: 'items', foreignField: '_id', as: 'item' } },
      { $unwind: '$item' },
      {
        $group: {
          _id: '$item.product',
          totalQuantity: { $sum: '$item.quantity' },
          totalRevenue: { $sum: '$item.subtotal' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          product: {
            _id: '$product._id',
            name: '$product.name',
            code: '$product.code',
          },
        },
      },
    ]),

    Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
        },
      },
    ]),

    Product.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stock', '$minStock'] },
    }),

    Product.countDocuments({ isActive: true, stock: { $lte: 0 } }),

    StockMovement.aggregate([
      { $match: { isActive: true, createdAt: { $gte: params.from, $lte: params.to } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: { $abs: '$quantity' } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),

    Purchase.aggregate([
      { $match: { isActive: true, orderDate: { $gte: params.from, $lte: params.to } } },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          avgPurchase: { $avg: '$total' },
        },
      },
    ]),

    Purchase.countDocuments({
      isActive: true,
      status: 'received',
      orderDate: { $gte: params.from, $lte: params.to },
    }),

    Purchase.countDocuments({
      isActive: true,
      status: { $in: ['pending', 'ordered'] },
      orderDate: { $gte: params.from, $lte: params.to },
    }),

    Client.countDocuments({ isActive: true }),

    Client.countDocuments({ isActive: true, createdAt: { $gte: params.from, $lte: params.to } }),

    Employee.countDocuments({ isActive: true }),

    Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$minStock'] },
    })
      .select('name code stock minStock')
      .sort({ stock: 1 })
      .limit(12)
      .lean(),
  ]);

  const currentSales = currentSalesAgg[0] || { totalSales: 0, totalRevenue: 0, avgSale: 0 };
  const prevSales = prevSalesAgg[0] || { totalSales: 0, totalRevenue: 0 };

  const salesGrowth =
    prevSales.totalSales > 0
      ? ((currentSales.totalSales - prevSales.totalSales) / prevSales.totalSales) * 100
      : currentSales.totalSales > 0
        ? 100
        : 0;

  const revenueGrowth =
    prevSales.totalRevenue > 0
      ? ((currentSales.totalRevenue - prevSales.totalRevenue) / prevSales.totalRevenue) * 100
      : currentSales.totalRevenue > 0
        ? 100
        : 0;

  const inv = inventoryTotals[0] || { totalProducts: 0, totalStock: 0, totalValue: 0 };
  const purchases = purchaseAgg[0] || { totalPurchases: 0, totalAmount: 0, avgPurchase: 0 };

  return {
    period: params.period,
    sales: {
      totalSales: currentSales.totalSales,
      totalRevenue: Math.round(currentSales.totalRevenue * 100) / 100,
      avgSale: Math.round((currentSales.avgSale || 0) * 100) / 100,
      completedSales,
      pendingSales,
      growth: {
        sales: Math.round(salesGrowth * 10) / 10,
        revenue: Math.round(revenueGrowth * 10) / 10,
      },
    },
    salesByDay: salesByDay.map((d: { _id: string; count: number; revenue: number }) => ({
      _id: d._id,
      count: d.count,
      revenue: Math.round(d.revenue * 100) / 100,
    })),
    inventory: {
      totalProducts: inv.totalProducts,
      totalStock: inv.totalStock,
      totalValue: Math.round(inv.totalValue * 100) / 100,
      lowStockProducts,
      outOfStockProducts,
    },
    recentMovements,
    topProducts: topProducts.map((p: { _id: unknown; totalQuantity: number; totalRevenue: number; product?: { _id?: unknown; name?: string; code?: string } }) => ({
      _id: String(p._id),
      totalQuantity: p.totalQuantity,
      totalRevenue: Math.round(p.totalRevenue * 100) / 100,
      product: {
        _id: p.product?._id ? String(p.product._id) : String(p._id),
        name: p.product?.name || 'Producto',
        code: p.product?.code || '',
      },
    })),
    purchases: {
      totalPurchases: purchases.totalPurchases,
      totalAmount: Math.round(purchases.totalAmount * 100) / 100,
      avgPurchase: Math.round((purchases.avgPurchase || 0) * 100) / 100,
      receivedPurchases,
      pendingPurchases,
    },
    clients: {
      total: totalClients,
      new: newClients,
    },
    employees: {
      total: totalEmployees,
    },
    alerts: {
      critical: outOfStockProducts,
      products: alertProducts.map((p: { _id: unknown; name: string; code: string; stock: number; minStock: number }) => ({
        _id: String(p._id),
        name: p.name,
        code: p.code,
        stock: p.stock,
        minStock: p.minStock,
      })),
    },
  };
}
