'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Shield, 
  Truck, 
  Headphones, 
  Monitor, 
  Cpu, 
  Gamepad2,
  Zap,
  Award,
  Clock,
  Users,
  ArrowRight,
  Play,
  CheckCircle,
  Sparkles,
  Package,
  ShoppingCart,
  TrendingUp,
  Heart,
  Eye,
  ChevronRight,
  BadgeCheck,
  Rocket,
  Target,
  Gift,
  TrendingDown
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';

interface Product {
  _id: string;
  name: string;
  price: number;
  costPrice?: number;
  images?: string[];
  category?: { _id: string; name: string; image?: string };
  brand?: { _id: string; name: string; logo?: string };
  stock: number;
  createdAt: string;
  tags?: string[];
  description?: string;
  isActive?: boolean;
}

export default function HomePage() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);
  const { dispatch } = useCart();
  const { showToast } = useToast();
  
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [particlePositions, setParticlePositions] = useState<Array<{ left: number; top: number }>>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Generar posiciones de partículas solo en el cliente para evitar hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    // Generar posiciones fijas para las partículas (20 partículas)
    const positions = Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
    }));
    setParticlePositions(positions);
  }, []);

  // Cargar productos destacados con optimización
  useEffect(() => {
    let cancelled = false;
    
    const fetchFeaturedProducts = async () => {
      try {
        setLoadingProducts(true);
        // Usar AbortController para cancelar si el componente se desmonta
        const controller = new AbortController();
        const response = await fetch('/api/admin/products?limit=8&isActive=true', {
          signal: controller.signal,
          // Agregar headers para caché
          headers: {
            'Cache-Control': 'public, max-age=60'
          }
        });
        const data = await response.json();
        
        if (!cancelled && data.success && data.products) {
          // Filtrar productos destacados o tomar los primeros
          const featured = data.products
            .filter((p: Product) => p.isActive && p.stock > 0)
            .slice(0, 8);
          setFeaturedProducts(featured);
        }
      } catch (error) {
        if (!cancelled && error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching featured products:', error);
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    };

    fetchFeaturedProducts();
    
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddToCart = (product: Product) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product._id,
        name: product.name,
        price: product.price,
        originalPrice: product.costPrice,
        image: product.images && product.images.length > 0 ? product.images[0] : '/placeholder-product.svg',
        category: product.category?.name || 'Sin categoría',
        brand: product.brand?.name || 'Sin marca',
        inStock: product.stock > 0,
        discount: product.costPrice && product.price < product.costPrice 
          ? Math.round(((product.costPrice - product.price) / product.costPrice) * 100) 
          : undefined
      }
    });
    
    showToast(`${product.name} agregado al carrito`, 'success');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0
    }).format(price);
  };

  const features = [
    {
      icon: Shield,
      title: 'Garantía Extendida',
      description: 'Todos nuestros productos incluyen garantía extendida de hasta 3 años',
      color: 'from-blue-500 to-cyan-500',
      delay: 0.1
    },
    {
      icon: Truck,
      title: 'Envío Gratis',
      description: 'Envío gratuito en compras superiores a S/ 500',
      color: 'from-green-500 to-emerald-500',
      delay: 0.2
    },
    {
      icon: Headphones,
      title: 'Soporte 24/7',
      description: 'Atención al cliente especializada las 24 horas del día',
      color: 'from-purple-500 to-pink-500',
      delay: 0.3
    },
    {
      icon: Zap,
      title: 'Instalación Express',
      description: 'Configuración y montaje profesional en 24 horas',
      color: 'from-yellow-500 to-orange-500',
      delay: 0.4
    },
    {
      icon: Award,
      title: 'Productos Premium',
      description: 'Solo trabajamos con las mejores marcas del mercado',
      color: 'from-indigo-500 to-purple-500',
      delay: 0.5
    },
    {
      icon: Clock,
      title: 'Entrega Rápida',
      description: 'Recibe tu pedido en máximo 48 horas en Lima',
      color: 'from-red-500 to-rose-500',
      delay: 0.6
    }
  ];

  const categories = [
    {
      icon: Cpu,
      title: 'PCs Gaming',
      description: 'Equipos de alto rendimiento para gaming profesional',
      color: 'from-blue-600 to-purple-600',
      products: '150+ productos',
      href: '/catalogo?category=all'
    },
    {
      icon: Monitor,
      title: 'Monitores',
      description: 'Pantallas gaming de alta frecuencia y resolución',
      color: 'from-green-600 to-teal-600',
      products: '80+ productos',
      href: '/catalogo?category=all'
    },
    {
      icon: Gamepad2,
      title: 'Periféricos',
      description: 'Teclados, ratones y accesorios gaming premium',
      color: 'from-orange-600 to-red-600',
      products: '200+ productos',
      href: '/catalogo?category=all'
    },
    {
      icon: Headphones,
      title: 'Audio Gaming',
      description: 'Auriculares y sistemas de sonido inmersivo',
      color: 'from-purple-600 to-pink-600',
      products: '120+ productos',
      href: '/catalogo?category=all'
    }
  ];

  const testimonials = [
    {
      name: 'Carlos Rodríguez',
      role: 'Streamer Profesional',
      rating: 5,
      comment: 'Excelente servicio y productos de calidad. Mi PC gaming llegó perfectamente configurada y lista para streaming.',
      avatar: 'CR',
      verified: true
    },
    {
      name: 'Ana García',
      role: 'Gamer Competitiva',
      rating: 5,
      comment: 'El mejor lugar para comprar tecnología gaming. Precios competitivos y atención personalizada que supera cualquier expectativa.',
      avatar: 'AG',
      verified: true
    },
    {
      name: 'Miguel Torres',
      role: 'Desarrollador de Juegos',
      rating: 5,
      comment: 'Increíble experiencia de compra. El equipo que compré superó todas mis expectativas y me ha ayudado mucho en mi trabajo.',
      avatar: 'MT',
      verified: true
    },
    {
      name: 'Sofia Martínez',
      role: 'Content Creator',
      rating: 5,
      comment: 'El soporte técnico es excepcional. Me ayudaron a configurar todo mi setup de manera perfecta.',
      avatar: 'SM',
      verified: true
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Clientes Satisfechos', icon: Users },
    { number: '50,000+', label: 'Productos Vendidos', icon: Package },
    { number: '99.9%', label: 'Tiempo de Actividad', icon: TrendingUp },
    { number: '24/7', label: 'Soporte Técnico', icon: Headphones }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { 
      scale: 1.05, 
      y: -10,
      transition: {
        duration: 0.3
      }
    }
  };

  const imageVariants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.15,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <>
      {/* Hero Section - Completamente Renovado */}
      <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden min-h-screen flex items-center">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            {isMounted && particlePositions.map((pos, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{
                  left: `${pos.left}%`,
                  top: `${pos.top}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 3 + (i % 3) * 0.5,
                  repeat: Infinity,
                  delay: (i % 5) * 0.4,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        <motion.div 
          style={{ opacity, scale }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 z-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/20 backdrop-blur-sm"
              >
                <Sparkles className="h-4 w-4 text-yellow-400 mr-2 animate-pulse" />
                <span className="text-sm font-medium">#1 en Tecnología Gaming</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl lg:text-7xl font-bold leading-tight"
              >
                Bienvenido a
                <motion.span
                  className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ['0%', '100%', '0%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    backgroundSize: '200% 200%',
                  }}
                >
                  Palacio Gamer
                </motion.span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-300 leading-relaxed max-w-2xl"
              >
                Descubre la mejor tecnología gaming del mercado. PCs de alto rendimiento, componentes premium y accesorios que llevarán tu experiencia gaming al siguiente nivel.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/catalogo"
                    prefetch={true}
                    className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <span>Explorar Catálogo</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </motion.div>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/servicios"
                    prefetch={true}
                    className="group inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 hover:border-white/50 text-white font-semibold rounded-xl transition-all duration-300 backdrop-blur-sm hover:bg-white/10"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Play className="mr-2 h-5 w-5" />
                    </motion.div>
                    Ver Servicios
                  </Link>
                </motion.div>
              </motion.div>
              
              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8"
              >
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="text-center group"
                    >
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg mb-2 group-hover:bg-white/20 transition-colors">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-2xl lg:text-3xl font-bold text-white">{stat.number}</div>
                      <div className="text-sm text-gray-300">{stat.label}</div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main Card */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-xl border border-white/20 shadow-2xl"
                >
                  <div className="grid grid-cols-2 gap-6">
                    {categories.slice(0, 4).map((category, index) => {
                      const Icon = category.icon;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          className="text-center group cursor-pointer"
                        >
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                            className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center shadow-lg`}
                          >
                            <Icon className="h-8 w-8 text-white" />
                          </motion.div>
                          <h3 className="font-semibold text-white mb-1">{category.title}</h3>
                          <p className="text-sm text-blue-200">Explorar</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
                
                {/* Floating Elements */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg flex items-center justify-center"
                >
                  <Gift className="h-6 w-6 text-white" />
                </motion.div>
                <motion.div
                  animate={{
                    y: [0, 10, 0],
                    rotate: [0, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute -bottom-4 -left-4 w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full shadow-lg flex items-center justify-center"
                >
                  <Rocket className="h-5 w-5 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Productos Destacados - Nueva Sección */}
      {featuredProducts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-200 mb-6">
                <TrendingUp className="h-4 w-4 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-orange-800">Productos Destacados</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Los más
                <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"> vendidos</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Descubre los productos favoritos de nuestra comunidad gaming
              </p>
            </motion.div>

            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-2xl h-96 animate-pulse" />
                ))}
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {featuredProducts.map((product, index) => {
                  const discount = product.costPrice && product.price < product.costPrice 
                    ? Math.round(((product.costPrice - product.price) / product.costPrice) * 100) 
                    : null;
                  const isNew = new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <motion.div
                      key={product._id}
                      variants={itemVariants}
                      initial="rest"
                      whileHover="hover"
                      onHoverStart={() => setHoveredProduct(product._id)}
                      onHoverEnd={() => setHoveredProduct(null)}
                      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
                    >
                      <motion.div 
                        variants={cardHoverVariants}
                        className="relative aspect-square bg-gray-100 overflow-hidden"
                      >
                        <motion.img
                          variants={imageVariants}
                          src={product.images && product.images.length > 0 ? product.images[0] : '/placeholder-product.svg'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-product.svg';
                          }}
                          loading="lazy"
                        />
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-4 left-4 flex flex-col gap-2"
                          >
                            {isNew && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg"
                              >
                                Nuevo
                              </motion.span>
                            )}
                            {discount && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full shadow-lg"
                              >
                                -{discount}%
                              </motion.span>
                            )}
                          </motion.div>
                        </AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ 
                            opacity: hoveredProduct === product._id ? 1 : 0,
                            scale: hoveredProduct === product._id ? 1 : 0.8
                          }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-4 right-4 flex flex-col gap-2"
                        >
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                          >
                            <Heart className="h-4 w-4 text-gray-600" />
                          </motion.button>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Link
                              href={`/catalogo?product=${product._id}`}
                              prefetch={true}
                              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors block"
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </Link>
                          </motion.div>
                        </motion.div>
                      </motion.div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          {product.brand?.name && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="text-xs text-gray-500 font-medium"
                            >
                              {product.brand.name}
                            </motion.span>
                          )}
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center"
                          >
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 ml-1">4.8</span>
                          </motion.div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                              className="text-2xl font-bold text-gray-900"
                            >
                              {formatPrice(product.price)}
                            </motion.span>
                            {product.costPrice && product.costPrice > product.price && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(product.costPrice)}
                              </span>
                            )}
                          </div>
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.stock > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.stock > 0 ? `Stock: ${product.stock}` : 'Agotado'}
                          </motion.span>
                        </div>
                        <motion.button
                          whileHover={{ scale: product.stock > 0 ? 1.02 : 1 }}
                          whileTap={{ scale: product.stock > 0 ? 0.98 : 1 }}
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                            product.stock > 0
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {product.stock > 0 ? 'Agregar al carrito' : 'Agotado'}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center mt-12"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/catalogo"
                  prefetch={true}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Ver todos los productos
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Features Section - Mejorado */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 mb-6">
              <Award className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Servicios Premium</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              ¿Por qué elegir 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Palacio Gamer</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Ofrecemos la mejor experiencia de compra con servicios premium, productos de calidad garantizada y soporte técnico especializado.
            </p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2"></div>
                  <div className="relative p-8 rounded-2xl h-full">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl mb-6 shadow-lg`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">{feature.description}</p>
                    <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Incluido en todos los pedidos</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Categories Section - Mejorado */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 mb-6">
              <Package className="h-4 w-4 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-800">Catálogo Completo</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Nuestras 
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Categorías</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Explora nuestra amplia gama de productos gaming y encuentra exactamente lo que necesitas para tu setup perfecto.
            </p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -12, scale: 1.03 }}
                  className="group"
                >
                  <Link href={category.href} prefetch={true} className="block">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.color} h-56 mb-6 shadow-lg group-hover:shadow-2xl transition-all duration-300`}
                    >
                      <motion.div
                        animate={{
                          backgroundPosition: ['0% 0%', '100% 100%'],
                        }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          ease: 'linear'
                        }}
                        className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center"
                        style={{
                          backgroundImage: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)`,
                          backgroundSize: '200% 200%'
                        }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.3, rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Icon className="h-20 w-20 text-white opacity-90" />
                        </motion.div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="absolute bottom-4 left-4 right-4"
                      >
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-gray-800">{category.products}</span>
                        </div>
                      </motion.div>
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{category.title}</h3>
                    <p className="text-gray-600 mb-4">{category.description}</p>
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center text-purple-600 font-medium group-hover:text-purple-700"
                    >
                      <span className="text-sm">Explorar categoría</span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </motion.div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section - Mejorado */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-200 mb-6">
              <Star className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-yellow-800">Testimonios Reales</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Lo que dicen nuestros 
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent"> clientes</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Miles de gamers y profesionales confían en nosotros para sus necesidades tecnológicas. Conoce sus experiencias.
            </p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -12, scale: 1.03, rotateY: 5 }}
                className="group relative perspective-1000"
              >
                <motion.div
                  whileHover={{ rotateY: 2 }}
                  className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2"
                ></motion.div>
                <div className="relative p-8 rounded-2xl h-full">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex items-center mb-6"
                  >
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mr-4 flex items-center justify-center shadow-lg"
                    >
                      <span className="text-white font-bold text-lg">{testimonial.avatar}</span>
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
                        {testimonial.verified && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <BadgeCheck className="h-4 w-4 text-blue-500" />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{testimonial.role}</p>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="flex items-center"
                      >
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-600 italic leading-relaxed"
                  >
                    &quot;{testimonial.comment}&quot;
                  </motion.p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Mejorado */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <div className="max-w-4xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8"
            >
              <Sparkles className="h-4 w-4 text-yellow-300 mr-2 animate-pulse" />
              <span className="text-sm font-medium">Únete a la Comunidad Gaming</span>
            </motion.div>
            
            <h2 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              ¿Listo para mejorar tu 
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                setup gaming?
              </span>
            </h2>
            
            <p className="text-xl lg:text-2xl mb-12 text-blue-100 leading-relaxed">
              Únete a miles de gamers y profesionales que ya confían en Palacio Gamer para sus necesidades tecnológicas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/registro"
                  className="group inline-flex items-center justify-center px-10 py-5 bg-white text-blue-600 font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 shadow-2xl"
                >
                  <Users className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                  Crear Cuenta Gratis
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/catalogo"
                  className="group inline-flex items-center justify-center px-10 py-5 border-2 border-white/30 hover:border-white/50 text-white font-bold rounded-2xl transition-all duration-300 backdrop-blur-sm hover:bg-white/10"
                >
                  <Package className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                  Ver Catálogo
                </Link>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="group"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-2 group-hover:bg-white/30 transition-colors">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                    <div className="text-blue-200 text-sm">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </section>
    </>
  );
}
