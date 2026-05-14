'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  UserCheck, 
  BarChart3, 
  Settings, 
  Shield, 
  Building,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface Employee {
  employeeId: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Obtener datos del empleado
    const employeeData = localStorage.getItem('employee');
    if (employeeData) {
      setEmployee(JSON.parse(employeeData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('employee');
    window.location.href = '/admin/login';
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Productos', href: '/admin/products', icon: Package },
    { name: 'Usuarios', href: '/admin/users', icon: Users },
    { name: 'Empleados', href: '/admin/employees', icon: UserCheck },
    { name: 'Reportes', href: '/admin/reports', icon: BarChart3 },
  ];

  const systemManagement = [
    { name: 'Gestión de Roles', href: '/admin/system/roles', icon: Shield },
    { name: 'Gestión de Departamentos', href: '/admin/system/departments', icon: Building },
    { name: 'Gestión de Empleados', href: '/admin/system/employees', icon: UserCheck },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 text-white flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">TechStore Admin</h2>
            {employee && (
              <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold">
                      {employee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{employee.name}</p>
                    <p className="text-xs text-gray-300">ID: {employee.employeeId}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}

            {/* System Management */}
            <div className="pt-4">
              <button
                onClick={() => setSystemMenuOpen(!systemMenuOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Settings className="h-5 w-5 mr-3" />
                  Gestión del Sistema
                </div>
                {systemMenuOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {systemMenuOpen && (
                <div className="ml-6 mt-2 space-y-1">
                  {systemManagement.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}