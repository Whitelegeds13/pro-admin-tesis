'use client';

import { useState } from 'react';
import LandingLayout from '@/components/layout/LandingLayout';
import { useToast } from '@/contexts/ToastContext';

export default function RecoverPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !email.includes('@')) {
      setError('Ingresa un email válido');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/client/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Si el email existe, te enviamos un enlace para restablecerlo');
        showToast('Revisa tu correo para continuar', 'success');
        setEmail('');
      } else {
        setError(data.message || 'Error al solicitar el restablecimiento');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LandingLayout>
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-2">Recuperar contraseña</h1>
        <p className="text-gray-600 mb-6">Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
        {success && <div className="mb-4 text-green-600 font-medium">{success}</div>}
        {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="tu@email.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
      </div>
    </LandingLayout>
  );
}
