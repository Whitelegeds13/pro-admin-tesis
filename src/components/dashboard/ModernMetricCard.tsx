'use client';

import { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface ModernMetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan' | 'pink' | 'indigo';
  loading?: boolean;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
  onClick?: () => void;
}

export default function ModernMetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color,
  loading = false,
  trend = 'stable',
  subtitle,
  onClick
}: ModernMetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [animationDelay, setAnimationDelay] = useState(0);

  useEffect(() => {
    setAnimationDelay(Math.random() * 0.5);
  }, []);

  const colorClasses = {
    blue: {
      bg: 'from-blue-500/10 via-blue-600/5 to-blue-700/10',
      border: 'border-blue-200/50',
      icon: 'text-blue-600',
      accent: 'bg-blue-500',
      glow: 'shadow-blue-500/20'
    },
    green: {
      bg: 'from-green-500/10 via-green-600/5 to-green-700/10',
      border: 'border-green-200/50',
      icon: 'text-green-600',
      accent: 'bg-green-500',
      glow: 'shadow-green-500/20'
    },
    purple: {
      bg: 'from-purple-500/10 via-purple-600/5 to-purple-700/10',
      border: 'border-purple-200/50',
      icon: 'text-purple-600',
      accent: 'bg-purple-500',
      glow: 'shadow-purple-500/20'
    },
    orange: {
      bg: 'from-orange-500/10 via-orange-600/5 to-orange-700/10',
      border: 'border-orange-200/50',
      icon: 'text-orange-600',
      accent: 'bg-orange-500',
      glow: 'shadow-orange-500/20'
    },
    red: {
      bg: 'from-red-500/10 via-red-600/5 to-red-700/10',
      border: 'border-red-200/50',
      icon: 'text-red-600',
      accent: 'bg-red-500',
      glow: 'shadow-red-500/20'
    },
    cyan: {
      bg: 'from-cyan-500/10 via-cyan-600/5 to-cyan-700/10',
      border: 'border-cyan-200/50',
      icon: 'text-cyan-600',
      accent: 'bg-cyan-500',
      glow: 'shadow-cyan-500/20'
    },
    pink: {
      bg: 'from-pink-500/10 via-pink-600/5 to-pink-700/10',
      border: 'border-pink-200/50',
      icon: 'text-pink-600',
      accent: 'bg-pink-500',
      glow: 'shadow-pink-500/20'
    },
    indigo: {
      bg: 'from-indigo-500/10 via-indigo-600/5 to-indigo-700/10',
      border: 'border-indigo-200/50',
      icon: 'text-indigo-600',
      accent: 'bg-indigo-500',
      glow: 'shadow-indigo-500/20'
    }
  };

  const colors = colorClasses[color];

  if (loading) {
    return (
      <div className="relative group">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 border border-gray-200/50 backdrop-blur-sm animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-300 rounded-lg"></div>
          </div>
          <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-2`}
      style={{ animationDelay: `${animationDelay}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Glassmorphism Background */}
      <div className={`
        bg-gradient-to-br ${colors.bg} 
        backdrop-blur-xl 
        rounded-2xl 
        p-6 
        border ${colors.border}
        shadow-xl
        transition-all duration-500
        ${isHovered ? `shadow-2xl ${colors.glow}` : 'shadow-lg'}
        ${isHovered ? 'border-opacity-80' : 'border-opacity-50'}
      `}>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className={`
            absolute -top-4 -right-4 w-24 h-24 rounded-full 
            ${colors.accent} opacity-10 
            transition-all duration-700
            ${isHovered ? 'scale-150 rotate-45' : 'scale-100 rotate-0'}
          `}></div>
          <div className={`
            absolute -bottom-2 -left-2 w-16 h-16 rounded-full 
            ${colors.accent} opacity-5 
            transition-all duration-700
            ${isHovered ? 'scale-125 -rotate-12' : 'scale-100 rotate-0'}
          `}></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`
                p-3 rounded-xl 
                ${colors.accent} 
                shadow-lg
                transition-all duration-300
                ${isHovered ? 'scale-110 rotate-6' : 'scale-100 rotate-0'}
              `}>
                <Icon className={`h-6 w-6 text-white ${isHovered ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            
            {/* Trend Indicator */}
            <div className={`
              flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
              transition-all duration-300
              ${trend === 'up' ? 'bg-green-100 text-green-700' : 
                trend === 'down' ? 'bg-red-100 text-red-700' : 
                'bg-gray-100 text-gray-700'}
              ${isHovered ? 'scale-110' : 'scale-100'}
            `}>
              {trend === 'up' && <span>↗</span>}
              {trend === 'down' && <span>↘</span>}
              {trend === 'stable' && <span>→</span>}
            </div>
          </div>

          {/* Value */}
          <div className="mb-3">
            <div className={`
              text-3xl font-bold text-gray-900
              transition-all duration-300
              ${isHovered ? 'scale-105' : 'scale-100'}
            `}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            
            {/* Change Indicator */}
            {change !== undefined && (
              <div className={`
                flex items-center space-x-1 text-sm font-medium mt-1
                ${changeType === 'positive' ? 'text-green-600' : 
                  changeType === 'negative' ? 'text-red-600' : 
                  'text-gray-600'}
                transition-all duration-300
                ${isHovered ? 'translate-x-1' : 'translate-x-0'}
              `}>
                <span className={changeType === 'positive' ? 'text-green-500' : 
                  changeType === 'negative' ? 'text-red-500' : 'text-gray-500'}>
                  {changeType === 'positive' ? '↗' : 
                   changeType === 'negative' ? '↘' : '→'}
                </span>
                <span>{Math.abs(change)}%</span>
                <span className="text-gray-500">vs anterior</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className={`
              h-full ${colors.accent} rounded-full
              transition-all duration-1000 ease-out
              ${isHovered ? 'w-full' : 'w-3/4'}
            `}></div>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className={`
          absolute inset-0 rounded-2xl
          bg-gradient-to-br from-white/20 to-transparent
          opacity-0 transition-opacity duration-300
          ${isHovered ? 'opacity-100' : 'opacity-0'}
          pointer-events-none
        `}></div>
      </div>

      {/* Floating Particles Effect */}
      {isHovered && (
        <>
          <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full animate-ping opacity-75"></div>
          <div className="absolute bottom-4 left-4 w-1 h-1 bg-white rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-0.5 h-0.5 bg-white rounded-full animate-ping opacity-25" style={{ animationDelay: '1s' }}></div>
        </>
      )}
    </div>
  );
}
