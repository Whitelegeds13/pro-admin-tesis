'use client';

import { useEffect, useRef, useState } from 'react';

interface Ticket {
  _id: string;
  code: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  client?: { _id: string; name: string; email: string } | null;
}

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [newStatus, setNewStatus] = useState<Ticket['status']>('OPEN');
  const [editSubject, setEditSubject] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Ticket['priority']>('MEDIUM');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatTicketId, setChatTicketId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ _id: string; senderType: 'client' | 'admin'; message?: string; imageUrl?: string; imageUrls?: string[]; createdAt: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatImages, setChatImages] = useState<File[]>([]);
  const chatImageInputRef = useRef<HTMLInputElement | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    const url = statusFilter ? `/api/admin/support-tickets?status=${statusFilter}` : '/api/admin/support-tickets';
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok) setTickets(data.tickets);
    if (!chatTicketId && Array.isArray(data.tickets) && data.tickets.length > 0) {
      setChatTicketId(data.tickets[0]._id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const viewClient = async (clientId?: string) => {
    if (!clientId) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`);
      const data = await res.json();
      if (res.ok) {
        setClientDetails(data.client);
        setShowClientModal(true);
      } else {
        setError(data.message || 'No se pudo obtener el cliente');
      }
    } catch {
      setError('Error de conexión al cargar el cliente');
    }
  };

  const openChat = async (ticketId: string) => {
    setChatTicketId(ticketId);
    setShowChatModal(true);
    await loadMessages(ticketId);
  };

  const loadMessages = async (id: string, silent = false) => {
    if (!silent) setChatLoading(true);
    try {
      const res = await fetch(`/api/admin/support-tickets/${id}/messages`);
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
      }
    } finally {
      if (!silent) setChatLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chatTicketId) return;
    const text = chatInput.trim();
    if (!text && chatImages.length === 0) return;
    setChatLoading(true);
    try {
      const form = new FormData();
      if (text) form.append('message', text);
      for (const file of chatImages.slice(0, 10)) form.append('images', file);
      const res = await fetch(`/api/admin/support-tickets/${chatTicketId}/messages`, { method: 'POST', body: form });
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

  // Polling automático cada 5s mientras haya un ticket seleccionado
  useEffect(() => {
    if (!chatTicketId) return;
    const intervalId = setInterval(() => {
      loadMessages(chatTicketId, true);
    }, 5000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatTicketId]);

  const updateTicket = async () => {
    if (!selected) return;
    setError('');
    setSuccess('');
    const res = await fetch(`/api/admin/support-tickets/${selected._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, subject: editSubject, description: editDescription, priority: editPriority })
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess('Ticket actualizado');
      setSelected(null);
      fetchTickets();
    } else {
      setError(data.message || 'Error');
    }
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tickets de Soporte</h1>
            <p className="text-gray-600 mt-1">Gestiona los tickets de clientes</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
              <option value="">Todos</option>
              <option value="OPEN">Abiertos</option>
              <option value="IN_PROGRESS">En progreso</option>
              <option value="RESOLVED">Resueltos</option>
              <option value="CLOSED">Cerrados</option>
            </select>
          </div>
        </div>

        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-6">Cargando...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asunto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{t.subject}</td>
                    <td className="px-6 py-4 text-sm">
                      {t.client ? (
                        <button className="text-blue-600 hover:underline" onClick={() => viewClient(t.client?._id)}>
                          {t.client.name}
                        </button>
                      ) : (
                        <span className="text-gray-700">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4"><span className="text-xs bg-gray-100 rounded-full px-2 py-1">{t.status}</span></td>
                    <td className="px-6 py-4">
                      <button onClick={() => { setSelected(t); setNewStatus(t.status); setEditSubject(t.subject); setEditDescription(t.description); setEditPriority(t.priority); }} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">Editar</button>
                      <button onClick={() => openChat(t._id)} className="ml-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg">Chat</button>
                      <button onClick={async () => { setError(''); setSuccess(''); const res = await fetch(`/api/admin/support-tickets/${t._id}`, { method: 'DELETE' }); const data = await res.json(); if (res.ok) { setSuccess('Ticket eliminado'); fetchTickets(); } else { setError(data.message || 'Error al eliminar'); } }} className="ml-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Actualizar ticket {selected.code}</h3>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED')} className="w-full px-4 py-2 border rounded-lg mb-4">
                <option value="OPEN">Abierto</option>
                <option value="IN_PROGRESS">En progreso</option>
                <option value="RESOLVED">Resuelto</option>
                <option value="CLOSED">Cerrado</option>
              </select>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
              <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full px-4 py-2 border rounded-lg mb-4" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full h-28 px-4 py-2 border rounded-lg mb-4" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')} className="w-full px-4 py-2 border rounded-lg mb-6">
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
              </select>
              <div className="flex justify-end gap-3">
                <button onClick={() => setSelected(null)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button onClick={updateTicket} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {showClientModal && clientDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Información del Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium">{clientDetails.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{clientDetails.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{clientDetails.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Documento</p>
                  <p className="font-medium">{clientDetails.documentType} - {clientDetails.documentNumber}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium">{clientDetails.address || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ciudad</p>
                  <p className="font-medium">{clientDetails.city || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Distrito</p>
                  <p className="font-medium">{clientDetails.district || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <p className="font-medium">{clientDetails.isActive ? 'Activo' : 'Inactivo'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registrado</p>
                  <p className="font-medium">{new Date(clientDetails.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowClientModal(false)} className="px-4 py-2 border rounded-lg">Cerrar</button>
                <a href={`/admin/clients?search=${encodeURIComponent(clientDetails.documentNumber || clientDetails.email || clientDetails.name)}`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Ver en Clientes</a>
              </div>
            </div>
          </div>
        )}

        {showChatModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Chat con Cliente</h3>
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
                    <div key={m._id} className={`mb-2 flex ${m.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-3 py-2 rounded-lg max-w-[75%] ${m.senderType === 'admin' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>
                        {m.imageUrls && m.imageUrls.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            {m.imageUrls.map((url, i) => (
                              <img key={i} src={url} alt={`imagen-${i}`} className="max-h-40 w-full object-cover rounded" />
                            ))}
                          </div>
                        ) : m.imageUrl ? (
                          <img src={m.imageUrl} alt="imagen" className={`max-h-48 rounded ${m.senderType === 'admin' ? 'border-white/20' : 'border-gray-200'} mb-2`} />
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
      </div>
  );
}
