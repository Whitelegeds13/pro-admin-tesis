'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Menu, 
  X, 
  ShoppingCart, 
  Search, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut, 
  UserCircle,
  Sparkles,
  Bell,
  Zap
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { state, dispatch } = useCart();
  const { state: authState, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  
  // Transform para el efecto de blur en scroll
  const navbarOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);
  const navbarBlur = useTransform(scrollY, [0, 100], [0, 10]);

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar dropdowns cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLoginDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const navItems = [
    { name: 'Inicio', href: '/', icon: Sparkles },
    { name: 'Catálogo', href: '/catalogo', icon: ShoppingCart },
    { name: 'Servicios', href: '/servicios', icon: Zap },
    { name: 'Soporte', href: '/soporte-tecnico', icon: Bell },
    { name: 'Contacto', href: '/contacto', icon: User },
    { name: 'Acerca de', href: '/acerca-de', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <motion.header
      style={{
        opacity: navbarOpacity,
        backdropFilter: `blur(${navbarBlur}px)`,
      }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-xl border-b border-gray-200/50' 
          : 'bg-white/80 backdrop-blur-md shadow-lg'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 lg:h-20 items-center justify-between">
          {/* Logo con animación */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center"
          >
            <Link href="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="h-10 w-10 lg:h-12 lg:w-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
              >
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-white font-bold text-sm lg:text-base"
                >
                  PG
                </motion.span>
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                Palacio Gamer
              </motion.span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    prefetch={true}
                    className="relative group"
                  >
                    <motion.div
                      whileHover={{ y: -2 }}
                      className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 ${
                        active
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="font-medium text-sm">{item.name}</span>
                    </motion.div>
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Right side buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Search Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
            >
              <Search className="h-5 w-5" />
            </motion.button>
            
            {/* Cart con animación */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link
                href="/carrito"
                prefetch={true}
                className="relative p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
              >
                <ShoppingCart className="h-5 w-5" />
                {state.totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg"
                  >
                    {state.totalItems > 9 ? '9+' : state.totalItems}
                  </motion.span>
                )}
              </Link>
            </motion.div>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              {authState.isAuthenticated && authState.client ? (
                <div className="relative" ref={userMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-xl hover:bg-gray-100 transition-all duration-300"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-2 shadow-lg"
                    >
                      <span className="text-white text-xs font-semibold">
                        {authState.client.name.charAt(0).toUpperCase()}
                      </span>
                    </motion.div>
                    <span className="hidden xl:inline">{authState.client.name.split(' ')[0]}</span>
                    <motion.div
                      animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </motion.div>
                  </motion.button>
                  
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-200/50 backdrop-blur-xl"
                      >
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">{authState.client.name}</p>
                          <p className="text-xs text-gray-500 truncate">{authState.client.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/perfil"
                            prefetch={true}
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <UserCircle className="mr-3 h-4 w-4" />
                            Mi Perfil
                          </Link>
                          <Link
                            href="/mis-compras"
                            prefetch={true}
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <ShoppingCart className="mr-3 h-4 w-4" />
                            Mis Compras
                          </Link>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all duration-300 rounded-lg mx-2"
                          >
                            <LogOut className="mr-3 h-4 w-4" />
                            Cerrar Sesión
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <div className="relative" ref={dropdownRef}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-xl hover:bg-gray-100 transition-all duration-300"
                    >
                      Iniciar Sesión
                      <motion.div
                        animate={{ rotate: isLoginDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </motion.div>
                    </motion.button>
                    
                    <AnimatePresence>
                      {isLoginDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-200/50 backdrop-blur-xl"
                        >
                          <Link
                            href="/login"
                            prefetch={true}
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                            onClick={() => setIsLoginDropdownOpen(false)}
                          >
                            <User className="mr-3 h-4 w-4" />
                            Usuario
                          </Link>
                          <Link
                            href="/admin/login"
                            prefetch={true}
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                            onClick={() => setIsLoginDropdownOpen(false)}
                          >
                            <Settings className="mr-3 h-4 w-4" />
                            Administrador
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/registro"
                      prefetch={true}
                      className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Registrarse
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 hover:text-blue-600 focus:outline-none rounded-lg hover:bg-gray-100 transition-colors"
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="px-4 pt-2 pb-4 space-y-1 bg-white border-t border-gray-200">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        prefetch={true}
                        className={`flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-300 ${
                          active
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </Link>
                    </motion.div>
                  );
                })}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="px-4 py-2 text-sm font-semibold text-gray-500">
                    Cuenta
                  </div>
                  <Link
                    href="/login"
                    prefetch={true}
                    className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="mr-3 h-5 w-5" />
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/registro"
                    prefetch={true}
                    className="flex items-center px-4 py-3 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl mt-2 shadow-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Sparkles className="mr-3 h-5 w-5" />
                    Registrarse
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="hidden lg:block border-t border-gray-200"
            >
              <div className="px-4 py-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
