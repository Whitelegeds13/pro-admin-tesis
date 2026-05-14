'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import BrandForm from '../../../components/admin/BrandForm';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Award,
  ExternalLink
} from 'lucide-react';

interface Brand {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  supplier?: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Supplier {
  _id: string;
  name: string;
  logo?: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSupplier) params.append('supplier', selectedSupplier);

      const response = await fetch(`/api/admin/brands?${params}`);
      const data = await response.json();

      if (data.success) {
        setBrands(data.brands);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setError('Error al cargar las marcas');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedSupplier]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/suppliers');
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSuppliers();
  }, [fetchData, fetchSuppliers]);

  const handleSave = async (brandData: {
    name: string;
    description?: string;
    logo?: string;
    website?: string;
    supplier?: string | {
      _id: string;
      name: string;
    };
  }) => {
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      const url = editingBrand ? `/api/admin/brands/${editingBrand._id}` : '/api/admin/brands';
      const method = editingBrand ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brandData),
      });

      if (response.ok) {
        setSuccess(editingBrand ? 'Marca actualizada exitosamente' : 'Marca creada exitosamente');
        setShowModal(false);
        setEditingBrand(null);
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error submitting brand:', error);
      setError('Error de conexión');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta marca?')) return;

    try {
      const response = await fetch(`/api/admin/brands/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Marca eliminada exitosamente');
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al eliminar la marca');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      setError('Error de conexión');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Marcas</h1>
          <p className="text-gray-600 mt-1">Administra las marcas de tus productos</p>
        </div>
        <button
          onClick={() => {
            setEditingBrand(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nueva Marca
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar marcas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los proveedores</option>
            {suppliers.map(supplier => (
              <option key={supplier._id} value={supplier._id}>
                {supplier.name}
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

      {/* Lista de marcas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando marcas...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Marca</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Proveedor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Productos</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sitio Web</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {brands.map((brand) => (
                  <tr key={brand._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {brand.logo ? (
                            <Image 
                              src={brand.logo} 
                              alt={brand.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Award className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{brand.name}</div>
                          {brand.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {brand.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {brand.supplier ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {brand.supplier.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">Sin proveedor</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-semibold text-gray-900">
                        {brand.productCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {brand.website ? (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Visitar
                        </a>
                      ) : (
                        <span className="text-gray-400">No disponible</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        brand.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {brand.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para crear/editar marca */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBrand ? 'Editar Marca' : 'Nueva Marca'}
              </h2>
            </div>
            
            <div className="p-6">
              <BrandForm
                brand={editingBrand || undefined}
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