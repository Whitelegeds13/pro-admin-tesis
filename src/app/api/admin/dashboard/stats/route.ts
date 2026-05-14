import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import Client from '@/models/Client';

// GET - Estadísticas del dashboard principal
export async function GET() {
  try {
    await connectDB();
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total de productos
    const totalProducts = await Product.countDocuments({ isActive: true });
    const lastMonthProducts = await Product.countDocuments({
      isActive: true,
      createdAt: { $lt: startOfMonth }
    });
    const productsChange = lastMonthProducts > 0 
      ? ((totalProducts - lastMonthProducts) / lastMonthProducts * 100).toFixed(1)
      : '0';

    // Total de clientes
    const totalClients = await Client.countDocuments({ isActive: true });
    const lastMonthClients = await Client.countDocuments({
      isActive: true,
      createdAt: { $lt: startOfMonth }
    });
    const clientsChange = lastMonthClients > 0
      ? ((totalClients - lastMonthClients) / lastMonthClients * 100).toFixed(1)
      : '0';

    // Ventas del mes
    const monthSales = await Sale.aggregate([
      {
        $match: {
          issueDate: { $gte: startOfMonth },
          status: { $in: ['PAGADO', 'CONFIRMADO'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);

    const lastMonthSales = await Sale.aggregate([
      {
        $match: {
          issueDate: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          status: { $in: ['PAGADO', 'CONFIRMADO'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);

    const currentMonthRevenue = monthSales[0]?.total || 0;
    const lastMonthRevenue = lastMonthSales[0]?.total || 0;
    const salesChange = lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : '0';

    // Pedidos pendientes
    const pendingOrders = await Sale.countDocuments({
      status: { $in: ['SOLICITADO', 'PENDIENTE'] }
    });

    const lastMonthPending = await Sale.countDocuments({
      status: { $in: ['SOLICITADO', 'PENDIENTE'] },
      createdAt: { $lt: startOfMonth }
    });
    const pendingChange = lastMonthPending > 0
      ? ((pendingOrders - lastMonthPending) / lastMonthPending * 100).toFixed(1)
      : '0';

    // Ventas por día (últimos 7 días)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const salesByDay = await Sale.aggregate([
      {
        $match: {
          issueDate: { $gte: sevenDaysAgo },
          status: { $in: ['PAGADO', 'CONFIRMADO'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$issueDate'
            }
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Actividad reciente
    const recentSales = await Sale.find({
      status: { $in: ['PAGADO', 'CONFIRMADO', 'SOLICITADO', 'PENDIENTE'] }
    })
      .populate('client', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentProducts = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(3);

    const recentClients = await Client.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(3);

    // Formatear actividad reciente
    const activities: Array<{
      id: string;
      type: string;
      action: string;
      item: string;
      time: string;
      icon: string;
    }> = [];

    recentSales.forEach((sale) => {
      interface PopulatedClient {
        name?: string;
        email?: string;
      }
      const clientName = (sale.client as PopulatedClient)?.name || 'Cliente';
      const timeAgo = getTimeAgo(sale.createdAt);
      activities.push({
        id: `sale-${sale._id}`,
        type: 'sale',
        action: 'Venta realizada',
        item: `${sale.receiptType} ${sale.receiptNumber} - ${clientName}`,
        time: timeAgo,
        icon: 'shopping-cart'
      });
    });

    recentProducts.forEach((product) => {
      const timeAgo = getTimeAgo(product.createdAt);
      activities.push({
        id: `product-${product._id}`,
        type: 'product',
        action: 'Producto agregado',
        item: product.name,
        time: timeAgo,
        icon: 'package'
      });
    });

    recentClients.forEach((client) => {
      const timeAgo = getTimeAgo(client.createdAt);
      activities.push({
        id: `client-${client._id}`,
        type: 'user',
        action: 'Cliente registrado',
        item: client.email,
        time: timeAgo,
        icon: 'user'
      });
    });

    // Ordenar actividades por fecha
    activities.sort((a, b) => {
      const aTime = getTimeInMs(a.time);
      const bTime = getTimeInMs(b.time);
      return bTime - aTime;
    });

    return NextResponse.json({
      success: true,
      stats: {
        products: {
          total: totalProducts,
          change: parseFloat(productsChange),
          changeType: parseFloat(productsChange) >= 0 ? 'positive' : 'negative'
        },
        clients: {
          total: totalClients,
          change: parseFloat(clientsChange),
          changeType: parseFloat(clientsChange) >= 0 ? 'positive' : 'negative'
        },
        sales: {
          total: currentMonthRevenue,
          change: parseFloat(salesChange),
          changeType: parseFloat(salesChange) >= 0 ? 'positive' : 'negative',
          count: monthSales[0]?.count || 0
        },
        pendingOrders: {
          total: pendingOrders,
          change: parseFloat(pendingChange),
          changeType: parseFloat(pendingChange) >= 0 ? 'positive' : 'negative'
        }
      },
      salesByDay,
      activities: activities.slice(0, 5)
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener las estadísticas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  return new Date(date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

function getTimeInMs(timeStr: string): number {
  if (timeStr.includes('momento')) return Date.now();
  const match = timeStr.match(/(\d+)/);
  if (!match) return 0;
  const num = parseInt(match[1]);
  if (timeStr.includes('minuto')) return Date.now() - num * 60000;
  if (timeStr.includes('hora')) return Date.now() - num * 3600000;
  if (timeStr.includes('día')) return Date.now() - num * 86400000;
  return 0;
}

