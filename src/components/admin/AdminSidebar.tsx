'use client';

/**
 * AdminSidebar — Componente del sidebar del panel admin.
 * Extraído del layout monolítico de 674 líneas para mejorar mantenibilidad.
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  X,
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  Tag,
  FolderTree,
  Building2,
  Warehouse,
  BarChart3,
  Settings,
  Users,
  Briefcase,
  LogOut,
  Bell,
  CheckCircle,
} from 'lucide-react';

interface Employee {
  _id?: string;
  id?: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface AdminSidebarProps {
  employee: Employee;
  pendingOrdersCount: number;
  isSidebarOpen: boolean;
  isMobile: boolean;
  onCloseSidebar: () => void;
  onLogout: () => void;
}

export default function AdminSidebar({
  employee,
  pendingOrdersCount,
  isSidebarOpen,
  isMobile,
  onCloseSidebar,
  onLogout,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
  const [isSalesMenuOpen, setIsSalesMenuOpen] = useState(false);
  const [isOrdersMenuOpen, setIsOrdersMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const isActiveGroup = (prefix: string) => pathname.startsWith(prefix);

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col h-screen ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 bg-gradient-to-r from-blue-600 to-blue-700 px-4 shadow-md">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">PG</span>
          </div>
          <h1 className="text-white text-lg font-bold">Palacio Prime</h1>
        </div>
        {isMobile && (
          <button
            onClick={onCloseSidebar}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-base">
              {employee.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{employee.name}</p>
            <p className="text-xs text-gray-500 truncate">{employee.role}</p>
            <p className="text-xs text-gray-400 mt-0.5">ID: {employee.employeeId}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4 overflow-y-auto flex-1 pb-20">
        <div className="px-4 space-y-1">
          {/* Dashboard */}
          <div className="mb-2">
            <Link
              href="/admin/dashboard"
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                isActive('/admin/dashboard')
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className={`mr-3 h-5 w-5 ${isActive('/admin/dashboard') ? 'text-white' : 'text-gray-500'}`} />
              Dashboard
            </Link>
          </div>

          {/* Separator: Daily Operations */}
          <div className="my-4 px-4">
            <div className="h-px bg-gray-200"></div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-2">Operaciones Diarias</p>
          </div>

          <div className="space-y-1">
            {/* Orders */}
            <div>
              <button
                onClick={() => {
                  setIsSystemMenuOpen(false);
                  setIsProductsMenuOpen(false);
                  setIsSalesMenuOpen(false);
                  setIsOrdersMenuOpen((prev) => !prev);
                }}
                className={`w-full relative flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isActiveGroup('/admin/pedidos')
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <ClipboardList className={`mr-3 h-5 w-5 ${isActiveGroup('/admin/pedidos') ? 'text-white' : 'text-purple-600'}`} />
                  <span className="flex-1">Pedidos</span>
                </div>
                <div className="flex items-center gap-2">
                  {pendingOrdersCount > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActiveGroup('/admin/pedidos') ? 'bg-white text-purple-600' : 'bg-red-500 text-white animate-pulse'
                    }`}>
                      {pendingOrdersCount}
                    </span>
                  )}
                  {isOrdersMenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </button>

              {isOrdersMenuOpen && (
                <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                  <Link href="/admin/pedidos" className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/admin/pedidos') ? 'bg-purple-50 text-purple-700 border-l-2 border-purple-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <ClipboardList className="mr-3 h-4 w-4 text-purple-600" />
                    Pedidos actuales
                  </Link>
                  <Link href="/admin/pedidos/confirmados" className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/admin/pedidos/confirmados') ? 'bg-purple-50 text-purple-700 border-l-2 border-purple-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <CheckCircle className="mr-3 h-4 w-4 text-purple-600" />
                    Pedidos pagados
                  </Link>
                </div>
              )}
            </div>

            <Link href="/admin/clients" className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${isActive('/admin/clients') ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Users className={`mr-3 h-5 w-5 ${isActive('/admin/clients') ? 'text-white' : 'text-indigo-600'}`} />
              Clientes
            </Link>

            {/* Sales */}
            <div>
              <button onClick={() => setIsSalesMenuOpen(!isSalesMenuOpen)} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveGroup('/admin/sales') ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
                <div className="flex items-center">
                  <ShoppingCart className={`mr-3 h-5 w-5 ${isActiveGroup('/admin/sales') ? 'text-white' : 'text-green-600'}`} />
                  Ventas
                </div>
                {isSalesMenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {isSalesMenuOpen && (
                <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                  <Link href="/admin/sales/online" className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/admin/sales/online') ? 'bg-green-50 text-green-700 border-l-2 border-green-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <ShoppingCart className="mr-3 h-4 w-4 text-green-600" />
                    Ventas Online
                  </Link>
                  <Link href="/admin/sales" className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/admin/sales') ? 'bg-green-50 text-green-700 border-l-2 border-green-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <ShoppingCart className="mr-3 h-4 w-4 text-green-600" />
                    Ventas Presenciales
                  </Link>
                  <Link href="/admin/sales/logradas" className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/admin/sales/logradas') ? 'bg-green-50 text-green-700 border-l-2 border-green-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <CheckCircle className="mr-3 h-4 w-4 text-green-600" />
                    Ventas logradas
                  </Link>
                </div>
              )}
            </div>

            <Link href="/admin/purchases" className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${isActive('/admin/purchases') ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Package className={`mr-3 h-5 w-5 ${isActive('/admin/purchases') ? 'text-white' : 'text-orange-600'}`} />
              Compras a Proveedores
            </Link>

            <Link href="/admin/support-tickets" className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${isActive('/admin/support-tickets') ? 'bg-gradient-to-r from-pink-600 to-pink-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Bell className={`mr-3 h-5 w-5 ${isActive('/admin/support-tickets') ? 'text-white' : 'text-pink-600'}`} />
              Soporte Técnico
            </Link>
          </div>

          {/* Separator: Catalog */}
          <div className="my-4 px-4">
            <div className="h-px bg-gray-200"></div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-2">Catálogo y Productos</p>
          </div>

          <div>
            <button onClick={() => setIsProductsMenuOpen(!isProductsMenuOpen)} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveGroup('/admin/products') || isActiveGroup('/admin/brands') || isActiveGroup('/admin/categories') || isActiveGroup('/admin/suppliers') ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
              <div className="flex items-center">
                <Package className={`mr-3 h-5 w-5 ${isActiveGroup('/admin/products') || isActiveGroup('/admin/brands') || isActiveGroup('/admin/categories') || isActiveGroup('/admin/suppliers') ? 'text-white' : 'text-indigo-600'}`} />
                Catálogo
              </div>
              {isProductsMenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {isProductsMenuOpen && (
              <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                <Link href="/admin/products" className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/admin/products') ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <Package className="mr-3 h-4 w-4 text-indigo-500" />
                  Productos
                </Link>
                <Link href="/admin/brands" className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/admin/brands') ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <Tag className="mr-3 h-4 w-4 text-indigo-500" />
                  Marcas
                </Link>
                <Link href="/admin/categories" className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/admin/categories') ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <FolderTree className="mr-3 h-4 w-4 text-indigo-500" />
                  Categorías
                </Link>
                <Link href="/admin/suppliers" className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/admin/suppliers') ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <Building2 className="mr-3 h-4 w-4 text-indigo-500" />
                  Proveedores
                </Link>
              </div>
            )}
          </div>

          {/* Separator: Inventory */}
          <div className="my-4 px-4">
            <div className="h-px bg-gray-200"></div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-2">Inventario y Control</p>
          </div>

          <div className="space-y-1">
            <Link href="/admin/inventory" className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${isActive('/admin/inventory') ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Warehouse className={`mr-3 h-5 w-5 ${isActive('/admin/inventory') ? 'text-white' : 'text-amber-600'}`} />
              Inventario
            </Link>
            <Link href="/admin/reports" className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${isActive('/admin/reports') ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
              <BarChart3 className={`mr-3 h-5 w-5 ${isActive('/admin/reports') ? 'text-white' : 'text-teal-600'}`} />
              Reportes y Analytics
            </Link>
          </div>

          {/* Separator: Config */}
          <div className="my-4 px-4">
            <div className="h-px bg-gray-200"></div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-2">Configuración</p>
          </div>

          <div>
            <button onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveGroup('/admin/system') ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
              <div className="flex items-center">
                <Settings className={`mr-3 h-5 w-5 ${isActiveGroup('/admin/system') ? 'text-white' : 'text-gray-600'}`} />
                Gestión del Sistema
              </div>
              {isSystemMenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {isSystemMenuOpen && (
              <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                <Link href="/admin/system/roles" className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/admin/system/roles') ? 'bg-gray-50 text-gray-900 border-l-2 border-gray-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <Briefcase className="mr-3 h-4 w-4 text-gray-500" />
                  Roles
                </Link>
                <Link href="/admin/system/departments" className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/admin/system/departments') ? 'bg-gray-50 text-gray-900 border-l-2 border-gray-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <Building2 className="mr-3 h-4 w-4 text-gray-500" />
                  Departamentos
                </Link>
                <Link href="/admin/system/employees" className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/admin/system/employees') ? 'bg-gray-50 text-gray-900 border-l-2 border-gray-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <Users className="mr-3 h-4 w-4 text-gray-500" />
                  Empleados
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Logout button */}
      <div className="absolute bottom-0 w-full p-4 bg-white border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-200 hover:border-red-300"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
