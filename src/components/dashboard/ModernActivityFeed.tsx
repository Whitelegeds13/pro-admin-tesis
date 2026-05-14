'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Bell,
  Activity
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'product' | 'user' | 'order' | 'sale' | 'alert' | 'system';
  title: string;
  description: string;
  time: string;
  user: string;
  value?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface ModernActivityFeedProps {
  activities: Activity[];
  loading?: boolean;
  maxItems?: number;
}

export default function ModernActivityFeed({ 
  activities, 
  loading = false, 
  maxItems = 5 
}: ModernActivityFeedProps) {
  const [filter, setFilter] = useState<'all' | 'recent' | 'alerts'>('all');
  const [animatedItems, setAnimatedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Animate items on mount
    activities.slice(0, maxItems).forEach((activity, index) => {
      setTimeout(() => {
        setAnimatedItems(prev => new Set([...prev, activity.id]));
      }, index * 100);
    });
  }, [activities, maxItems]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package className="h-5 w-5" />;
      case 'user': return <Users className="h-5 w-5" />;
      case 'order': return <ShoppingCart className="h-5 w-5" />;
      case 'sale': return <DollarSign className="h-5 w-5" />;
      case 'alert': return <AlertTriangle className="h-5 w-5" />;
      case 'system': return <Activity className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getActivityColor = (type: string, status?: string) => {
    if (status === 'error') return 'text-red-500 bg-red-50 border-red-200';
    if (status === 'warning') return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    if (status === 'success') return 'text-green-500 bg-green-50 border-green-200';
    if (status === 'info') return 'text-blue-500 bg-blue-50 border-blue-200';
    
    switch (type) {
      case 'product': return 'text-purple-500 bg-purple-50 border-purple-200';
      case 'user': return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'order': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'sale': return 'text-green-500 bg-green-50 border-green-200';
      case 'alert': return 'text-red-500 bg-red-50 border-red-200';
      case 'system': return 'text-gray-500 bg-gray-50 border-gray-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'recent') return activity.time.includes('hora') || activity.time.includes('minuto');
    if (filter === 'alerts') return activity.type === 'alert' || activity.status === 'warning' || activity.status === 'error';
    return true;
  }).slice(0, maxItems);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Actividad Reciente</h3>
          <div className="h-6 w-6 bg-gray-300 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="h-10 w-10 bg-gray-300 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Actividad Reciente</h3>
            <p className="text-sm text-gray-600">Últimas acciones del sistema</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">En vivo</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6">
        {[
          { key: 'all', label: 'Todas', count: activities.length },
          { key: 'recent', label: 'Recientes', count: activities.filter(a => a.time.includes('hora') || a.time.includes('minuto')).length },
          { key: 'alerts', label: 'Alertas', count: activities.filter(a => a.type === 'alert' || a.status === 'warning' || a.status === 'error').length }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as 'all' | 'alerts' | 'recent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              filter === tab.key
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Activities */}
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {filteredActivities.map((activity, index) => (
          <div
            key={activity.id}
            className={`
              flex items-start space-x-4 p-4 rounded-xl border transition-all duration-500 ease-out
              ${getActivityColor(activity.type, activity.status)}
              ${animatedItems.has(activity.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              hover:shadow-lg hover:scale-105 cursor-pointer
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className={`
                p-2 rounded-lg border-2 transition-all duration-300
                ${getActivityColor(activity.type, activity.status)}
                group-hover:scale-110
              `}>
                {getActivityIcon(activity.type)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{activity.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{activity.time}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{activity.user}</span>
                    </span>
                  </div>
                </div>

                {/* Value/Status */}
                <div className="flex flex-col items-end space-y-1">
                  {activity.value && (
                    <div className="text-sm font-bold text-green-600">
                      ${activity.value.toLocaleString()}
                    </div>
                  )}
                  
                  {activity.status && (
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${activity.status === 'success' ? 'bg-green-100 text-green-700' :
                        activity.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        activity.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'}
                    `}>
                      {activity.status}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Animated Indicator */}
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <TrendingUp className="h-4 w-4" />
            <span>Actividad en tiempo real</span>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver todas →
          </button>
        </div>
      </div>
    </div>
  );
}
