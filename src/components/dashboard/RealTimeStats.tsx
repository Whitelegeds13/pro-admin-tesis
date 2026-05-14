'use client';

import { useState, useEffect } from 'react';
import { Activity, Users, ShoppingCart, DollarSign } from 'lucide-react';

interface RealTimeStatsProps {
  loading?: boolean;
}

export default function RealTimeStats({ loading = false }: RealTimeStatsProps) {
  const [stats, setStats] = useState({
    onlineUsers: 0,
    activeOrders: 0,
    todaySales: 0,
    systemLoad: 0
  });

  useEffect(() => {
    if (loading) return;

    // Simular datos en tiempo real
    const interval = setInterval(() => {
      setStats(() => ({
        onlineUsers: Math.floor(Math.random() * 50) + 20,
        activeOrders: Math.floor(Math.random() * 15) + 5,
        todaySales: Math.floor(Math.random() * 5000) + 2000,
        systemLoad: Math.floor(Math.random() * 30) + 10
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [loading]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas en Tiempo Real</h3>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Estadísticas en Tiempo Real</h3>
        <div className="flex items-center space-x-2 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">En vivo</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-900">{stats.onlineUsers}</p>
          <p className="text-xs text-blue-600">Usuarios en línea</p>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <ShoppingCart className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-900">{stats.activeOrders}</p>
          <p className="text-xs text-green-600">Pedidos activos</p>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-900">${stats.todaySales.toLocaleString()}</p>
          <p className="text-xs text-purple-600">Ventas hoy</p>
        </div>
        
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <Activity className="h-6 w-6 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-orange-900">{stats.systemLoad}%</p>
          <p className="text-xs text-orange-600">Carga del sistema</p>
        </div>
      </div>
    </div>
  );
}
