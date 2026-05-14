'use client';

import { useEffect, useState } from 'react';
import LandingLayout from '@/components/layout/LandingLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface ItemForm { name: string; price: string; quantity: string; product?: string }
interface Quotation { _id: string; code: string; total: number; status: string; createdAt: string }

export default function QuotationsPage() {
  const { state } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<ItemForm[]>([{ name: '', price: '', quantity: '1' }]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [currency, setCurrency] = useState<'PEN' | 'USD' | 'EUR'>('PEN');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtotal = items.reduce((sum, it) => sum + ((parseFloat(it.price) || 0) * (parseInt(it.quantity) || 0)), 0);
  const igv = +(subtotal * 0.18).toFixed(2);
  const total = +(subtotal + igv).toFixed(2);

  const fetchQuotations = async () => {
    if (!state.client) return;
    const res = await fetch(`/api/client/quotations?clientId=${state.client._id}`);
    const data = await res.json();
    if (res.ok) setQuotations(data.quotations);
  };

  useEffect(() => {
    fetchQuotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.client?._id]);

  const updateItem = (index: number, field: keyof ItemForm, value: string) => {
    const next = [...items];
    next[index][field] = value;
    setItems(next);
  };

  const addItem = () => setItems([...items, { name: '', price: '', quantity: '1' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const createQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!state.client) {
      setError('Debes iniciar sesión');
      return;
    }
    const validItems = items.filter(it => it.name && parseFloat(it.price) > 0 && parseInt(it.quantity) > 0);
    if (validItems.length === 0) {
      setError('Agrega al menos un ítem válido');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        clientId: state.client._id,
        items: validItems.map(it => ({ name: it.name, price: parseFloat(it.price), quantity: parseInt(it.quantity) })),
        currency,
        notes
      };
      const res = await fetch('/api/client/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Cotización creada', 'success');
        setItems([{ name: '', price: '', quantity: '1' }]);
        setNotes('');
        setCurrency('PEN');
        await fetchQuotations();
      } else {
        setError(data.message || 'Error al crear cotización');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LandingLayout>
      <div className="max-w-6xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Nueva cotización</h2>
          {error && <div className="mb-3 text-red-600 font-medium">{error}</div>}
          <form onSubmit={createQuotation} className="space-y-4">
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-3">
                <input
                  value={it.name}
                  onChange={(e) => updateItem(idx, 'name', e.target.value)}
                  placeholder="Producto o servicio"
                  className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={it.price}
                  onChange={(e) => updateItem(idx, 'price', e.target.value)}
                  placeholder="Precio"
                  className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  min="1"
                  value={it.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  placeholder="Cantidad"
                  className="col-span-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="col-span-6 flex justify-end">
                  <button type="button" onClick={() => removeItem(idx)} className="text-red-600 text-sm">Eliminar</button>
                </div>
              </div>
            ))}
            <div className="flex justify-between">
              <button type="button" onClick={addItem} className="text-blue-600">Agregar ítem</button>
              <div className="text-sm text-gray-700">Subtotal: S/ {subtotal.toFixed(2)} | IGV: S/ {igv.toFixed(2)} | Total: S/ {total.toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={currency} onChange={(e) => setCurrency(e.target.value as 'PEN' | 'USD' | 'EUR')} className="px-4 py-2 border border-gray-300 rounded-lg">
                <option value="PEN">S/ Sol</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas" className="px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Crear cotización'}
            </button>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Mis cotizaciones</h2>
          <div className="space-y-3">
            {quotations.length === 0 && <p className="text-gray-600">Aún no tienes cotizaciones</p>}
            {quotations.map(q => (
              <div key={q._id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{q.code}</div>
                  <div className="text-sm text-gray-600">{new Date(q.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">S/ {q.total.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">{q.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LandingLayout>
  );
}
