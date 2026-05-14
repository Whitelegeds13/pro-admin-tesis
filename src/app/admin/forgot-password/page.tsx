'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, ArrowLeft, CheckCircle, Loader2, Shield } from 'lucide-react';

export default function AdminForgotPasswordPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employeeId.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
      } else {
        setError(data.message || 'Error al procesar la solicitud');
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-500/20 p-4 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">¡Revisa tu correo!</h2>
            <p className="text-blue-200 mb-4">
              Si el ID <strong className="text-white">{employeeId.toUpperCase()}</strong> está registrado,
              recibirás un enlace para restablecer tu contraseña en el correo asociado a tu cuenta.
            </p>
            <p className="text-blue-300/60 text-sm mb-6">
              El enlace expira en 1 hora. Revisa también tu carpeta de spam.
            </p>
            <Link
              href="/admin/login"
              className="inline-flex items-center text-sm text-blue-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">¿Olvidaste tu contraseña?</h2>
          <p className="text-blue-200">
            Ingresa tu ID de empleado y te enviaremos un enlace al correo registrado.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-white mb-2">
                ID de Empleado
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  id="employeeId"
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  className="block w-full pl-10 pr-3 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm uppercase"
                  placeholder="Ej: ADMIN001"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !employeeId.trim()}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar enlace de recuperación'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/admin/login"
              className="inline-flex items-center text-sm text-blue-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-blue-300">🔒 Tu información está protegida</p>
        </div>
      </div>
    </div>
  );
}
