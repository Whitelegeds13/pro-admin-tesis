'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import ImageUpload from '../ui/ImageUpload';
import { Save, X, Award, Loader2 } from 'lucide-react';

interface Brand {
  _id?: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  supplier?: string | {
    _id: string;
    name: string;
  };
  isActive?: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface BrandFormProps {
  brand?: Brand;
  onSave: (brandData: Brand) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface Supplier {
  _id: string;
  name: string;
  logo?: string;
}

export default function BrandForm({ brand, onSave, onCancel, loading = false }: BrandFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    website: '',
    supplier: '',
    isActive: true
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadSuppliers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/suppliers');
      const data = await response.json();
      
      if (data.success) {
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      showToast('Error al cargar proveedores', 'error');
    } finally {
      setLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || '',
        description: brand.description || '',
        logo: brand.logo || '',
        website: brand.website || '',
        supplier: typeof brand.supplier === 'object' ? brand.supplier._id : brand.supplier || '',
        isActive: brand.isActive !== undefined ? brand.isActive : true
      });
    }
    loadSuppliers();
  }, [brand, loadSuppliers]);

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

  const handleLogoChange = (logo: string) => {
    setFormData(prev => ({
      ...prev,
      logo
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      showToast('El nombre de la marca es requerido', 'error');
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
          <Award className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Información de la Marca</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Marca *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: NVIDIA"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sitio Web
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://www.ejemplo.com"
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
              placeholder="Descripción de la marca..."
            />
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Award className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Logo de la Marca</h3>
        </div>
        
        <ImageUpload
          value={formData.logo}
          onChange={handleLogoChange}
          type="brand"
          label="Logo de la Marca"
          required={false}
        />
      </div>

      {/* Proveedor */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Award className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Proveedor Asociado</h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proveedor
          </label>
          <select
            name="supplier"
            value={formData.supplier}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccionar proveedor (opcional)</option>
            {suppliers.map(supplier => (
              <option key={supplier._id} value={supplier._id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Configuración */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Award className="h-5 w-5 text-orange-600 mr-2" />
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
            Marca activa
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
          {brand ? 'Actualizar' : 'Crear'} Marca
        </button>
      </div>
    </form>
  );
}
