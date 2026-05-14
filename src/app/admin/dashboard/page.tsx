'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Users, 
  DollarSign, 
  ClipboardList, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  Plus,
  BarChart3,
  Settings,
  ArrowRight,
  Activity
} from 'lucide-react';

interface Employee {
  employeeId: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface DashboardStats {
  products: { total: number; change: number; changeType: 'positive' | 'negative' };
  clients: { total: number; change: number; changeType: 'positive' | 'negative' };
  sales: { total: number; change: number; changeType: 'positive' | 'negative'; count: number };
  pendingOrders: { total: number; change: number; changeType: 'positive' | 'negative' };
}

interface Activity {
  id: string;
  type: string;
  action: string;
  item: string;
  time: string;
  icon: string;
}

interface SalesByDay {
  _id: string;
  revenue: number;
  count: number;
}

export default function AdminDashboard() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [salesByDay, setSalesByDay] = useState<SalesByDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/dashboard/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setActivities(data.activities || []);
        setSalesByDay(data.salesByDay || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Obtener datos del empleado
    const employeeData = localStorage.getItem('employee');
    if (employeeData) {
      setEmployee(JSON.parse(employeeData));
    }

    // Actualizar la hora cada segundo
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Cargar estadísticas
    fetchStats();

    // Actualizar cada 30 segundos
    const statsInterval = setInterval(fetchStats, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(statsInterval);
    };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(price);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-PE').format(num);
  };

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'shopping-cart':
        return <ShoppingCart className="h-4 w-4" />;
      case 'package':
        return <Package className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'product':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'user':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // Calcular altura máxima para el gráfico
  const maxRevenue = salesByDay.length > 0 
    ? Math.max(...salesByDay.map(d => d.revenue))
    : 1;

  const statsCards = stats ? [
    {
      title: 'Productos Totales',
      value: formatNumber(stats.products.total),
      change: `${stats.products.change >= 0 ? '+' : ''}${stats.products.change.toFixed(1)}%`,
      changeType: stats.products.changeType,
      icon: Package,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Usuarios Registrados',
      value: formatNumber(stats.clients.total),
      change: `${stats.clients.change >= 0 ? '+' : ''}${stats.clients.change.toFixed(1)}%`,
      changeType: stats.clients.changeType,
      icon: Users,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Ventas del Mes',
      value: formatPrice(stats.sales.total),
      change: `${stats.sales.change >= 0 ? '+' : ''}${stats.sales.change.toFixed(1)}%`,
      changeType: stats.sales.changeType,
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      subtitle: `${stats.sales.count} ventas`
    },
    {
      title: 'Pedidos Pendientes',
      value: formatNumber(stats.pendingOrders.total),
      change: `${stats.pendingOrders.change >= 0 ? '+' : ''}${stats.pendingOrders.change.toFixed(1)}%`,
      changeType: stats.pendingOrders.changeType,
      icon: ClipboardList,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate mb-2">
              ¡Bienvenido, {employee?.name || 'Administrador'}!
            </h1>
            <p className="text-blue-100 mt-1 text-sm sm:text-base">
              {currentTime}
            </p>
            <p className="text-blue-200 text-xs sm:text-sm mt-2 truncate">
              Departamento: {employee?.department} | ID: {employee?.employeeId}
            </p>
          </div>
          <div className="hidden sm:block ml-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
              <span className="text-3xl font-bold">
                {employee?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate mb-1">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`p-3 ${stat.bgColor} rounded-xl ${stat.iconColor} ml-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center pt-3 border-t border-gray-100">
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-xs sm:text-sm font-semibold ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 ml-2">vs mes anterior</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Actividad reciente */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Actividad Reciente
            </h3>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay actividad reciente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-lg border ${getActivityColor(activity.type)} flex-shrink-0`}>
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500 truncate mt-1">{activity.item}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Accesos Rápidos</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <Link
                href="/admin/products?action=create"
                className="flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-green-200 transition-colors">
                  <Plus className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Agregar Producto</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>

              <Link
                href="/admin/clients"
                className="flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Gestionar Clientes</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>

              <Link
                href="/admin/pedidos"
                className="flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Ver Pedidos</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>

              <Link
                href="/admin/reports"
                className="flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Ver Reportes</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>

              <Link
                href="/admin/system/employees"
                className="flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                  <Settings className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Configuración</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de ventas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Ventas de los Últimos 7 Días
          </h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center animate-pulse">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Cargando datos...</p>
              </div>
            </div>
          ) : salesByDay.length === 0 ? (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay datos de ventas</p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-2">
              {salesByDay.map((day, index) => {
                const height = (day.revenue / maxRevenue) * 100;
                const date = new Date(day._id);
                const dayName = date.toLocaleDateString('es-PE', { weekday: 'short' });
                const dayNumber = date.getDate();
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    <div className="w-full flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500 cursor-pointer relative group"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      >
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatPrice(day.revenue)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs font-medium text-gray-900">{dayNumber}</p>
                      <p className="text-xs text-gray-500">{dayName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}