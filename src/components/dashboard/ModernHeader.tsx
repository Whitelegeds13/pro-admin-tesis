'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  Users, 
  Bell, 
  Settings, 
  Search,
  Menu,
  X,
  Sun,
  Moon,
  Zap
} from 'lucide-react';

interface Employee {
  employeeId: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface ModernHeaderProps {
  employee: Employee | null;
  currentTime: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function ModernHeader({ 
  employee, 
  currentTime, 
  onToggleSidebar,
  isSidebarOpen = true 
}: ModernHeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    // Simular notificaciones dinámicas
    const interval = setInterval(() => {
      setNotifications(prev => Math.max(0, prev + (Math.random() > 0.7 ? 1 : 0)));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl overflow-hidden">
        {/* Animated Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full -translate-x-16 -translate-y-16 animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
            >
              {isSidebarOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/80 text-sm font-medium">Sistema Activo</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
              >
                <Search className="h-5 w-5 text-white" />
              </button>
              {isSearchOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white/90 backdrop-blur-xl rounded-xl p-4 shadow-2xl">
                  <input
                    type="text"
                    placeholder="Buscar en el sistema..."
                    className="w-full px-4 py-2 bg-white/50 rounded-lg border-0 focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button className="p-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 relative">
                <Bell className="h-5 w-5 text-white" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {notifications}
                  </span>
                )}
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
            >
              {isDarkMode ? <Sun className="h-5 w-5 text-white" /> : <Moon className="h-5 w-5 text-white" />}
            </button>

            {/* Settings */}
            <button className="p-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300">
              <Settings className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Welcome Message */}
            <div className="mb-4">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 animate-fade-in-up">
                ¡Hola, {employee?.name?.split(' ')[0] || 'Administrador'}! 👋
              </h1>
              <p className="text-white/80 text-lg">
                Bienvenido de vuelta al panel de control
              </p>
            </div>

            {/* Time and Status */}
            <div className="flex flex-wrap items-center gap-6 text-white/90">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span className="font-medium">{currentTime}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span className="font-medium">{employee?.department || 'Administración'}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span className="font-medium">ID: {employee?.employeeId || 'ADMIN001'}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span className="font-medium">Rol: {employee?.role || 'Administrador'}</span>
              </div>
            </div>
          </div>

          {/* User Avatar */}
          <div className="hidden lg:block">
            <div className="relative group">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                <span className="text-3xl font-bold text-white">
                  {employee?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-bounce">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">24/7</div>
            <div className="text-white/80 text-sm">Disponibilidad</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">99.9%</div>
            <div className="text-white/80 text-sm">Uptime</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">256</div>
            <div className="text-white/80 text-sm">Usuarios Activos</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">1.2s</div>
            <div className="text-white/80 text-sm">Tiempo Respuesta</div>
          </div>
        </div>
      </div>
    </div>
  );
}
