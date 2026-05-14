'use client';

import { Clock, User, Package, ShoppingCart, TrendingUp, AlertCircle } from 'lucide-react';

interface Activity {
  id: string;
  type: 'user' | 'product' | 'order' | 'sale' | 'alert';
  title: string;
  description: string;
  time: string;
  user?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  loading?: boolean;
}

const activityIcons = {
  user: User,
  product: Package,
  order: ShoppingCart,
  sale: TrendingUp,
  alert: AlertCircle
};

const activityColors = {
  user: 'text-blue-600 bg-blue-100',
  product: 'text-green-600 bg-green-100',
  order: 'text-purple-600 bg-purple-100',
  sale: 'text-orange-600 bg-orange-100',
  alert: 'text-red-600 bg-red-100'
};

export default function ActivityFeed({ activities, loading = false }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todas
        </button>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => {
          const IconComponent = activityIcons[activity.type];
          return (
            <div key={activity.id} className="flex items-start space-x-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <div className={`p-2 rounded-full ${activityColors[activity.type]} group-hover:scale-110 transition-transform duration-200`}>
                <IconComponent className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {activity.description}
                </p>
                {activity.user && (
                  <p className="text-xs text-gray-400 mt-1">
                    por {activity.user}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                <span>{activity.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
