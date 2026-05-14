'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingLayout from '../../components/layout/LandingLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { User, Mail, Phone, MapPin, Save, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PerfilPage() {
  const { state: authState, updateClient } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      router.push('/login');
      return;
    }

    if (authState.client) {
      setFormData({
        name: authState.client.name || '',
        phone: authState.client.phone || '',
        email: authState.client.email || '',
        address: authState.client.address || '',
        city: authState.client.city || '',
        district: authState.client.district || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [authState, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const updateData: Record<string, string> = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        district: formData.district
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch('/api/auth/client/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': authState.client!._id
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        updateClient(data.client);
        showToast('Perfil actualizado exitosamente', 'success');
        setIsEditing(false);
        setFormData({
          ...formData,
          password: '',
          confirmPassword: ''
        });
      } else {
        showToast(data.message || 'Error al actualizar el perfil', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (authState.isLoading) {
    return (
      <LandingLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LandingLayout>
    );
  }

  if (!authState.isAuthenticated || !authState.client) {
    return null;
  }

  return (
    <LandingLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Inicio
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
            <p className="text-gray-600 mt-2">Gestiona tu información personal</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-2xl font-semibold">
                    {authState.client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{authState.client.name}</h2>
                  <p className="text-sm text-gray-500">{authState.client.email}</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Editar Perfil
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información Personal */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Documento
                    </label>
                    <input
                      type="text"
                      value={authState.client.documentType}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Documento
                    </label>
                    <input
                      type="text"
                      value={authState.client.documentNumber}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Dirección
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Distrito
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección Completa
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Cambiar Contraseña */}
              {isEditing && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    Cambiar Contraseña
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Dejar vacío para no cambiar"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirmar nueva contraseña"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Estadísticas */}
              {!isEditing && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Compras Totales</p>
                      <p className="text-2xl font-bold text-gray-900">{authState.client.totalPurchases}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Última Compra</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {authState.client.lastPurchaseDate
                          ? new Date(authState.client.lastPurchaseDate).toLocaleDateString('es-PE')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              {isEditing && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      // Resetear formulario
                      if (authState.client) {
                        setFormData({
                          name: authState.client.name || '',
                          phone: authState.client.phone || '',
                          email: authState.client.email || '',
                          address: authState.client.address || '',
                          city: authState.client.city || '',
                          district: authState.client.district || '',
                          password: '',
                          confirmPassword: ''
                        });
                      }
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
}

