'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, AlertCircle, Database } from 'lucide-react';
import { sampleRoles } from '@/utils/seedData';

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const availablePermissions = [
    'read_users',
    'write_users',
    'delete_users',
    'read_products',
    'write_products',
    'delete_products',
    'read_orders',
    'write_orders',
    'delete_orders',
    'read_reports',
    'write_reports',
    'admin_access'
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      } else {
        setError('Error al cargar los roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingRole ? `/api/admin/roles/${editingRole._id}` : '/api/admin/roles';
      const method = editingRole ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(editingRole ? 'Rol actualizado exitosamente' : 'Rol creado exitosamente');
        setShowModal(false);
        setEditingRole(null);
        setFormData({ name: '', description: '', permissions: [], isActive: true });
        fetchRoles();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error submitting role:', error);
      setError('Error de conexión');
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isActive: role.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este rol?')) return;

    try {
      const response = await fetch(`/api/admin/roles/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Rol eliminado exitosamente');
        fetchRoles();
      } else {
        setError('Error al eliminar el rol');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      setError('Error de conexión');
    }
  };

  const handlePermissionChange = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const insertSampleData = async () => {
    if (!confirm('¿Deseas insertar datos de ejemplo? Esto agregará 8 roles de muestra.')) return;

    try {
      setError('');
      setSuccess('');
      
      for (const role of sampleRoles) {
        const response = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(role),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.warn(`Error inserting ${role.name}:`, errorData.message);
        }
      }

      setSuccess('Datos de ejemplo insertados exitosamente');
      fetchRoles();
    } catch (error) {
      console.error('Error inserting sample data:', error);
      setError('Error al insertar datos de ejemplo');
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="text-gray-600">Administra los roles y permisos del sistema</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={insertSampleData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Datos de Ejemplo
          </button>
          <button
            onClick={() => {
              setEditingRole(null);
              setFormData({ name: '', description: '', permissions: [], isActive: true });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Rol
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabla de roles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permisos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoles.map((role) => (
                <tr key={role._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{role.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{role.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permission) => (
                        <span
                          key={permission}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {permission}
                        </span>
                      ))}
                      {role.permissions.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{role.permissions.length - 3} más
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        role.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {role.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(role)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(role._id)}
                        className="text-red-600 hover:text-red-900"
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

        {filteredRoles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron roles</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-6 text-center text-purple-600 border-b border-purple-100 pb-3">
              {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-blue-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                  required
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-green-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500 bg-white"
                  rows={3}
                  required
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-amber-700 mb-3">
                  Permisos
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto bg-white p-3 rounded border-2 border-amber-200">
                  {availablePermissions.map((permission) => (
                    <label key={permission} className="flex items-center hover:bg-amber-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => handlePermissionChange(permission)}
                        className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="ml-2 text-sm font-medium text-indigo-700">Activo</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all font-medium"
                >
                  {editingRole ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}