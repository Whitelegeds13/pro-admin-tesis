'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import SupplierForm from '../../../components/admin/SupplierForm';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Building2,
  Mail,
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react';

interface Supplier {
  _id: string;
  name: string;
  documentType: 'DNI' | 'RUC' | 'CE' | 'PASSPORT';
  documentNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  contactPerson?: string;
  website?: string;
  logo?: string;
  isActive: boolean;
  totalPurchases: number;
  lastPurchaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/suppliers?${params}`);
      const data = await response.json();

      if (data.success) {
        setSuppliers(data.suppliers);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('Error al cargar los proveedores');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (supplierData: {
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
  }) => {
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      const url = editingSupplier ? `/api/admin/suppliers/${editingSupplier._id}` : '/api/admin/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });

      if (response.ok) {
        setSuccess(editingSupplier ? 'Proveedor actualizado exitosamente' : 'Proveedor creado exitosamente');
        setShowModal(false);
        setEditingSupplier(null);
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error submitting supplier:', error);
      setError('Error de conexión');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este proveedor?')) return;

    try {
      const response = await fetch(`/api/admin/suppliers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Proveedor eliminado exitosamente');
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al eliminar el proveedor');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      setError('Error de conexión');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Proveedores</h1>
          <p className="text-gray-600 mt-1">Administra tus proveedores y sus datos</p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
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

      {/* Lista de proveedores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando proveedores...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Proveedor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contacto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ubicación</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Compras</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {supplier.logo ? (
                            <Image 
                              src={supplier.logo} 
                              alt={supplier.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{supplier.name}</div>
                          <div className="text-sm text-gray-500">
                            {supplier.documentType}: {supplier.documentNumber}
                          </div>
                          {supplier.contactPerson && (
                            <div className="text-sm text-gray-500">
                              Contacto: {supplier.contactPerson}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {supplier.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {supplier.phone}
                        </div>
                        {supplier.website && (
                          <div className="flex items-center text-sm text-blue-600">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            <a
                              href={supplier.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Sitio web
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {supplier.address}
                        </div>
                        <div className="text-sm text-gray-500">
                          {supplier.district}, {supplier.city}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(supplier.totalPurchases)}
                        </div>
                        {supplier.lastPurchaseDate && (
                          <div className="text-sm text-gray-500">
                            Última: {formatDate(supplier.lastPurchaseDate)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        supplier.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {supplier.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier._id)}
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

      {/* Modal para crear/editar proveedor */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
            </div>
            
            <div className="p-6">
              <SupplierForm
                supplier={editingSupplier || undefined}
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