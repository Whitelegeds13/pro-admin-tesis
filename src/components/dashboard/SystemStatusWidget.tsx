'use client';

import { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  Shield, 
  Zap, 
  Wifi, 
  HardDrive,
  Cpu,
  MemoryStick,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: React.ComponentType<{ className?: string }>;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export default function SystemStatusWidget() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de métricas del sistema
    setTimeout(() => {
      setMetrics([
        {
          name: 'CPU Usage',
          value: 45,
          status: 'good',
          icon: Cpu,
          unit: '%',
          trend: 'stable'
        },
        {
          name: 'Memory',
          value: 78,
          status: 'warning',
          icon: MemoryStick,
          unit: '%',
          trend: 'up'
        },
        {
          name: 'Disk Space',
          value: 32,
          status: 'excellent',
          icon: HardDrive,
          unit: '%',
          trend: 'down'
        },
        {
          name: 'Network',
          value: 95,
          status: 'excellent',
          icon: Wifi,
          unit: '%',
          trend: 'stable'
        },
        {
          name: 'Database',
          value: 88,
          status: 'good',
          icon: Database,
          unit: '%',
          trend: 'stable'
        },
        {
          name: 'Security',
          value: 100,
          status: 'excellent',
          icon: Shield,
          unit: '%',
          trend: 'stable'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-blue-600 text-white">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Estado del Sistema</h3>
            <p className="text-sm text-gray-600">Métricas en tiempo real</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">En línea</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.name}
              className={`
                p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 cursor-pointer
                ${getStatusColor(metric.status)}
                group-hover:shadow-lg
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(metric.status)}
                  <span className={`text-xs ${
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {metric.trend === 'up' ? '↗' : 
                     metric.trend === 'down' ? '↘' : '→'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {metric.value}{metric.unit}
                </div>
                <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${
                      metric.status === 'excellent' ? 'bg-green-500' :
                      metric.status === 'good' ? 'bg-blue-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${metric.value}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Health Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700">Salud del Sistema</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full" style={{ width: '92%' }}></div>
            </div>
            <span className="text-sm font-bold text-gray-900">92%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
