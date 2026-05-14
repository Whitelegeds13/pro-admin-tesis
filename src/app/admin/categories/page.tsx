'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import CategoryForm from '../../../components/admin/CategoryForm';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Tag,
  ChevronRight
} from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  description: string;
  parentCategory?: {
    _id: string;
    name: string;
  };
  image?: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/categories?${params}`);
      const data = await response.json();

      if (data.success) {
        setCategories(data.categories);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (categoryData: {
    name: string;
    description?: string;
    image?: string;
    parentCategory?: string | {
      _id: string;
      name: string;
    };
  }) => {
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory._id}` : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      if (response.ok) {
        setSuccess(editingCategory ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
        setShowModal(false);
        setEditingCategory(null);
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error submitting category:', error);
      setError('Error de conexión');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Categoría eliminada exitosamente');
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al eliminar la categoría');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Error de conexión');
    }
  };

  // Organizar categorías en jerarquía
  const organizedCategories = categories.reduce((acc, category) => {
    if (!category.parentCategory) {
      acc.parents.push(category);
    } else {
      acc.children.push(category);
    }
    return acc;
  }, { parents: [], children: [] } as { parents: Category[], children: Category[] });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Categorías</h1>
          <p className="text-gray-600 mt-1">Administra las categorías de tus productos</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nueva Categoría
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar categorías..."
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

      {/* Lista de categorías */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando categorías...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Categoría</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Categoría Padre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Productos</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {organizedCategories.parents.map((category) => (
                  <React.Fragment key={category._id}>
                    {/* Categoría padre */}
                    <tr className="hover:bg-gray-50 bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {category.image ? (
                              <Image 
                                src={category.image} 
                                alt={category.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Tag className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 flex items-center">
                              <Tag className="h-4 w-4 mr-2 text-blue-600" />
                              {category.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {category.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400">Categoría principal</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-semibold text-gray-900">
                          {category.productCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Subcategorías */}
                    {organizedCategories.children
                      .filter(child => child.parentCategory?._id === category._id)
                      .map((subcategory) => (
                        <tr key={subcategory._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 pl-12">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                {subcategory.image ? (
                                  <Image 
                                    src={subcategory.image} 
                                    alt={subcategory.name}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <Tag className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-700 flex items-center">
                                  <ChevronRight className="h-3 w-3 mr-1 text-gray-400" />
                                  {subcategory.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {subcategory.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {category.name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-lg font-semibold text-gray-900">
                              {subcategory.productCount}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              subcategory.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {subcategory.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEdit(subcategory)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(subcategory._id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para crear/editar categoría */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
            </div>
            
            <div className="p-6">
              <CategoryForm
                category={editingCategory || undefined}
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