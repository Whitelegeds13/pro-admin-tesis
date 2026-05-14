'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardData {
  period: string;
  sales: {
    totalSales: number;
    totalRevenue: number;
    avgSale: number;
    completedSales: number;
    pendingSales: number;
    growth: {
      sales: number;
      revenue: number;
    };
  };
  salesByDay: Array<{
    _id: string;
    count: number;
    revenue: number;
  }>;
  inventory: {
    totalProducts: number;
    totalStock: number;
    totalValue: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
  recentMovements: Array<{
    _id: string;
    count: number;
    totalQuantity: number;
  }>;
  topProducts: Array<{
    _id: string;
    totalQuantity: number;
    totalRevenue: number;
    product: {
      _id: string;
      name: string;
      code: string;
    };
  }>;
  purchases: {
    totalPurchases: number;
    totalAmount: number;
    avgPurchase: number;
    receivedPurchases: number;
    pendingPurchases: number;
  };
  clients: {
    total: number;
    new: number;
  };
  employees: {
    total: number;
  };
  alerts: {
    critical: number;
    products: Array<{
      _id: string;
      name: string;
      code: string;
      stock: number;
      minStock: number;
    }>;
  };
}

export default function ReportsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reports/dashboard?period=${selectedPeriod}`);
      const data = await response.json();

      if (data.success) {
        setDashboardData(data);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod, fetchDashboardData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-PE').format(num);
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const salesByDayData = (dashboardData?.salesByDay || []).map(d => ({
    date: new Date(d._id).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' }),
    count: d.count,
    revenue: Number(d.revenue.toFixed(2))
  }));

  const topProductsData = (dashboardData?.topProducts || []).map(p => ({
    name: p.product?.name || 'Producto',
    quantity: p.totalQuantity,
    revenue: Number(p.totalRevenue.toFixed(2))
  }));

  const inventoryPieData = (() => {
    if (!dashboardData) return [] as Array<{ name: string; value: number }>;
    const low = dashboardData.inventory.lowStockProducts;
    const out = dashboardData.inventory.outOfStockProducts;
    const ok = Math.max(dashboardData.inventory.totalProducts - low - out, 0);
    return [
      { name: 'Stock Óptimo', value: ok },
      { name: 'Stock Bajo', value: low },
      { name: 'Agotados', value: out }
    ];
  })();

  const pieColors = ['#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Analytics</h1>
          <p className="text-gray-600 mt-1">Análisis completo de tu negocio</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="day">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="year">Este Año</option>
          </select>
          <button
            onClick={fetchDashboardData}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sales'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ShoppingCart className="h-4 w-4 inline mr-2" />
          Ventas
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'inventory'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="h-4 w-4 inline mr-2" />
          Inventario
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'alerts'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          Alertas
        </button>
      </div>

      {/* Contenido según la pestaña activa */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(dashboardData.sales.totalSales)}
                  </p>
                  <div className="flex items-center mt-1">
                    {getGrowthIcon(dashboardData.sales.growth.sales)}
                    <span className={`text-sm font-medium ml-1 ${getGrowthColor(dashboardData.sales.growth.sales)}`}>
                      {Math.abs(dashboardData.sales.growth.sales).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ingresos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardData.sales.totalRevenue)}
                  </p>
                  <div className="flex items-center mt-1">
                    {getGrowthIcon(dashboardData.sales.growth.revenue)}
                    <span className={`text-sm font-medium ml-1 ${getGrowthColor(dashboardData.sales.growth.revenue)}`}>
                      {Math.abs(dashboardData.sales.growth.revenue).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Productos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(dashboardData.inventory.totalProducts)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Stock: {formatNumber(dashboardData.inventory.totalStock)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Clientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(dashboardData.clients.total)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Nuevos: {formatNumber(dashboardData.clients.new)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Día (Últimos 7 días)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesByDayData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" name="Ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" name="Ingresos" stroke="#22c55e" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Productos Vendidos</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={topProductsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" name="Unidades" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="revenue" name="Ingresos" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Ventas</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completadas</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatNumber(dashboardData.sales.completedSales)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pendientes</span>
                  <span className="text-sm font-semibold text-yellow-600">
                    {formatNumber(dashboardData.sales.pendingSales)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Promedio por Venta</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(dashboardData.sales.avgSale)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compras</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Compras</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(dashboardData.purchases.totalPurchases)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monto Total</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(dashboardData.purchases.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recibidas</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatNumber(dashboardData.purchases.receivedPurchases)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Movimientos Recientes</h3>
              <div className="space-y-3">
                {dashboardData.recentMovements.map((movement, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{movement._id}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatNumber(movement.count)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(dashboardData.inventory.totalProducts)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Stock Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(dashboardData.inventory.totalStock)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardData.inventory.totalValue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(dashboardData.inventory.lowStockProducts)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Inventario</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={inventoryPieData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {inventoryPieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas Críticas</h3>
            <div className="space-y-3">
              {dashboardData.alerts.products.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600">
                      Stock: {formatNumber(product.stock)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Mín: {formatNumber(product.minStock)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
