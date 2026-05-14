'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import ImageUpload from '../ui/ImageUpload';
import { Save, X, Tag, Loader2 } from 'lucide-react';

interface Category {
  _id?: string;
  name: string;
  description?: string;
  image?: string;
  parentCategory?: string | {
    _id: string;
    name: string;
  };
  isActive?: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryFormProps {
  category?: Category;
  onSave: (categoryData: Category) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function CategoryForm({ category, onSave, onCancel, loading = false }: CategoryFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    parentCategory: '',
    isActive: true
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Error al cargar categorías', 'error');
    } finally {
      setLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        image: category.image || '',
        parentCategory: typeof category.parentCategory === 'object' ? category.parentCategory._id : category.parentCategory || '',
        isActive: category.isActive !== undefined ? category.isActive : true
      });
    }
    loadCategories();
  }, [category, loadCategories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
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

  const handleImageChange = (image: string) => {
    setFormData(prev => ({
      ...prev,
      image
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      showToast('El nombre y descripción son requeridos', 'error');
      return;
    }

    onSave(formData);
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
          <Tag className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Información de la Categoría</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: PCs Gaming"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría Padre
            </label>
            <select
              name="parentCategory"
              value={formData.parentCategory}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sin categoría padre</option>
              {categories
                .filter(cat => !cat.parentCategory)
                .map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción de la categoría..."
              required
            />
          </div>
        </div>
      </div>

      {/* Imagen */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Tag className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Imagen de la Categoría</h3>
        </div>
        
        <ImageUpload
          value={formData.image}
          onChange={handleImageChange}
          type="category"
          label="Imagen de la Categoría"
          required={false}
        />
      </div>

      {/* Configuración */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Tag className="h-5 w-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">
            Categoría activa
          </label>
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
          {category ? 'Actualizar' : 'Crear'} Categoría
        </button>
      </div>
    </form>
  );
}
