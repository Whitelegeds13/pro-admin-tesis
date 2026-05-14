'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Search, PlusCircle } from 'lucide-react'

interface OrderItem { product: { _id: string; name: string; code?: string; price: number }; quantity: number; unitPrice: number; subtotal: number }
interface Order { _id: string; saleNumber: string; status: string; issueDate: string; client: { _id: string; name: string; documentNumber?: string }; total: number }
interface Product { _id: string; name: string; code?: string; price: number; stock: number }
interface Client { _id: string; name: string; documentNumber?: string }

export default function AdminSalesOnlinePage() {
  const [tab, setTab] = useState<'normal'|'manual'>('normal')
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n)

  const filteredOrders = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return orders
    return orders.filter(o =>
      o.saleNumber.toLowerCase().includes(s) ||
      o.client.name.toLowerCase().includes(s) ||
      (o.client.documentNumber || '').toLowerCase().includes(s)
    )
  }, [orders, search])

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true)
      try {
        const res = await fetch('/api/admin/orders?status=PAGADO')
        const data = await res.json()
        if (res.ok && data.success) {
          setOrders(data.orders || [])
        } else {
          setOrders([])
        }
      } finally {
        setLoadingOrders(false)
      }
    }

    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/admin/products')
        const data = await res.json()
        if (res.ok && data.success) setProducts(data.products || [])
      } catch {}
    }

    const fetchClients = async () => {
      try {
        const res = await fetch('/api/admin/clients')
        const data = await res.json()
        if (res.ok && data.success) setClients(data.clients || [])
      } catch {}
    }

    fetchOrders(); fetchProducts(); fetchClients()
  }, [])

  const completeSale = async (id: string) => {
    setCreating(true)
    try {
      const employee = JSON.parse(localStorage.getItem('employee') || '{}')
      const res = await fetch(`/api/admin/sales/${id}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: employee?._id || employee?.id }) })
      let data: { success?: boolean } | null = null
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        data = await res.json()
      }
      if (res.ok && (data && data.success)) {
        setOrders(prev => prev.filter(o => o._id !== id))
      } else {
        console.error('Completar venta falló', data)
      }
    } finally {
      setCreating(false)
    }
  }

  // Manual
  const [form, setForm] = useState({ client: '', receiptType: 'Boleta', series: 'B001', receiptNumber: '', paymentMethod: 'Tarjeta', items: [] as Array<{ product: string; quantity: number; priceAtSale: number }> })
  const [currentItem, setCurrentItem] = useState<{ product: string; quantity: number; priceAtSale: number }>({ product: '', quantity: 1, priceAtSale: 0 })

  const addItem = () => {
    if (!currentItem.product || currentItem.quantity <= 0) return
    setForm({ ...form, items: [...form.items, currentItem] })
    setCurrentItem({ product: '', quantity: 1, priceAtSale: 0 })
  }

  const removeItem = (idx: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
  }

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((s, it) => s + it.quantity * it.priceAtSale, 0)
    const igv = subtotal * 0.18
    const total = subtotal + igv
    return { subtotal, igv, total }
  }, [form.items])

  const submitManual = async () => {
    if (!form.client || !form.receiptNumber || form.items.length === 0) return
    setCreating(true)
    try {
      const employee = JSON.parse(localStorage.getItem('employee') || '{}')
      const res = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: form.client,
          worker: employee?._id || employee?.id,
          receiptType: form.receiptType,
          receiptNumber: form.receiptNumber,
          series: form.series,
          paymentMethod: form.paymentMethod,
          issueDate: new Date(),
          items: form.items,
          total: totals.total,
          notes: 'Canal: Online Manual'
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setForm({ client: '', receiptType: 'Boleta', series: 'B001', receiptNumber: '', paymentMethod: 'Tarjeta', items: [] })
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-1 rounded-lg bg-white border border-gray-200 p-1 shadow-sm">
        <button
          onClick={() => setTab('normal')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'normal' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Venta normal
        </button>
        <button
          onClick={() => setTab('manual')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Venta manual
        </button>
      </div>

      {tab==='normal' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    value={search}
                    onChange={e=>setSearch(e.target.value)}
                    placeholder="Buscar por número o cliente"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="hidden sm:block text-sm text-gray-600">
                {filteredOrders.length} pedido{filteredOrders.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          {loadingOrders ? (
            <div className="p-8 text-center text-gray-600">Cargando pedidos confirmados...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No hay pedidos confirmados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pedido</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cliente</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map(o => (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{o.saleNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{o.client.name}</div>
                        {o.client.documentNumber && (
                          <div className="text-sm text-gray-500">{o.client.documentNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {new Date(o.issueDate).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{formatMoney(o.total)}</td>
                      <td className="px-6 py-4">
                        <button
                          disabled={creating}
                          onClick={()=>completeSale(o._id)}
                          className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> Completar venta
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab==='manual' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
            <PlusCircle className="h-5 w-5 mr-2"/>Nueva venta manual
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-semibold text-gray-900">Cliente</label>
              <select value={form.client} onChange={e=>setForm({...form, client:e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg">
                <option value="">Seleccionar</option>
                {clients.map(c=> (<option key={c._id} value={c._id}>{c.name} - {c.documentNumber}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-900">Serie</label>
              <input value={form.series} onChange={e=>setForm({...form, series:e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-900">N° Comprobante</label>
              <input value={form.receiptNumber} onChange={e=>setForm({...form, receiptNumber:e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-semibold text-gray-900">Producto</label>
              <select value={currentItem.product} onChange={e=>{
                const p = products.find(pr=>pr._id===e.target.value)
                setCurrentItem({ product:e.target.value, quantity:1, priceAtSale:p?.price||0 })
              }} className="w-full mt-1 px-3 py-2 border rounded-lg">
                <option value="">Seleccionar</option>
                {products.map(p=> (<option key={p._id} value={p._id}>{p.name} - {formatMoney(p.price)} (Stock: {p.stock})</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-900">Cantidad</label>
              <input type="number" min={1} value={currentItem.quantity} onChange={e=>setCurrentItem({...currentItem, quantity: parseInt(e.target.value)||1})} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-900">Precio</label>
              <input type="number" step="0.01" min={0} value={currentItem.priceAtSale} onChange={e=>setCurrentItem({...currentItem, priceAtSale: parseFloat(e.target.value)||0})} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex items-end">
              <button type="button" onClick={addItem} className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Agregar
              </button>
            </div>
          </div>

          {form.items.length>0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-2">
                {form.items.map((it, idx)=> (
                  <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                    <div>
                      <div className="font-semibold text-gray-900">{products.find(p=>p._id===it.product)?.name || it.product}</div>
                      <div className="text-sm text-gray-600">
                        {it.quantity} x {formatMoney(it.priceAtSale)} = {formatMoney(it.quantity * it.priceAtSale)}
                      </div>
                    </div>
                    <button onClick={()=>removeItem(idx)} className="px-2 py-1 text-red-600 hover:text-red-700">
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 border-t border-gray-200 pt-4">
            <div className="text-right text-gray-900">
              <div>Subtotal: <span className="font-semibold">{formatMoney(totals.subtotal)}</span></div>
              <div>IGV (18%): <span className="font-semibold">{formatMoney(totals.igv)}</span></div>
              <div className="text-lg">Total: <span className="font-bold">{formatMoney(totals.total)}</span></div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button disabled={creating} onClick={submitManual} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
              Crear venta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
