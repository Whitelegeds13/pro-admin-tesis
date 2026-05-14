'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, MapPin, Phone, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import LandingLayout from '@/components/layout/LandingLayout';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    documentType: 'DNI' as 'DNI' | 'RUC' | 'CE' | 'PASSPORT',
    documentNumber: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    district: '',
    acceptTerms: false
  });
  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }
    
    if (formData.password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    
    if (!formData.acceptTerms) {
      showToast('Debes aceptar los términos y condiciones', 'error');
      return;
    }

    setIsLoading(true);
    
    // Extraer campos que no se envían al servidor (solo se usan para validación)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, acceptTerms, ...registerData } = formData;
    const result = await register(registerData);
    
    setIsLoading(false);
    
    if (result.success) {
      showToast('Registro exitoso. Bienvenido!', 'success');
      router.push('/');
    } else {
      showToast(result.message || 'Error al registrar', 'error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <LandingLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">PG</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Crea tu Cuenta en{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Palacio Gamer
              </span>
            </h1>
            <p className="text-lg text-gray-600">
              Únete a nuestra comunidad y accede a los mejores productos gaming
            </p>
            <p className="mt-4 text-sm text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Inicia sesión aquí
              </Link>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Información Personal</h2>
                  
                  <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Documento *
                      </label>
                      <select
                        id="documentType"
                        name="documentType"
                        required
                        value={formData.documentType}
                        onChange={(e) => setFormData({ ...formData, documentType: e.target.value as 'DNI' | 'RUC' | 'CE' | 'PASSPORT' })}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="DNI">DNI</option>
                        <option value="RUC">RUC</option>
                        <option value="CE">CE</option>
                        <option value="PASSPORT">Pasaporte</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Documento *
                      </label>
                      <input
                        id="documentNumber"
                        name="documentNumber"
                        type="text"
                        required
                        value={formData.documentNumber}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="12345678"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Teléfono *
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="987654321"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="h-4 w-4 inline mr-1" />
                        Correo Electrónico *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="tu@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Seguridad</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        <Lock className="h-4 w-4 inline mr-1" />
                        Contraseña *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Mínimo 6 caracteres"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        <Lock className="h-4 w-4 inline mr-1" />
                        Confirmar Contraseña *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Confirma tu contraseña"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Dirección (Opcional)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        Ciudad
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Lima"
                      />
                    </div>
                    <div>
                      <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                        Distrito
                      </label>
                      <input
                        id="district"
                        name="district"
                        type="text"
                        value={formData.district}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="San Isidro"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección Completa
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Av. Principal 123"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <div className="flex items-start">
                      <input
                        id="acceptTerms"
                        name="acceptTerms"
                        type="checkbox"
                        required
                        checked={formData.acceptTerms}
                        onChange={handleChange}
                        className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="acceptTerms" className="ml-3 block text-sm text-gray-700">
                        Acepto los{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                          términos y condiciones
                        </a>{' '}
                        y la{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                          política de privacidad
                        </a>
                      </label>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Creando cuenta...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Crear Cuenta
                        </>
                      )}
                    </button>
                  </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar con beneficios */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white sticky top-8">
                <h3 className="text-2xl font-bold mb-6">Beneficios de Registrarte</h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold mb-1">Cuenta Segura</h4>
                      <p className="text-sm text-blue-100">Tus datos están protegidos con encriptación avanzada</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold mb-1">Checkout Rápido</h4>
                      <p className="text-sm text-blue-100">Guarda tus datos para compras más rápidas</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold mb-1">Historial de Compras</h4>
                      <p className="text-sm text-blue-100">Accede a todas tus compras anteriores</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold mb-1">Perfil Personalizado</h4>
                      <p className="text-sm text-blue-100">Gestiona tu información y preferencias</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/20">
                  <p className="text-sm text-blue-100 text-center">
                    ¿Ya tienes cuenta?{' '}
                    <Link href="/login" className="font-semibold text-white hover:underline">
                      Inicia sesión
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
}