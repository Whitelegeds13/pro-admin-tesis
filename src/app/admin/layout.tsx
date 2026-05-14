'use client';

/**
 * Admin Layout — Refactorizado con JWT y componentes separados.
 *
 * Mejoras:
 * - Autenticación JWT (cookies) en lugar de solo localStorage
 * - Sidebar extraído a componente propio
 * - Auto-refresh de tokens
 * - Manejo seguro de sesiones
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, Bell } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface Employee {
  _id?: string;
  id?: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

// Mapa de títulos y descripciones por ruta
const ROUTE_META: Record<string, { title: string; description: string }> = {
  '/admin/dashboard': { title: 'Dashboard', description: 'Vista general del sistema' },
  '/admin/pedidos': { title: 'Gestión de Pedidos', description: 'Gestiona los pedidos del e-commerce' },
  '/admin/pedidos/confirmados': { title: 'Pedidos Pagados', description: 'Pedidos del e-commerce pagados' },
  '/admin/products': { title: 'Gestión de Productos', description: 'Administra el catálogo de productos' },
  '/admin/brands': { title: 'Gestión de Marcas', description: '' },
  '/admin/categories': { title: 'Gestión de Categorías', description: '' },
  '/admin/suppliers': { title: 'Gestión de Proveedores', description: '' },
  '/admin/clients': { title: 'Gestión de Clientes', description: '' },
  '/admin/sales': { title: 'Sistema de Ventas', description: 'Gestiona las ventas presenciales' },
  '/admin/sales/online': { title: 'Ventas Online', description: 'Ventas realizadas desde el e-commerce' },
  '/admin/sales/logradas': { title: 'Ventas Logradas', description: 'Ventas completadas contabilizadas en reportes' },
  '/admin/purchases': { title: 'Sistema de Compras', description: 'Gestiona las compras a proveedores' },
  '/admin/inventory': { title: 'Control de Inventario', description: 'Control de stock y movimientos' },
  '/admin/reports': { title: 'Reportes y Analytics', description: 'Análisis y estadísticas del negocio' },
  '/admin/support-tickets': { title: 'Soporte Técnico', description: '' },
  '/admin/system/roles': { title: 'Gestión de Roles', description: '' },
  '/admin/system/departments': { title: 'Gestión de Departamentos', description: '' },
  '/admin/system/employees': { title: 'Gestión de Empleados', description: '' },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // ─── Refresh Token ─────────────────────────────────────────
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accessToken) {
          setAccessToken(data.accessToken);
          return data.accessToken;
        }
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // ─── Verificar autenticación ───────────────────────────────
  useEffect(() => {
    const verifyAuth = async () => {
      if (pathname === '/admin/login') {
        setLoading(false);
        return;
      }

      // Intentar refresh del token (usa cookies HttpOnly)
      const token = await refreshAccessToken();

      // Verificar datos del empleado en localStorage
      const employeeData = localStorage.getItem('employee');

      if (!token && !employeeData) {
        router.push('/admin/login');
        return;
      }

      if (employeeData) {
        try {
          const parsed = JSON.parse(employeeData);
          setEmployee(parsed);
        } catch {
          localStorage.removeItem('employee');
          router.push('/admin/login');
          return;
        }
      }

      setLoading(false);
    };

    verifyAuth();
  }, [pathname, router, refreshAccessToken]);

  // ─── Auto-refresh token cada 12 min ────────────────────────
  useEffect(() => {
    if (!employee) return;

    const interval = setInterval(async () => {
      await refreshAccessToken();
    }, 12 * 60 * 1000);

    return () => clearInterval(interval);
  }, [employee, refreshAccessToken]);

  // ─── Responsive ────────────────────────────────────────────
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // ─── Pending orders ────────────────────────────────────────
  useEffect(() => {
    if (!employee) return;

    const fetchPendingOrders = async () => {
      try {
        const headers: Record<string, string> = {};
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        const response = await fetch('/api/admin/orders?status=SOLICITADO', {
          headers,
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success) {
          const solicitados = data.stats?.solicitados || 0;
          const pendientes = data.stats?.pendientes || 0;
          setPendingOrdersCount(solicitados + pendientes);
        }
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
    };

    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 30000);
    return () => clearInterval(interval);
  }, [employee, accessToken]);

  // ─── Logout ────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}

    localStorage.removeItem('employee');
    setEmployee(null);
    setAccessToken(null);
    router.push('/admin/login');
  };

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!employee) return null;

  const routeMeta = ROUTE_META[pathname] || { title: '', description: '' };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <AdminSidebar
        employee={employee}
        pendingOrdersCount={pendingOrdersCount}
        isSidebarOpen={isSidebarOpen}
        isMobile={isMobile}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ease-in-out ${
        isSidebarOpen && !isMobile ? 'ml-64' : 'ml-0'
      }`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {routeMeta.title}
                  </h2>
                  {routeMeta.description && (
                    <p className="text-sm text-gray-500 mt-1 hidden sm:block">
                      {routeMeta.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="hidden sm:flex items-center space-x-4">
                {pendingOrdersCount > 0 && pathname !== '/admin/pedidos' && (
                  <Link
                    href="/admin/pedidos"
                    className="relative px-4 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-semibold text-red-700">
                        {pendingOrdersCount} pedido{pendingOrdersCount > 1 ? 's' : ''} pendiente{pendingOrdersCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </Link>
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{employee.department}</p>
                  <p className="text-xs text-gray-500">ID: {employee.employeeId}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
