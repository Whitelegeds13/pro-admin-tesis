'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import ImageUpload from '../ui/ImageUpload';
import { 
  Save, 
  X, 
  Package, 
  DollarSign, 
  Hash, 
  Tag, 
  Weight, 
  Cpu,
  Loader2
} from 'lucide-react';

interface Product {
  _id?: string;
  code?: string;
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
  isActive?: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductFormProps {
  product?: Product;
  onSave: (productData: Product) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface Brand {
  _id: string;
  name: string;
  logo?: string;
}

interface Category {
  _id: string;
  name: string;
  image?: string;
}

export default function ProductForm({ product, onSave, onCancel, loading = false }: ProductFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    brand: '',
    category: '',
    price: '',
    costPrice: '',
    stock: '',
    minStock: '',
    maxStock: '',
    images: '',
    specifications: {},
    tags: '',
    isActive: true,
    isDigital: false,
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    sku: '',
    barcode: ''
  });

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadBrandsAndCategories = useCallback(async () => {
    try {
      const [brandsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/brands'),
        fetch('/api/admin/categories')
      ]);

      const brandsData = await brandsRes.json();
      const categoriesData = await categoriesRes.json();

      if (brandsData.success) {
        setBrands(brandsData.brands);
      }
      if (categoriesData.success) {
        setCategories(categoriesData.categories);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code || '',
        name: product.name || '',
        description: product.description || '',
        brand: typeof product.brand === 'object' ? product.brand._id : product.brand || '',
        category: typeof product.category === 'object' ? product.category._id : product.category || '',
        price: product.price?.toString() || '',
        costPrice: product.costPrice?.toString() || '',
        stock: product.stock?.toString() || '',
        minStock: product.minStock?.toString() || '',
        maxStock: product.maxStock?.toString() || '',
        images: product.images?.join(',') || '',
        specifications: product.specifications || {},
        tags: product.tags?.join(',') || '',
        isActive: product.isActive !== undefined ? product.isActive : true,
        isDigital: product.isDigital || false,
        weight: product.weight?.toString() || '',
        dimensions: {
          length: product.dimensions?.length?.toString() || '',
          width: product.dimensions?.width?.toString() || '',
          height: product.dimensions?.height?.toString() || ''
        },
        sku: product.sku || '',
        barcode: product.barcode || ''
      });
    }
    loadBrandsAndCategories();
  }, [product, loadBrandsAndCategories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('dimensions.')) {
      const dimensionField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionField]: value
        }
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImagesChange = (images: string) => {
    setFormData(prev => ({
      ...prev,
      images
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos requeridos
    if (!formData.code || !formData.name || !formData.brand || !formData.category || !formData.price) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    // Preparar datos para envío
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 0,
      maxStock: formData.maxStock ? parseInt(formData.maxStock) : undefined,
      images: formData.images ? formData.images.split(',').filter(img => img.trim()) : [],
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      dimensions: {
        length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : undefined,
        width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : undefined,
        height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : undefined
      }
    };

    onSave(productData);
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Package className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código del Producto *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: PCG-001"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: PC Gaming RTX 4080"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción detallada del producto..."
            />
          </div>
        </div>
      </div>

      {/* Categorización */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Tag className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Categorización</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca *
            </label>
            <select
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar marca</option>
              {brands.map(brand => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiquetas
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="gaming, pc, rtx, nvidia (separadas por comas)"
            />
          </div>
        </div>
      </div>

      {/* Precios e Inventario */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <DollarSign className="h-5 w-5 text-yellow-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Precios e Inventario</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio de Venta *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio de Costo
            </label>
            <input
              type="number"
              name="costPrice"
              value={formData.costPrice}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Actual *
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Mínimo *
            </label>
            <input
              type="number"
              name="minStock"
              value={formData.minStock}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Máximo
            </label>
            <input
              type="number"
              name="maxStock"
              value={formData.maxStock}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Imágenes */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Package className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Imágenes del Producto</h3>
        </div>
        
        <ImageUpload
          value={formData.images}
          onChange={handleImagesChange}
          type="product"
          label="Imágenes del Producto"
          multiple={true}
          maxImages={5}
        />
      </div>

      {/* Especificaciones físicas */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Weight className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Especificaciones Físicas</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso (kg)
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Dimensiones (cm)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="number"
                  name="dimensions.length"
                  value={formData.dimensions.length}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Largo"
                />
              </div>
              <div>
                <input
                  type="number"
                  name="dimensions.width"
                  value={formData.dimensions.width}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ancho"
                />
              </div>
              <div>
                <input
                  type="number"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Alto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Códigos de identificación */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Hash className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Códigos de Identificación</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="SKU-001"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de Barras
            </label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234567890123"
            />
          </div>
        </div>
      </div>

      {/* Configuración */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Cpu className="h-5 w-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Producto activo
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isDigital"
              checked={formData.isDigital}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Producto digital
            </label>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <X className="h-4 w-4 mr-2 inline" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2 inline" />
          )}
          {product ? 'Actualizar' : 'Crear'} Producto
        </button>
      </div>
    </form>
  );
}
