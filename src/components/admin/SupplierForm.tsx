'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import ImageUpload from '../ui/ImageUpload';
import { Save, X, Building2, Loader2 } from 'lucide-react';

interface Supplier {
  _id?: string;
  name: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  contactPerson?: string;
  website?: string;
  logo?: string;
  isActive?: boolean;
}

interface SupplierFormProps {
  supplier?: Supplier;
  onSave: (supplierData: Supplier) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function SupplierForm({ supplier, onSave, onCancel, loading = false }: SupplierFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    documentType: 'RUC' as 'DNI' | 'RUC' | 'CE' | 'PASSPORT',
    documentNumber: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    contactPerson: '',
    website: '',
    logo: '',
    isActive: true
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        documentType: (supplier.documentType as 'DNI' | 'RUC' | 'CE' | 'PASSPORT') || 'RUC',
        documentNumber: supplier.documentNumber || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        city: supplier.city || '',
        district: supplier.district || '',
        contactPerson: supplier.contactPerson || '',
        website: supplier.website || '',
        logo: supplier.logo || '',
        isActive: supplier.isActive !== undefined ? supplier.isActive : true
      });
    }
  }, [supplier]);

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
    
    if (!formData.name || !formData.documentNumber || !formData.phone || !formData.email || !formData.address) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Building2 className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Información del Proveedor</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Proveedor *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Tech Solutions S.A.C."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Documento *
            </label>
            <select
              name="documentType"
              value={formData.documentType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="RUC">RUC</option>
              <option value="DNI">DNI</option>
              <option value="CE">Carné de Extranjería</option>
              <option value="PASSPORT">Pasaporte</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Documento *
            </label>
            <input
              type="text"
              name="documentNumber"
              value={formData.documentNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="12345678901"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+51 999 999 999"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="contacto@proveedor.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Persona de Contacto
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Juan Pérez"
            />
          </div>
        </div>
      </div>

      {/* Dirección */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Building2 className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Dirección</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Av. Principal 123, Oficina 456"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Lima"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distrito *
            </label>
            <input
              type="text"
              name="district"
              value={formData.district}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Miraflores"
              required
            />
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Building2 className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Información Adicional</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="https://www.proveedor.com"
            />
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Building2 className="h-5 w-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Logo del Proveedor</h3>
        </div>
        
        <ImageUpload
          value={formData.logo}
          onChange={handleLogoChange}
          type="supplier"
          label="Logo del Proveedor"
          required={false}
        />
      </div>

      {/* Configuración */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center mb-4">
          <Building2 className="h-5 w-5 text-indigo-600 mr-2" />
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
            Proveedor activo
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
          {supplier ? 'Actualizar' : 'Crear'} Proveedor
        </button>
      </div>
    </form>
  );
}
