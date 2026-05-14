'use client';

import React, { useState, useEffect, useMemo } from 'react';
import LandingLayout from '../../components/layout/LandingLayout';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import ProductSkeleton from '../../components/ui/ProductSkeleton';
import SidebarSkeleton from '../../components/ui/SidebarSkeleton';
import { 
  Search, 
  Grid, 
  List, 
  Star, 
  ShoppingCart, 
  Heart,
  Eye,
  Package,
  Zap,
  Award,
  Truck,
  Shield,
  Filter,
  X,
  Tag,
  Building2
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  category: {
    _id: string;
    name: string;
    image?: string;
  };
  brand: {
    _id: string;
    name: string;
    logo?: string;
  };
  inStock: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  discount?: number;
  description?: string;
  stock: number;
  sku?: string;
  tags?: string[];
}


export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { dispatch } = useCart();
  const { showToast } = useToast();

  // Cargar datos reales únicamente
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);
        setInitialLoad(true);
        
        // Cargar productos, categorías y marcas en paralelo
        const productsRes = await fetch('/api/admin/products?limit=100');
        const productsData = await productsRes.json();
        
        // Procesar productos reales
        if (productsData.success) {
          const apiProducts: Product[] = productsData.products.map((product: {
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
            sku?: string;
          }) => ({
            id: product._id,
            name: product.name,
            price: product.price,
            originalPrice: product.costPrice,
            image: product.images && product.images.length > 0 ? product.images[0] : '/placeholder-product.svg',
            rating: 4.2 + Math.random() * 0.8, // Rating entre 4.2 y 5.0
            reviews: Math.floor(Math.random() * 200) + 10,
            category: {
              _id: product.category?._id || '',
              name: product.category?.name || 'Sin categoría',
              image: product.category?.image
            },
            brand: {
              _id: product.brand?._id || '',
              name: product.brand?.name || 'Sin marca',
              logo: product.brand?.logo
            },
            inStock: product.stock > 0,
            isNew: new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            isFeatured: product.tags?.includes('destacado') || false,
            discount: product.costPrice && product.price > product.costPrice 
              ? Math.round(((product.price - product.costPrice) / product.price) * 100) 
              : undefined,
            description: product.description,
            stock: product.stock,
            sku: product.sku,
            tags: product.tags || []
          }));
          
          setProducts(apiProducts);
        } else {
          setProducts([]);
        }

        // Procesar categorías y marcas (no necesitamos estado para estos)
        // Solo procesamos los productos que es lo que necesitamos mostrar
        
      } catch (error) {
        console.error('Error fetching real data:', error);
        setProducts([]);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchRealData();
  }, []);

  // Calcular categorías dinámicas
  const categoryOptions = useMemo(() => {
    const categoryMap = new Map();
    products.forEach(product => {
      const categoryId = product.category._id;
      if (categoryId) {
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            _id: categoryId,
            name: product.category.name,
            image: product.category.image,
            count: 0
          });
        }
        categoryMap.get(categoryId).count++;
      }
    });
    
    return [
      { _id: 'all', name: 'Todas las categorías', count: products.length },
      ...Array.from(categoryMap.values())
    ];
  }, [products]);

  // Calcular marcas dinámicas
  const brandOptions = useMemo(() => {
    const brandMap = new Map();
    products.forEach(product => {
      const brandId = product.brand._id;
      if (brandId) {
        if (!brandMap.has(brandId)) {
          brandMap.set(brandId, {
            _id: brandId,
            name: product.brand.name,
            logo: product.brand.logo,
            count: 0
          });
        }
        brandMap.get(brandId).count++;
      }
    });
    
    return [
      { _id: 'all', name: 'Todas las marcas', count: products.length },
      ...Array.from(brandMap.values())
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category._id === selectedCategory;
      const matchesBrand = selectedBrand === 'all' || product.brand._id === selectedBrand;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
    });
  }, [products, searchTerm, selectedCategory, selectedBrand, priceRange]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return b.isNew ? 1 : -1;
        default:
          return b.isFeatured ? 1 : -1;
      }
    });
  }, [filteredProducts, sortBy]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = (product: Product) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        category: product.category.name,
        brand: product.brand.name,
        inStock: product.inStock,
        discount: product.discount
      }
    });
    
    // Mostrar notificación de éxito
    showToast(`${product.name} agregado al carrito`, 'success');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setPriceRange([0, 10000000]);
  };


  return (
    <LandingLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Catálogo de 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Productos</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Descubre nuestra amplia gama de productos gaming y tecnología. Encuentra exactamente lo que necesitas para tu setup perfecto.
              </p>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Desktop */}
          <div className="hidden lg:block lg:w-80 space-y-6">
            {loading ? (
              <SidebarSkeleton />
            ) : (
              <>
            {/* Search */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Buscar</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorías</h3>
              <div className="space-y-2">
                {categoryOptions.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => setSelectedCategory(category._id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      selectedCategory === category._id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-5 h-5 mr-3 rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Tag className="h-5 w-5 mr-3 text-gray-400" />
                      )}
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">({category.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Marcas</h3>
              <div className="space-y-2">
                {brandOptions.map((brand) => (
                  <button
                    key={brand._id}
                    onClick={() => setSelectedBrand(brand._id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      selectedBrand === brand._id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-5 h-5 mr-3 rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Building2 className="h-5 w-5 mr-3 text-gray-400" />
                      )}
                      <span className="font-medium">{brand.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">({brand.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rango de Precio</h3>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="10000000"
                  step="100000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Características</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Zap className="h-5 w-5 text-yellow-500 mr-3" />
                  <span className="text-sm text-gray-700">Envío Gratis</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">Garantía Extendida</span>
                </div>
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-blue-500 mr-3" />
                  <span className="text-sm text-gray-700">Entrega Rápida</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-purple-500 mr-3" />
                  <span className="text-sm text-gray-700">Productos Premium</span>
                </div>
              </div>
            </div>
              </>
            )}
          </div>

          {/* Sidebar Mobile */}
          {showMobileFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-end">
              <div className="bg-white w-80 h-full overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Filtros</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Search */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Buscar</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorías</h3>
                    <div className="space-y-2">
                      {categoryOptions.map((category) => (
                        <button
                          key={category._id}
                          onClick={() => setSelectedCategory(category._id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                            selectedCategory === category._id
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center">
                            {category.image ? (
                              <img
                                src={category.image}
                                alt={category.name}
                                className="w-5 h-5 mr-3 rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Tag className="h-5 w-5 mr-3 text-gray-400" />
                            )}
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">({category.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brands */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Marcas</h3>
                    <div className="space-y-2">
                      {brandOptions.map((brand) => (
                        <button
                          key={brand._id}
                          onClick={() => setSelectedBrand(brand._id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                            selectedBrand === brand._id
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center">
                            {brand.logo ? (
                              <img
                                src={brand.logo}
                                alt={brand.name}
                                className="w-5 h-5 mr-3 rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Building2 className="h-5 w-5 mr-3 text-gray-400" />
                            )}
                            <span className="font-medium">{brand.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">({brand.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Rango de Precio</h3>
                    <div className="space-y-4">
                      <input
                        type="range"
                        min="0"
                        max="10000000"
                        step="100000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{formatPrice(priceRange[0])}</span>
                        <span>{formatPrice(priceRange[1])}</span>
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    {sortedProducts.length} productos encontrados
                  </span>
                  {/* Botón de filtros móviles */}
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50"
                  >
                    <Filter className="h-4 w-4" />
                    Filtros
                  </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="featured">Destacados</option>
                    <option value="newest">Más Nuevos</option>
                    <option value="price-low">Precio: Menor a Mayor</option>
                    <option value="price-high">Precio: Mayor a Menor</option>
                    <option value="rating">Mejor Valorados</option>
                  </select>
                  
                  <div className="flex border border-gray-300 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <ProductSkeleton key={index} viewMode={viewMode} />
                ))}
              </div>
            ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {sortedProducts.map((product) => (
                <div key={product.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <div className="aspect-w-16 aspect-h-12 bg-gray-200 relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.svg';
                        }}
                      />
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {product.isNew && (
                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                          Nuevo
                        </span>
                      )}
                      {product.discount && (
                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                          -{product.discount}%
                        </span>
                      )}
                      {product.isFeatured && (
                        <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                          Destacado
                        </span>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                        <Heart className="h-4 w-4 text-gray-600" />
                      </button>
                      <button className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                        <Eye className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {product.brand.logo ? (
                          <img
                            src={product.brand.logo}
                            alt={product.brand.name}
                            className="w-4 h-4 mr-2 rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span className="text-sm text-gray-500">{product.brand.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{product.rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-400 ml-1">({product.reviews})</span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    {/* Categoría */}
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {product.category.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.inStock 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inStock ? `Stock: ${product.stock}` : 'Agotado'}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.inStock}
                        className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-colors ${
                          product.inStock
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.inStock ? 'Agregar' : 'Agotado'}
                      </button>
                      <button className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}

            {/* No Results */}
            {!loading && !initialLoad && sortedProducts.length === 0 && (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <Package className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    {products.length === 0 ? 'No hay productos disponibles' : 'No se encontraron productos'}
                  </h3>
                  <p className="text-gray-600 mb-8">
                    {products.length === 0 
                      ? 'Actualmente no hay productos en el catálogo. Vuelve pronto para ver nuestros productos.' 
                      : 'Intenta ajustar tus filtros de búsqueda para encontrar lo que buscas.'
                    }
                  </p>
                  {products.length > 0 && (
                <button
                      onClick={clearFilters}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Limpiar Filtros
                </button>
                  )}
                  {products.length === 0 && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">
                        ¿Eres administrador? Ve al panel de administración para agregar productos.
                      </p>
                      <a
                        href="/admin/products"
                        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Ir al Panel de Administración
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </LandingLayout>
  );
}
