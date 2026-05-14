'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import ModernMetricCard from '@/components/dashboard/ModernMetricCard';
import ModernHeader from '@/components/dashboard/ModernHeader';
import AdvancedChart from '@/components/dashboard/AdvancedChart';
import ModernActivityFeed from '@/components/dashboard/ModernActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import RealTimeStats from '@/components/dashboard/RealTimeStats';
import SystemStatusWidget from '@/components/dashboard/SystemStatusWidget';

interface Employee {
  employeeId: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  monthlySales: number;
  pendingOrders: number;
  productsChange: number;
  usersChange: number;
  salesChange: number;
  ordersChange: number;
}

export default function AdminDashboard() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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

    // Simular carga de datos
    setTimeout(() => {
      setStats({
        totalProducts: 1247,
        totalUsers: 892,
        monthlySales: 45678,
        pendingOrders: 23,
        productsChange: 12,
        usersChange: 8,
        salesChange: 23,
        ordersChange: -5
      });
      setLoading(false);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Datos de ejemplo para gráficos
  const salesData = [
    { label: 'Lun', value: 1200 },
    { label: 'Mar', value: 1900 },
    { label: 'Mié', value: 3000 },
    { label: 'Jue', value: 5000 },
    { label: 'Vie', value: 4500 },
    { label: 'Sáb', value: 3200 },
    { label: 'Dom', value: 2800 }
  ];

  const categoryData = [
    { label: 'PCs Gaming', value: 35, color: '#3B82F6' },
    { label: 'Componentes', value: 25, color: '#10B981' },
    { label: 'Periféricos', value: 20, color: '#8B5CF6' },
    { label: 'Audio', value: 15, color: '#F59E0B' },
    { label: 'Otros', value: 5, color: '#EF4444' }
  ];

  const activities = [
    {
      id: '1',
      type: 'product' as const,
      title: 'Nuevo producto agregado',
      description: 'iPhone 15 Pro Max 256GB',
      time: 'Hace 2 horas',
      user: 'María García'
    },
    {
      id: '2',
      type: 'user' as const,
      title: 'Usuario registrado',
      description: 'juan.perez@email.com',
      time: 'Hace 3 horas',
      user: 'Sistema'
    },
    {
      id: '3',
      type: 'order' as const,
      title: 'Pedido completado',
      description: 'Pedido #1234 - $2,450.00',
      time: 'Hace 5 horas',
      user: 'Carlos López'
    },
    {
      id: '4',
      type: 'sale' as const,
      title: 'Venta importante',
      description: 'PC Gaming RTX 4080 - $3,200.00',
      time: 'Hace 1 día',
      user: 'Ana Martínez'
    },
    {
      id: '5',
      type: 'alert' as const,
      title: 'Stock bajo',
      description: 'Mouse Logitech G Pro X - Solo 3 unidades',
      time: 'Hace 2 días',
      user: 'Sistema'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="space-y-8 p-6">
        {/* Modern Header */}
        <ModernHeader 
          employee={employee} 
          currentTime={currentTime}
        />

        {/* Métricas principales modernas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ModernMetricCard
            title="Productos Totales"
            value={stats?.totalProducts.toLocaleString() || '0'}
            change={stats?.productsChange}
            changeType={stats?.productsChange && stats.productsChange > 0 ? 'positive' : 'negative'}
            icon={Package}
            color="blue"
            loading={loading}
            trend="up"
            subtitle="Inventario actual"
          />
          <ModernMetricCard
            title="Usuarios Registrados"
            value={stats?.totalUsers.toLocaleString() || '0'}
            change={stats?.usersChange}
            changeType={stats?.usersChange && stats.usersChange > 0 ? 'positive' : 'negative'}
            icon={Users}
            color="green"
            loading={loading}
            trend="up"
            subtitle="Clientes activos"
          />
          <ModernMetricCard
            title="Ventas del Mes"
            value={`$${stats?.monthlySales.toLocaleString() || '0'}`}
            change={stats?.salesChange}
            changeType={stats?.salesChange && stats.salesChange > 0 ? 'positive' : 'negative'}
            icon={DollarSign}
            color="purple"
            loading={loading}
            trend="up"
            subtitle="Ingresos mensuales"
          />
          <ModernMetricCard
            title="Pedidos Pendientes"
            value={stats?.pendingOrders.toString() || '0'}
            change={stats?.ordersChange}
            changeType={stats?.ordersChange && stats.ordersChange > 0 ? 'positive' : 'negative'}
            icon={ShoppingCart}
            color="orange"
            loading={loading}
            trend="down"
            subtitle="Por procesar"
          />
        </div>

        {/* Gráficos avanzados */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de ventas */}
          <div className="lg:col-span-2">
            <AdvancedChart
              data={salesData}
              type="line"
              title="Ventas de los Últimos 7 Días"
              subtitle="Tendencia de ventas diarias con análisis predictivo"
              height={300}
              loading={loading}
              interactive={true}
              showTrend={true}
              trendValue={23}
            />
          </div>

          {/* Distribución por categorías */}
          <div>
            <AdvancedChart
              data={categoryData}
              type="doughnut"
              title="Ventas por Categoría"
              subtitle="Distribución de productos vendidos"
              height={300}
              loading={loading}
              interactive={true}
            />
          </div>
        </div>

        {/* Actividad reciente y accesos rápidos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ModernActivityFeed activities={activities} loading={loading} />
          </div>
          <div>
            <SystemStatusWidget />
          </div>
        </div>

        {/* Accesos rápidos y estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions loading={loading} />
          <RealTimeStats loading={loading} />
        </div>

        {/* Alertas y notificaciones modernas */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border border-amber-200/50 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-amber-800 mb-3">
                Centro de Notificaciones
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-700">Sistema funcionando correctamente</span>
                  <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-yellow-700">3 productos con stock bajo</span>
                  <div className="ml-auto w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-blue-700">Backup programado para esta noche</span>
                  <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}