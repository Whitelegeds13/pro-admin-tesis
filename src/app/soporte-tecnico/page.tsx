'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingLayout from '@/components/layout/LandingLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface Ticket {
  _id: string;
  code: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

export default function SupportPage() {
  const router = useRouter();
  const { state } = useAuth();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isAuthenticated = !!state.isAuthenticated;
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatTicketId, setChatTicketId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ _id: string; senderType: 'client' | 'admin'; message?: string; imageUrl?: string; imageUrls?: string[]; createdAt: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatImages, setChatImages] = useState<File[]>([]);
  const chatImageInputRef = useRef<HTMLInputElement | null>(null);

  const fetchTickets = async () => {
    if (!state.client) { setLoading(false); return; }
    try {
      const res = await fetch('/api/client/support-tickets', {
        headers: { 'x-client-id': state.client._id }
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets);
        if (!chatTicketId && Array.isArray(data.tickets) && data.tickets.length > 0) {
          setChatTicketId(data.tickets[0]._id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (ticketId?: string) => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    const id = ticketId || tickets[0]?._id;
    if (!id) { setError('No tienes tickets para chatear'); return; }
    setChatTicketId(id);
    setShowChatModal(true);
    await loadMessages(id);
  };

  const loadMessages = async (id: string, silent = false) => {
    if (!state.client) return;
    if (!silent) setChatLoading(true);
    try {
      const res = await fetch(`/api/client/support-tickets/${id}/messages?clientId=${state.client._id}`);
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => {
          const byId = new Set(prev.map(m => m._id));
          const appended = [...prev];
          for (const m of (data.messages || [])) {
            if (!byId.has(m._id)) appended.push(m);
          }
          return appended;
        });
      } else {
        setError(data.message || 'Error al obtener mensajes');
      }
    } finally {
      if (!silent) setChatLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chatTicketId || !state.client) return;
    const text = chatInput.trim();
    if (!text && chatImages.length === 0) return;
    setChatLoading(true);
    try {
      const form = new FormData();
      form.append('clientId', state.client._id);
      if (text) form.append('message', text);
      for (const file of chatImages.slice(0, 10)) form.append('images', file);
      const res = await fetch(`/api/client/support-tickets/${chatTicketId}/messages`, { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) {
        setChatInput('');
        setChatImages([]);
        await loadMessages(chatTicketId, true);
      } else {
        setError(data.message || 'Error al enviar mensaje');
      }
    } finally {
      setChatLoading(false);
    }
  };

  // Actualización automática cada 5 segundos (con ticket seleccionado), esté abierto o cerrado el modal
  useEffect(() => {
    if (!chatTicketId || !state.client?._id) return;
    const intervalId = setInterval(() => {
      loadMessages(chatTicketId, true);
    }, 5000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatTicketId, state.client?._id]);

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.client?._id]);

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!subject || !description) {
      setError('Completa asunto y descripción');
      return;
    }
    try {
      const res = await fetch('/api/client/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: state.client?._id, subject, description, priority })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Ticket creado', 'success');
        setSuccess('Ticket creado');
        setSubject('');
        setDescription('');
        await fetchTickets();
      } else {
        setError(data.message || 'Error al crear ticket');
      }
    } catch {
      setError('Error de conexión');
    }
  };

  const handleCreateClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    setError('');
    setSuccess('');
    if (!subject || !description) { setError('Completa asunto y descripción'); return; }
    try {
      const res = await fetch('/api/client/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: state.client?._id, subject, description, priority })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Ticket creado', 'success');
        setSuccess('Ticket creado');
        setSubject('');
        setDescription('');
        await fetchTickets();
      } else {
        setError(data.message || 'Error al crear ticket');
      }
    } catch {
      setError('Error de conexión');
    }
  };

  return (
    <LandingLayout>
      <div className="max-w-5xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Nuevo ticket</h2>
          {error && <div className="mb-3 text-red-600 font-medium">{error}</div>}
          {success && <div className="mb-3 text-green-600 font-medium">{success}</div>}
          <form onSubmit={createTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={!isAuthenticated}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!isAuthenticated ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
                placeholder="Describe brevemente tu problema"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isAuthenticated}
                className={`w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!isAuthenticated ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
                placeholder="Brinda detalles para ayudarte mejor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                disabled={!isAuthenticated}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!isAuthenticated ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleCreateClick}
              className={`w-full px-4 py-2 rounded-lg text-white ${isAuthenticated ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600/60 cursor-not-allowed'}`}
            >
              Crear ticket
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Mis tickets</h2>
          {loading ? (
            <div className="text-gray-600">Cargando...</div>
          ) : tickets.length === 0 ? (
            <p className="text-gray-600">Aún no tienes tickets</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{t.subject}</div>
                    <span className="text-sm px-2 py-1 rounded-full bg-gray-100">{t.status}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{t.code}</div>
                  <p className="mt-2 text-gray-700">{t.description}</p>
                  <div className="text-xs text-gray-500 mt-2">{new Date(t.createdAt).toLocaleString()}</div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => { setEditing(t); setEditSubject(t.subject); setEditDescription(t.description); setEditPriority(t.priority); }}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg"
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => { const res = await fetch(`/api/client/support-tickets/${t._id}?clientId=${state.client?._id}`, { method: 'DELETE' }); const data = await res.json(); if (res.ok) { showToast('Ticket eliminado', 'success'); fetchTickets(); } else { setError(data.message || 'Error al eliminar'); } }}
                      className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Acción de chat debajo de Mis tickets */}
        <div className="mt-4">
          <button
            onClick={() => openChat()}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Chat Soporte técnico
          </button>
        </div>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Editar ticket {editing.code}</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
            <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full px-4 py-2 border rounded-lg mb-3" />
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full h-28 px-4 py-2 border rounded-lg mb-3" />
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')} className="w-full px-4 py-2 border rounded-lg mb-6">
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button
                onClick={async () => {
                  const res = await fetch(`/api/client/support-tickets/${editing._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId: state.client?._id, subject: editSubject, description: editDescription, priority: editPriority })
                  });
                  const data = await res.json();
                  if (res.ok) { showToast('Ticket actualizado', 'success'); setEditing(null); fetchTickets(); } else { setError(data.message || 'Error al actualizar'); }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Necesitas una cuenta</h3>
            <p className="text-gray-700 mb-4">Para usar esta función es necesario registrarse o iniciar sesión.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/registro?redirect=/soporte-tecnico')}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Registrarse
              </button>
              <button
                onClick={() => router.push('/login?redirect=/soporte-tecnico')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Iniciar sesión
              </button>
            </div>
            <button
              onClick={() => setShowAuthModal(false)}
              className="mt-4 w-full px-4 py-2 border rounded-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {showChatModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chat con Soporte</h3>
              <button onClick={() => setShowChatModal(false)} className="text-gray-600">Cerrar</button>
            </div>
            <div className="mb-3">
              <label className="text-sm text-gray-600">Ticket</label>
              <select
                value={chatTicketId || ''}
                onChange={async (e) => { setChatTicketId(e.target.value); await loadMessages(e.target.value); }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="" disabled>Selecciona un ticket</option>
                {tickets.map(t => (
                  <option key={t._id} value={t._id}>{t.code} - {t.subject}</option>
                ))}
              </select>
            </div>
            <div className="h-64 border rounded-lg p-3 overflow-y-auto bg-gray-50">
              {chatLoading ? (
                <div>Cargando mensajes...</div>
              ) : chatMessages.length === 0 ? (
                <div className="text-gray-600">No hay mensajes aún</div>
              ) : (
                chatMessages.map(m => (
                  <div key={m._id} className={`mb-2 flex ${m.senderType === 'client' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-3 py-2 rounded-lg max-w-[75%] ${m.senderType === 'client' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>
                      {m.imageUrls && m.imageUrls.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {m.imageUrls.map((url, i) => (
                            <img key={i} src={url} alt={`imagen-${i}`} className="max-h-40 w-full object-cover rounded" />
                          ))}
                        </div>
                      ) : m.imageUrl ? (
                        <img src={m.imageUrl} alt="imagen" className={`max-h-48 rounded ${m.senderType === 'client' ? 'border-white/20' : 'border-gray-200'} mb-2`} />
                      ) : null}
                      {m.message ? (
                        <div className="text-sm">{m.message}</div>
                      ) : null}
                      <div className="text-xs opacity-70 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 sticky bottom-0 bg-white pt-2">
              <div className="flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <input
                  ref={chatImageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setChatImages(Array.from(e.target.files || []))}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => chatImageInputRef.current?.click()}
                  className="px-3 py-2 border rounded-lg text-sm"
                >Adjuntar</button>
                <button onClick={sendMessage} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">Enviar</button>
              </div>
              {chatImages.length > 0 ? (
                <div className="mt-1 text-xs text-gray-600 truncate">Imágenes: {chatImages.length} seleccionadas (máx. 10)</div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </LandingLayout>
  );
}
