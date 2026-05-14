'use client';

import { Users, Package, BarChart3, Settings, Download, Upload } from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  href?: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  loading?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'add-product',
    title: 'Agregar Producto',
    description: 'Crear nuevo producto en el catálogo',
    icon: Package,
    color: 'green',
    href: '/admin/products/new'
  },
  {
    id: 'add-user',
    title: 'Nuevo Usuario',
    description: 'Registrar nuevo cliente',
    icon: Users,
    color: 'blue',
    href: '/admin/users/new'
  },
  {
    id: 'view-reports',
    title: 'Ver Reportes',
    description: 'Analizar métricas y estadísticas',
    icon: BarChart3,
    color: 'purple',
    href: '/admin/reports'
  },
  {
    id: 'export-data',
    title: 'Exportar Datos',
    description: 'Descargar información del sistema',
    icon: Download,
    color: 'orange',
    onClick: () => console.log('Export data')
  },
  {
    id: 'import-data',
    title: 'Importar Datos',
    description: 'Cargar información masiva',
    icon: Upload,
    color: 'indigo',
    onClick: () => console.log('Import data')
  },
  {
    id: 'system-settings',
    title: 'Configuración',
    description: 'Ajustar parámetros del sistema',
    icon: Settings,
    color: 'red',
    href: '/admin/settings'
  }
];

const colorClasses = {
  blue: 'text-blue-600 bg-blue-100 hover:bg-blue-200',
  green: 'text-green-600 bg-green-100 hover:bg-green-200',
  purple: 'text-purple-600 bg-purple-100 hover:bg-purple-200',
  orange: 'text-orange-600 bg-orange-100 hover:bg-orange-200',
  red: 'text-red-600 bg-red-100 hover:bg-red-200',
  indigo: 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200'
};

export default function QuickActions({ loading = false }: QuickActionsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Accesos Rápidos</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center p-3 rounded-lg border border-gray-200 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Accesos Rápidos</h3>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 group text-left"
            >
              <div className={`p-2 rounded-lg ${colorClasses[action.color]} group-hover:scale-110 transition-transform duration-200 mr-3`}>
                <IconComponent className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </p>
                <p className="text-xs text-gray-500">
                  {action.description}
                </p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
