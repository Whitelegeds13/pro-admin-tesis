'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import ProductForm from '../../../components/admin/ProductForm';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  AlertTriangle,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';

interface Product {
  _id: string;
  code: string;
  name: string;
  description?: string;
  brand: {
    _id: string;
    name: string;
    logo?: string;
  };
  category: {
    _id: string;
    name: string;
    description?: string;
  };
  price: number;
  costPrice?: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  images: string[];
  tags: string[];
  isActive: boolean;
  isDigital: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Brand {
  _id: string;
  name: string;
  logo?: string;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedBrand) params.append('brand', selectedBrand);

      const response = await fetch(`/api/admin/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedBrand]);

  const fetchBrands = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/brands');
      const data = await response.json();
      if (data.success) {
        setBrands(data.brands);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchBrands();
    fetchCategories();
  }, [fetchData, fetchBrands, fetchCategories]);

  const handleSave = async (productData: {
    name: string;
    description?: string;
    price: number;
    costPrice?: number;
    stock: number;
    minStock?: number;
    maxStock?: number;
    brand: string | {
      _id: string;
      name: string;
      logo?: string;
    };
    category: string | {
      _id: string;
      name: string;
      description?: string;
    };
    images?: string[];
    specifications?: Record<string, string>;
    tags?: string[];
    weight?: number;
    dimensions?: { length?: number; width?: number; height?: number };
    sku?: string;
    barcode?: string;
    isDigital?: boolean;
  }) => {
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct._id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        setSuccess(editingProduct ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
        setShowModal(false);
        setEditingProduct(null);
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      setError('Error de conexión');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Producto eliminado exitosamente');
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al eliminar el producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Error de conexión');
    }
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { status: 'out', color: 'text-red-600 bg-red-50', icon: AlertTriangle };
    if (stock <= minStock) return { status: 'low', color: 'text-yellow-600 bg-yellow-50', icon: AlertTriangle };
    return { status: 'good', color: 'text-green-600 bg-green-50', icon: TrendingUp };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="text-gray-600 mt-1">Administra tu catálogo de productos</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las marcas</option>
            {brands.map(brand => (
              <option key={brand._id} value={brand._id}>
                {brand.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchData}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtrar
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Lista de productos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando productos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Producto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Categoría</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Marca</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Precio</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.stock, product.minStock);
                  const StockIcon = stockStatus.icon;
                  
                  return (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {product.images.length > 0 ? (
                              <Image 
                                src={product.images[0]} 
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">Código: {product.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {product.brand.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-semibold text-gray-900">
                          S/ {product.price.toFixed(2)}
                        </div>
                        {product.costPrice && (
                          <div className="text-sm text-gray-500">
                            Costo: S/ {product.costPrice.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold">{product.stock}</span>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            <StockIcon className="h-3 w-3 inline mr-1" />
                            {stockStatus.status === 'out' ? 'Agotado' : 
                             stockStatus.status === 'low' ? 'Bajo' : 'Disponible'}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Mín: {product.minStock}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para crear/editar producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
            </div>
            
            <div className="p-6">
              <ProductForm
                product={editingProduct || undefined}
                onSave={handleSave}
                onCancel={() => setShowModal(false)}
                loading={formLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
